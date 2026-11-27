import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  createPlaylist,
  deletePlaylist,
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
const playlistUpdates = new Map<string, Promise<unknown>>();

function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = error instanceof PlaylistError ? error.status : undefined;
  return (!status || status >= 500) && failureCount < 2;
}

export const playlistKeys = {
  all: (scope: SessionScope) => ["playlists", scope] as const,
  list: (scope: SessionScope) => [...playlistKeys.all(scope), "list"] as const,
  detail: (scope: SessionScope, id: number) =>
    [...playlistKeys.all(scope), "detail", id] as const,
  membership: (scope: SessionScope, movieId: number) =>
    [...playlistKeys.all(scope), "membership", movieId] as const,
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

function hasMovieInDetailPages(
  data: InfiniteData<PlaylistDetailsPage, number> | undefined,
  movieId: number,
): boolean {
  return Boolean(
    data?.pages.some((page) =>
      page.movies.some((movie) => movie.movie_id === movieId),
    ),
  );
}

export function useMoviePlaylistMembership(movieId: number) {
  const queryClient = useQueryClient();
  const { scope, isRestored, hasSession } = useCurrentScope();
  const queryKey = playlistKeys.membership(scope, movieId);

  return useQuery<
    boolean,
    PlaylistError,
    boolean,
    ReturnType<typeof playlistKeys.membership>
  >({
    queryKey,
    enabled:
      isRestored && hasSession && Number.isInteger(movieId) && movieId > 0,
    retry: shouldRetry,
    queryFn: async ({ signal }) => {
      if (queryClient.getQueryData<boolean>(queryKey) === true) return true;

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
      const readDetails = async (playlistId: number) => {
        const cached = queryClient.getQueryData<
          InfiniteData<PlaylistDetailsPage, number>
        >(playlistKeys.detail(scope, playlistId));
        if (hasMovieInDetailPages(cached, movieId)) return true;

        const firstPage = await getPlaylistDetails(
          playlistId,
          { page: 1, perPage: 100 },
          signal,
        );
        assertCurrentSession();
        if (firstPage.movies.some((movie) => movie.movie_id === movieId)) {
          return true;
        }

        for (let page = 2; page <= firstPage.pages; page += 1) {
          const detailPage = await getPlaylistDetails(
            playlistId,
            { page, perPage: 100 },
            signal,
          );
          assertCurrentSession();
          if (detailPage.movies.some((movie) => movie.movie_id === movieId)) {
            return true;
          }
        }

        return false;
      };

      assertCurrentSession();
      for (let page = 1; ; page += 1) {
        const playlistPage = await getPlaylists(
          { page, perPage: 100 },
          signal,
        );
        assertCurrentSession();

        for (const playlist of playlistPage.playlists) {
          if (await readDetails(playlist.id)) return true;
        }

        if (page >= playlistPage.pages) {
          return queryClient.getQueryData<boolean>(queryKey) === true;
        }
      }
    },
  });
}

async function confirmMoviePlaylistMembership(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: SessionScope,
  movieId: number,
): Promise<boolean> {
  const queryKey = playlistKeys.membership(scope, movieId);
  try {
    await queryClient.cancelQueries({ queryKey, exact: true });
  } catch {
    // A confirmed write must not fail because a background read could not stop.
  }

  const snapshot = getAuthSessionSnapshot();
  const currentScope = getMovieSessionScope(
    snapshot.session?.user.id,
    snapshot.generation,
  );
  if (!snapshot.isRestored || !snapshot.session || currentScope !== scope) {
    return false;
  }

  queryClient.setQueryData<boolean>(queryKey, true);
  return true;
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
    onSuccess: async (response, input, context) => {
      if (!context) return;
      const snapshot = getAuthSessionSnapshot();
      const currentScope = getMovieSessionScope(
        snapshot.session?.user.id,
        snapshot.generation,
      );
      if (currentScope !== context.scope) return;

      const key = playlistKeys.list(context.scope);
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

export type RenamePlaylistInput = { playlistId: number; title: string };
export type RemoveMovieFromPlaylistInput = {
  playlistId: number;
  movieId: number;
};
export type RemoveMovieFromPlaylistResult = { removed: boolean };
export type DeletePlaylistInput = { playlistId: number };

function assertSessionScope(scope: SessionScope): void {
  const snapshot = getAuthSessionSnapshot();
  if (
    !snapshot.isRestored ||
    !snapshot.session ||
    getMovieSessionScope(snapshot.session.user.id, snapshot.generation) !== scope
  ) {
    throw new PlaylistError("Sua sessão foi alterada. Entre novamente.");
  }
}

function queuePlaylistMutation<T>(
  scope: SessionScope,
  playlistId: number,
  task: () => Promise<T>,
): Promise<T> {
  const key = `${scope}:${playlistId}`;
  const previous = playlistUpdates.get(key) ?? Promise.resolve();
  const request = previous.catch(() => undefined).then(task);
  playlistUpdates.set(key, request);
  void request.finally(() => {
    if (playlistUpdates.get(key) === request) playlistUpdates.delete(key);
  }).catch(() => undefined);
  return request;
}

async function readAllPlaylistDetails(
  playlistId: number,
  scope: SessionScope,
): Promise<PlaylistDetailsPage[]> {
  assertSessionScope(scope);
  const firstPage = await getPlaylistDetails(playlistId, { page: 1, perPage: 100 });
  assertSessionScope(scope);
  const pages = [firstPage];
  for (let page = 2; page <= firstPage.pages; page += 1) {
    pages.push(await getPlaylistDetails(playlistId, { page, perPage: 100 }));
    assertSessionScope(scope);
  }
  return pages;
}

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

function invalidatePlaylist(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: SessionScope,
  playlistId: number,
): void {
  void queryClient.invalidateQueries({
    queryKey: playlistKeys.list(scope),
    refetchType: "active",
  });
  void queryClient.invalidateQueries({
    queryKey: playlistKeys.detail(scope, playlistId),
    refetchType: "active",
  });
}

function replacePlaylistMetadata(
  data: PlaylistInfiniteData | undefined,
  playlist: PlaylistMetadata,
): PlaylistInfiniteData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      playlists: page.playlists.map((item) =>
        item.id === playlist.id ? { ...item, ...playlist } : item,
      ),
    })),
  };
}

