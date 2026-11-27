import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  getPlaylistDetails,
  getPlaylists,
  PlaylistError,
} from "../../api/playlist";
import { getAuthSessionSnapshot } from "../../session/authSession";
import type {
  PlaylistDetailsPage,
  PlaylistPage,
} from "../../utils/playlist/playlist";
import { getMovieSessionScope } from "../movie";
import {
  PlaylistInfiniteData,
  playlistKeys,
  shouldRetry,
  useCurrentScope,
} from "./cache";

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
          getMovieSessionScope(
            snapshot.session.user.id,
            snapshot.generation,
          ) !== scope
        )
          throw new PlaylistError("Sua sessão foi alterada. Entre novamente.");
      };
      const readDetails = async (playlistId: number) => {
        const cached = queryClient.getQueryData<
          InfiniteData<PlaylistDetailsPage, number>
        >(playlistKeys.detail(scope, playlistId));
        if (
          cached?.pages.some((page) =>
            page.movies.some((movie) => movie.movie_id === movieId),
          )
        )
          return true;
        const firstPage = await getPlaylistDetails(
          playlistId,
          { page: 1, perPage: 100 },
          signal,
        );
        assertCurrentSession();
        if (firstPage.movies.some((movie) => movie.movie_id === movieId))
          return true;
        for (let page = 2; page <= firstPage.pages; page += 1) {
          const detailPage = await getPlaylistDetails(
            playlistId,
            { page, perPage: 100 },
            signal,
          );
          assertCurrentSession();
          if (detailPage.movies.some((movie) => movie.movie_id === movieId))
            return true;
        }
        return false;
      };
      assertCurrentSession();
      for (let page = 1; ; page += 1) {
        const playlistPage = await getPlaylists({ page, perPage: 100 }, signal);
        assertCurrentSession();
        for (const playlist of playlistPage.playlists)
          if (await readDetails(playlist.id)) return true;
        if (page >= playlistPage.pages)
          return queryClient.getQueryData<boolean>(queryKey) === true;
      }
    },
  });
}
