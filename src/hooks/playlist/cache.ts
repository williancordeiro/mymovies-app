import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { PlaylistError } from "../../api/playlist";
import { getAuthSessionSnapshot } from "../../session/authSession";
import type {
  PlaylistMetadata,
  PlaylistPage,
} from "../../utils/playlist/playlist";
import { useAuthSession } from "../auth";
import { getMovieSessionScope } from "../movie";

export type SessionScope = ReturnType<typeof getMovieSessionScope>;
export type PlaylistInfiniteData = InfiniteData<PlaylistPage, number>;

export const playlistKeys = {
  all: (scope: SessionScope) => ["playlists", scope] as const,
  list: (scope: SessionScope) => [...playlistKeys.all(scope), "list"] as const,
  detail: (scope: SessionScope, id: number) =>
    [...playlistKeys.all(scope), "detail", id] as const,
  membership: (scope: SessionScope, movieId: number) =>
    [...playlistKeys.all(scope), "membership", movieId] as const,
};

export function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = error instanceof PlaylistError ? error.status : undefined;
  return (!status || status >= 500) && failureCount < 2;
}

export function useCurrentScope() {
  const { session, generation, isRestored } = useAuthSession();
  return {
    scope: getMovieSessionScope(session?.user.id, generation),
    isRestored,
    hasSession: Boolean(session),
  };
}

export function assertSessionScope(scope: SessionScope): void {
  const snapshot = getAuthSessionSnapshot();
  if (
    !snapshot.isRestored ||
    !snapshot.session ||
    getMovieSessionScope(snapshot.session.user.id, snapshot.generation) !==
      scope
  ) {
    throw new PlaylistError("Sua sessão foi alterada. Entre novamente.");
  }
}

export async function confirmMoviePlaylistMembership(
  queryClient: QueryClient,
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

export function invalidatePlaylist(
  queryClient: QueryClient,
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

export function replacePlaylistMetadata(
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
