import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  createPlaylist,
  getPlaylistDetails,
  getPlaylists,
  PlaylistError,
  updatePlaylist,
} from "../api/playlist";
import { getAuthSessionSnapshot } from "../session/authSession";
import type {
  CreatePlaylistInput,
  CreatePlaylistResponse,
  PlaylistDetailsPage,
  PlaylistMetadata,
  PlaylistPage,
} from "../utils/playlist/playlist";
import { useAuthSession } from "./auth";
import { getMovieSessionScope } from "./movie";

type SessionScope = ReturnType<typeof getMovieSessionScope>;
type PlaylistInfiniteData = InfiniteData<PlaylistPage, number>;

const pendingCreations = new Map<string, Promise<CreatePlaylistResponse>>();
const playlistUpdates = new Map<string, Promise<AddMovieToPlaylistResult>>();

function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = error instanceof PlaylistError ? error.status : undefined;
  return (!status || status >= 500) && failureCount < 2;
}

export const playlistKeys = {
  all: (scope: SessionScope) => ["playlists", scope] as const,
  list: (scope: SessionScope) => [...playlistKeys.all(scope), "list"] as const,
  detail: (scope: SessionScope, id: number) =>
    [...playlistKeys.all(scope), "detail", id] as const,
};

function useCurrentScope() {
  const { session, generation, isRestored } = useAuthSession();
  return {
    scope: getMovieSessionScope(session?.user.id, generation),
    isRestored,
    hasSession: Boolean(session),
  };
}

export function usePlaylistDetails(id: number) {
  const { scope, isRestored, hasSession } = useCurrentScope();
  const queryClient = useQueryClient();
  const queryKey = playlistKeys.detail(scope, id);
  const query = useInfiniteQuery<
    PlaylistDetailsPage,
    PlaylistError,
    InfiniteData<PlaylistDetailsPage, number>,
    ReturnType<typeof playlistKeys.detail>,
    number
  >({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getPlaylistDetails(id, { page: pageParam, perPage: 20 }, signal),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
    enabled: isRestored && hasSession && Number.isInteger(id) && id > 0,
    retry: shouldRetry,
  });
  const refreshFromStart = async () => {
    queryClient.setQueryData<InfiniteData<PlaylistDetailsPage, number>>(
      queryKey,
      (data) =>
        data ? { pages: data.pages.slice(0, 1), pageParams: [1] } : data,
    );
    return query.refetch();
  };
  return { ...query, refreshFromStart };
}

export function usePlaylists() {
  const { scope, isRestored, hasSession } = useCurrentScope();
  const queryClient = useQueryClient();
  const queryKey = playlistKeys.list(scope);
  const query = useInfiniteQuery<
    PlaylistPage,
    PlaylistError,
    PlaylistInfiniteData,
    ReturnType<typeof playlistKeys.list>,
    number
  >({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getPlaylists({ page: pageParam, perPage: 20 }, signal),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
    enabled: isRestored && hasSession,
    retry: shouldRetry,
  });

  const refreshFromStart = async () => {
    queryClient.setQueryData<PlaylistInfiniteData>(queryKey, (data) =>
      data ? { pages: data.pages.slice(0, 1), pageParams: [1] } : data,
    );
    return query.refetch();
  };

  return { ...query, refreshFromStart };
}

function prependPlaylist(
  data: PlaylistInfiniteData | undefined,
  playlist: PlaylistMetadata,
): PlaylistInfiniteData | undefined {
  if (!data?.pages.length) return data;

  const [firstPage, ...rest] = data.pages;
  const alreadyPresent = firstPage.playlists.some(
    (item) => item.id === playlist.id,
  );
  const playlists = [
    playlist,
    ...firstPage.playlists.filter((item) => item.id !== playlist.id),
  ].slice(0, firstPage.per_page);
  const total = alreadyPresent ? firstPage.total : firstPage.total + 1;

  return {
    pageParams: [1, ...data.pageParams.slice(1)],
    pages: [
      {
        ...firstPage,
        playlists,
        total,
        pages: Math.ceil(total / firstPage.per_page),
      },
      ...rest,
    ],
  };
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
      const existing = pendingCreations.get(scope);
      if (existing) return existing;

      const request = createPlaylist(input).finally(() => {
        pendingCreations.delete(scope);
      });
      pendingCreations.set(scope, request);
      return request;
    },
    onMutate: () => ({ scope }),
    onSuccess: (response, _input, context) => {
      if (!context) return;
      const snapshot = getAuthSessionSnapshot();
      const currentScope = getMovieSessionScope(
        snapshot.session?.user.id,
        snapshot.generation,
      );
      if (currentScope !== context.scope) return;

      const key = playlistKeys.list(context.scope);
      queryClient.setQueryData<PlaylistInfiniteData>(key, (data) =>
        prependPlaylist(data, response.data),
      );
      // The mutation is confirmed independently. A later list refresh error must
      // stay recoverable in the query state instead of changing this success.
      void queryClient.invalidateQueries({
        queryKey: key,
        refetchType: "active",
      });
    },
    retry: false,
  });
}

export type AddMovieToPlaylistInput = { playlistId: number; movieId: number };
export type AddMovieToPlaylistResult = { added: boolean };

async function addMovieToPlaylist(
  { playlistId, movieId }: AddMovieToPlaylistInput,
  scope: SessionScope,
): Promise<AddMovieToPlaylistResult> {
  const assertCurrentSession = () => {
    const snapshot = getAuthSessionSnapshot();
    if (
      !snapshot.isRestored ||
      !snapshot.session ||
      getMovieSessionScope(snapshot.session.user.id, snapshot.generation) !==
        scope
    ) {
      throw new PlaylistError("Sua sessão foi alterada. Entre novamente.");
    }
  };
  assertCurrentSession();
  const firstPage = await getPlaylistDetails(playlistId, {
    page: 1,
    perPage: 100,
  });
  assertCurrentSession();
  const pages: PlaylistDetailsPage[] = [firstPage];
  for (let page = 2; page <= firstPage.pages; page += 1) {
    assertCurrentSession();
    pages.push(await getPlaylistDetails(playlistId, { page, perPage: 100 }));
    assertCurrentSession();
  }
  const movieIds = pages.flatMap((page) =>
    page.movies.map((movie) => movie.movie_id),
  );
  if (movieIds.includes(movieId)) return { added: false };

  assertCurrentSession();
  await updatePlaylist({
    id: playlistId,
    title: firstPage.playlist.title,
    movieIds: [...new Set([...movieIds, movieId])],
  });
  assertCurrentSession();
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
      const key = `${scope}:${input.playlistId}`;
      const previous =
        playlistUpdates.get(key) ?? Promise.resolve({ added: false });
      const request = previous
        .catch(() => ({ added: false }))
        .then(() => addMovieToPlaylist(input, scope));
      playlistUpdates.set(key, request);
      void request
        .finally(() => {
          if (playlistUpdates.get(key) === request) playlistUpdates.delete(key);
        })
        .catch(() => undefined);
      return request;
    },
    onMutate: (input) => ({ scope, playlistId: input.playlistId }),
    onSuccess: (result, _input, context) => {
      if (!context || !result.added) return;
      const snapshot = getAuthSessionSnapshot();
      const currentScope = getMovieSessionScope(
        snapshot.session?.user.id,
        snapshot.generation,
      );
      if (currentScope !== context.scope) return;
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
