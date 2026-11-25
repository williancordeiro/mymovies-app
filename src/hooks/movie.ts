import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import {
  addFavorite, getFavorites, getMovieById, getMovies, rateMovie, removeFavorite, searchMovies,
  type FavoriteError, type FavoriteMutationResponse, type RateMovieError, type RateMovieInput, type RateMovieResponse,
} from "../api/movie";
import { getAuthSessionSnapshot, getSession } from "../session/authSession";
import { useAuthSession } from "./auth";
import type { MovieDetails } from "../utils/movieDetails";

type SessionScope = "anonymous" | `user:${number}:${number}`;
const favoriteMutations = new Map<string, Promise<FavoriteMutationResponse>>();

export function getMovieSessionScope(userId: number | undefined, generation: number): SessionScope {
  return userId === undefined ? "anonymous" : `user:${userId}:${generation}`;
}

function shouldRetry(error: unknown, failureCount: number): boolean {
  const status = error instanceof Error && "status" in error ? (error as { status?: number }).status : undefined;
  return (!status || status >= 500) && failureCount < 2;
}

export const movieKeys = {
  all: (scope: SessionScope) => ["movies", scope] as const,
  list: (scope: SessionScope) => [...movieKeys.all(scope), "list"] as const,
  search: (scope: SessionScope, query: string) => [...movieKeys.all(scope), "search", query] as const,
  detail: (scope: SessionScope, id: number) => [...movieKeys.all(scope), "detail", id] as const,
};

export const favoriteKeys = {
  all: (scope: SessionScope) => ["favorites", scope] as const,
  list: (scope: SessionScope) => [...favoriteKeys.all(scope), "list"] as const,
};

function useCurrentScope() {
  const { session, generation, isRestored } = useAuthSession();
  return { scope: getMovieSessionScope(session?.user.id, generation), isRestored, hasSession: Boolean(session) };
}

export function useMovieSearch(query: string) {
  const term = query.trim();
  const { scope, isRestored } = useCurrentScope();
  return useQuery({ queryKey: movieKeys.search(scope, term), queryFn: ({ signal }) => searchMovies(term, signal), enabled: isRestored && term.length >= 3 });
}

export function useMovies() {
  const { scope, isRestored } = useCurrentScope();
  return useQuery({ queryKey: movieKeys.list(scope), queryFn: getMovies, enabled: isRestored });
}

export function useMovie(id: number) {
  const { scope, isRestored } = useCurrentScope();
  return useQuery({ queryKey: movieKeys.detail(scope, id), queryFn: () => getMovieById(id), enabled: isRestored && Number.isInteger(id) && id > 0 });
}

export function useFavorites() {
  const { scope, isRestored, hasSession } = useCurrentScope();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: favoriteKeys.list(scope),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => getFavorites({ page: pageParam, perPage: 20 }, signal),
    getNextPageParam: (lastPage) => lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
    enabled: isRestored && hasSession,
    retry: shouldRetry,
  });
  const refreshFromStart = async () => {
    queryClient.setQueryData<InfiniteData<Awaited<ReturnType<typeof getFavorites>>, number>>(
      favoriteKeys.list(scope),
      (data) => data ? { pages: data.pages.slice(0, 1), pageParams: [1] } : data,
    );
    return query.refetch();
  };
  return { ...query, refreshFromStart };
}

export type SetMovieFavoriteInput = { movieId: number; favorited: boolean };
type FavoriteMutationContext = { scope: SessionScope };

export function useSetMovieFavorite() {
  const queryClient = useQueryClient();
  const { scope } = useCurrentScope();

  return useMutation<FavoriteMutationResponse, FavoriteError, SetMovieFavoriteInput, FavoriteMutationContext>({
    mutationFn: (input) => {
      const key = `${scope}:${input.movieId}`;
      const existing = favoriteMutations.get(key);
      if (existing) return existing;
      const request = (input.favorited ? addFavorite(input.movieId) : removeFavorite(input.movieId))
        .finally(() => favoriteMutations.delete(key));
      favoriteMutations.set(key, request);
      return request;
    },
    onMutate: () => ({ scope }),
    onSuccess: (response, _variables, context) => {
      if (!context) return;
      const snapshot = getAuthSessionSnapshot();
      const currentScope = getMovieSessionScope(snapshot.session?.user.id, snapshot.generation);
      if (context.scope !== currentScope) return;

      const { movie_id: movieId, user_favorited: userFavorited } = response.data;
      queryClient.setQueryData<MovieDetails>(movieKeys.detail(context.scope, movieId), (movie) => movie ? { ...movie, user_favorited: userFavorited } : movie);
      void queryClient.invalidateQueries({ queryKey: movieKeys.list(context.scope) });
      void queryClient.invalidateQueries({ queryKey: [...movieKeys.all(context.scope), "search"] });
      const favoritesKey = favoriteKeys.list(context.scope);
      queryClient.setQueryData<InfiniteData<Awaited<ReturnType<typeof getFavorites>>, number>>(
        favoritesKey,
        (data) => data ? { pages: data.pages.slice(0, 1), pageParams: [1] } : data,
      );
      // A refetch is deliberately detached from the confirmed mutation: a later
      // list error must remain a query error and never turn the write into one.
      void queryClient.invalidateQueries({ queryKey: favoritesKey, refetchType: "active" });
    },
    retry: false,
  });
}

export function useRateMovie() {
  const queryClient = useQueryClient();
  const { scope } = useCurrentScope();
  return useMutation<RateMovieResponse, RateMovieError, RateMovieInput, FavoriteMutationContext>({
    mutationFn: rateMovie,
    onMutate: () => ({ scope }),
    onSuccess: (response, _variables, context) => {
      if (!context) return;
      const snapshot = getAuthSessionSnapshot();
      const currentScope = getMovieSessionScope(snapshot.session?.user.id, snapshot.generation);
      if (context.scope !== currentScope) return;

      const { movie_id: movieId, rating, average_rating: averageRating } = response.data;
      queryClient.setQueryData<MovieDetails>(movieKeys.detail(context.scope, movieId), (movie) => movie ? { ...movie, user_rating: rating, mymovies_rating_average: averageRating } : movie);
      void queryClient.invalidateQueries({ queryKey: movieKeys.list(context.scope) });
      void queryClient.invalidateQueries({ queryKey: [...movieKeys.all(context.scope), "search"] });
      const handle = getSession()?.user.handle.trim();
      if (handle) void queryClient.invalidateQueries({ queryKey: ["users", "ratings", handle] });
    },
  });
}
