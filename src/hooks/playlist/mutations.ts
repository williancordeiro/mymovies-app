import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  createPlaylist,
  deletePlaylist,
  getPlaylistDetails,
  PlaylistError,
  updatePlaylist,
} from "../../api/playlist";
import { getAuthSessionSnapshot } from "../../session/authSession";
import type {
  CreatePlaylistInput,
  CreatePlaylistResponse,
  PlaylistDetailsPage,
} from "../../utils/playlist/playlist";
import { getMovieSessionScope } from "../movie";
import {
  assertSessionScope,
  confirmMoviePlaylistMembership,
  invalidatePlaylist,
  playlistKeys,
  replacePlaylistMetadata,
  useCurrentScope,
  type PlaylistInfiniteData,
  type SessionScope,
} from "./cache";

const pendingCreations = new Map<string, Promise<CreatePlaylistResponse>>();
const playlistUpdates = new Map<string, Promise<unknown>>();

function queuePlaylistMutation<T>(
  scope: SessionScope,
  playlistId: number,
  task: () => Promise<T>,
): Promise<T> {
  const key = `${scope}:${playlistId}`;
  const previous = playlistUpdates.get(key) ?? Promise.resolve();
  const request = previous.catch(() => undefined).then(task);
  playlistUpdates.set(key, request);
  void request
    .finally(() => {
      if (playlistUpdates.get(key) === request) playlistUpdates.delete(key);
    })
    .catch(() => undefined);
  return request;
}

async function readAllPlaylistDetails(
  playlistId: number,
  scope: SessionScope,
): Promise<PlaylistDetailsPage[]> {
  assertSessionScope(scope);
  const firstPage = await getPlaylistDetails(playlistId, {
    page: 1,
    perPage: 100,
  });
  assertSessionScope(scope);
  const pages = [firstPage];
  for (let page = 2; page <= firstPage.pages; page += 1) {
    pages.push(await getPlaylistDetails(playlistId, { page, perPage: 100 }));
    assertSessionScope(scope);
  }
  return pages;
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  const { scope } = useCurrentScope();

  return useMutation<
    CreatePlaylistResponse,
    PlaylistError,
    CreatePlaylistInput,
    { scope: SessionScope }
  >({
    mutationFn: (input) => {
      const key = `${scope}:${JSON.stringify(input)}`;
      const existing = pendingCreations.get(key);
      if (existing) return existing;

      const request = createPlaylist(input).finally(() => {
        pendingCreations.delete(key);
      });
      pendingCreations.set(key, request);
      return request;
    },
    onMutate: () => ({ scope }),
    onSuccess: async (_response, input, context) => {
      if (!context) return;
      const snapshot = getAuthSessionSnapshot();
      const currentScope = getMovieSessionScope(
        snapshot.session?.user.id,
        snapshot.generation,
      );
      if (currentScope !== context.scope) return;

      for (const movieId of input.movieIds ?? []) {
        if (
          !(await confirmMoviePlaylistMembership(
            queryClient,
            context.scope,
            movieId,
          ))
        ) {
          return;
        }
      }
      // A partial infinite cache cannot safely absorb a new first item without
      // dropping or duplicating entries from later cached pages. Invalidation
      // keeps every cached page intact until it is refreshed for this session.
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.list(context.scope),
        refetchType: "active",
      });
    },
    retry: false,
  });
}

export type AddMovieToPlaylistInput = { playlistId: number; movieId: number };
export type AddMovieToPlaylistResult = { added: boolean };

export type RenamePlaylistInput = { playlistId: number; title: string };
export type RemoveMovieFromPlaylistInput = {
  playlistId: number;
  movieId: number;
};
export type RemoveMovieFromPlaylistResult = { removed: boolean };
export type DeletePlaylistInput = { playlistId: number };

async function addMovieToPlaylist(
  { playlistId, movieId }: AddMovieToPlaylistInput,
  scope: SessionScope,
): Promise<AddMovieToPlaylistResult> {
  const pages = await readAllPlaylistDetails(playlistId, scope);
  const firstPage = pages[0];
  const movieIds = pages.flatMap((page) =>
    page.movies.map((movie) => movie.movie_id),
  );
  if (movieIds.includes(movieId)) return { added: false };

  assertSessionScope(scope);
  await updatePlaylist({
    id: playlistId,
    title: firstPage.playlist.title,
    movieIds: [...new Set([...movieIds, movieId])],
  });
  assertSessionScope(scope);
  return { added: true };
}