function removePlaylistFromCache(
  data: PlaylistInfiniteData | undefined,
  playlistId: number,
): PlaylistInfiniteData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      playlists: page.playlists.filter((item) => item.id !== playlistId),
      total: Math.max(0, page.total - (page.playlists.some((item) => item.id === playlistId) ? 1 : 0)),
    })),
  };
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
        const response = await updatePlaylist({ id: input.playlistId, title: input.title });
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
        (data) => data
          ? { ...data, pages: data.pages.map((page) => ({ ...page, playlist: response.data })) }
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
    mutationFn: (input) => queuePlaylistMutation(scope, input.playlistId, async () => {
      const pages = await readAllPlaylistDetails(input.playlistId, scope);
      const movieIds = pages.flatMap((page) => page.movies.map((movie) => movie.movie_id));
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
    onMutate: (input) => ({ scope, playlistId: input.playlistId, movieId: input.movieId }),
    onSuccess: (result, _input, context) => {
      if (!context) return;
      try { assertSessionScope(context.scope); } catch { return; }
      if (result.removed) invalidatePlaylist(queryClient, context.scope, context.playlistId);
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
    mutationFn: (input) => queuePlaylistMutation(scope, input.playlistId, async () => {
      assertSessionScope(scope);
      await deletePlaylist(input.playlistId);
      assertSessionScope(scope);
    }),
    onMutate: (input) => ({ scope, playlistId: input.playlistId }),
    onSuccess: (_result, _input, context) => {
      if (!context) return;
      try { assertSessionScope(context.scope); } catch { return; }
      queryClient.removeQueries({ queryKey: playlistKeys.detail(context.scope, context.playlistId), exact: true });
      queryClient.setQueryData<PlaylistInfiniteData>(
        playlistKeys.list(context.scope),
        (data) => removePlaylistFromCache(data, context.playlistId),
      );
      void queryClient.invalidateQueries({ queryKey: playlistKeys.list(context.scope), refetchType: "active" });
      void queryClient.invalidateQueries({
        queryKey: [...playlistKeys.all(context.scope), "membership"],
      });
    },
    retry: false,
  });
}
