import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMovieById,
  getMovies,
  rateMovie,
  searchMovies,
  type RateMovieError,
  type RateMovieInput,
  type RateMovieResponse,
} from "../api/movie";
import { getSession } from "../session/authSession";
import type { MovieDetails } from "../utils/movieDetails";

export const movieKeys = {
  all: ["movies"] as const,
  list: () => [...movieKeys.all, "list"] as const,
  search: (query: string) => [...movieKeys.all, "search", query] as const,
  detail: (id: number) => [...movieKeys.all, "detail", id] as const,
};

export function useMovieSearch(query: string) {
  const term = query.trim();
  return useQuery({
    queryKey: movieKeys.search(term),
    queryFn: ({ signal }) => searchMovies(term, signal),
    enabled: term.length >= 3,
  });
}

export function useMovies() {
  return useQuery({
    queryKey: movieKeys.list(),
    queryFn: getMovies,
  });
}

export function useMovie(id: number) {
  return useQuery({
    queryKey: movieKeys.detail(id),
    queryFn: () => getMovieById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useRateMovie() {
  const queryClient = useQueryClient();

  return useMutation<RateMovieResponse, RateMovieError, RateMovieInput>({
    mutationFn: rateMovie,
    onSuccess: (response) => {
      const { movie_id: movieId, rating, average_rating: averageRating } = response.data;

      queryClient.setQueryData<MovieDetails>(movieKeys.detail(movieId), (movie) =>
        movie
          ? {
              ...movie,
              user_rating: rating,
              mymovies_rating_average: averageRating,
            }
          : movie,
      );

      void queryClient.invalidateQueries({ queryKey: movieKeys.list() });
      void queryClient.invalidateQueries({ queryKey: [...movieKeys.all, "search"] });

      const handle = getSession()?.user.handle.trim();
      if (handle) {
        void queryClient.invalidateQueries({ queryKey: ["users", "ratings", handle] });
      }
    },
  });
}