export function useAddMovieToPlaylist() {
  const queryClient = useQueryClient();
  const { scope, isRestored, hasSession } = useCurrentScope();
  return useMutation<
    AddMovieToPlaylistResult,
    PlaylistError,
    AddMovieToPlaylistInput,
    { scope: SessionScope; playlistId: number }
  >({
    mutationFn: (input) => {
      const snapshot = getAuthSessionSnapshot();
      if (
        !isRestored ||
        !hasSession ||
        !snapshot.isRestored ||
        !snapshot.session ||
        getMovieSessionScope(snapshot.session.user.id, snapshot.generation) !==
          scope
      ) {
        throw new PlaylistError("Sua sessão expirou. Entre novamente.");
      }
      return queuePlaylistMutation(scope, input.playlistId, () =>
        addMovieToPlaylist(input, scope),
      );
    },
    onMutate: (input) => ({ scope, playlistId: input.playlistId }),
    onSuccess: async (result, input, context) => {
      if (!context) return;
      const snapshot = getAuthSessionSnapshot();
      const currentScope = getMovieSessionScope(
        snapshot.session?.user.id,
        snapshot.generation,
      );
      if (currentScope !== context.scope) return;
      if (
        !(await confirmMoviePlaylistMembership(
          queryClient,
          context.scope,
          input.movieId,
        ))
      ) {
        return;
      }
      if (!result.added) return;
      // The write is already confirmed. Refresh failures remain query errors.
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.detail(context.scope, context.playlistId),
        refetchType: "active",
      });
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.list(context.scope),
        refetchType: "active",
      });
    },
    retry: false,
  });
}

export function useRenamePlaylist() {
  const queryClient = useQueryClient();
  const { scope } = useCurrentScope();
  return useMutation<
    CreatePlaylistResponse,
    PlaylistError,
    RenamePlaylistInput,
    { scope: SessionScope; playlistId: number }
  >({
    mutationFn: (input) =>
      queuePlaylistMutation(scope, input.playlistId, async () => {
        assertSessionScope(scope);
        const response = await updatePlaylist({
          id: input.playlistId,
          title: input.title,
        });
        assertSessionScope(scope);
        return response;
      }),
    onMutate: (input) => ({ scope, playlistId: input.playlistId }),
    onSuccess: (response, _input, context) => {
      if (!context) return;
      try {
        assertSessionScope(context.scope);
      } catch {
        return;
      }
      queryClient.setQueryData<InfiniteData<PlaylistDetailsPage, number>>(
        playlistKeys.detail(context.scope, context.playlistId),
        (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  playlist: response.data,
                })),
              }
            : data,
      );
      queryClient.setQueryData<PlaylistInfiniteData>(
        playlistKeys.list(context.scope),
        (data) => replacePlaylistMetadata(data, response.data),
      );
      invalidatePlaylist(queryClient, context.scope, context.playlistId);
    },
    retry: false,
  });
}

export function useRemoveMovieFromPlaylist() {
  const queryClient = useQueryClient();
  const { scope } = useCurrentScope();
  return useMutation<
    RemoveMovieFromPlaylistResult,
    PlaylistError,
    RemoveMovieFromPlaylistInput,
    { scope: SessionScope; playlistId: number; movieId: number }
  >({
    mutationFn: (input) =>
      queuePlaylistMutation(scope, input.playlistId, async () => {
        const pages = await readAllPlaylistDetails(input.playlistId, scope);
        const movieIds = pages.flatMap((page) =>
          page.movies.map((movie) => movie.movie_id),
        );
        if (!movieIds.includes(input.movieId)) return { removed: false };
        assertSessionScope(scope);
        await updatePlaylist({
          id: input.playlistId,
          title: pages[0].playlist.title,
          movieIds: movieIds.filter((movieId) => movieId !== input.movieId),
        });
        assertSessionScope(scope);
        return { removed: true };
      }),
    onMutate: (input) => ({
      scope,
      playlistId: input.playlistId,
      movieId: input.movieId,
    }),
    onSuccess: (result, _input, context) => {
      if (!context) return;
      try {
        assertSessionScope(context.scope);
      } catch {
        return;
      }
      if (result.removed)
        invalidatePlaylist(queryClient, context.scope, context.playlistId);
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.membership(context.scope, context.movieId),
        exact: true,
      });
    },
    retry: false,
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  const { scope } = useCurrentScope();
  return useMutation<
    void,
    PlaylistError,
    DeletePlaylistInput,
    { scope: SessionScope; playlistId: number }
  >({
    mutationFn: (input) =>
      queuePlaylistMutation(scope, input.playlistId, async () => {
        assertSessionScope(scope);
        await deletePlaylist(input.playlistId);
        assertSessionScope(scope);
      }),
    onMutate: (input) => ({ scope, playlistId: input.playlistId }),
    onSuccess: (_result, _input, context) => {
      if (!context) return;
      try {
        assertSessionScope(context.scope);
      } catch {
        return;
      }
      queryClient.removeQueries({
        queryKey: playlistKeys.detail(context.scope, context.playlistId),
        exact: true,
      });
      // Keep partially cached pages intact and refetch them before reuse.
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.list(context.scope),
        refetchType: "active",
      });
      void queryClient.invalidateQueries({
        queryKey: [...playlistKeys.all(context.scope), "membership"],
      });
    },
    retry: false,
  });
}
