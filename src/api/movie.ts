import { useQuery } from "@tanstack/react-query";
import { api } from "../interceptor/api";
import type {
  MovieApiError,
  MovieDetails,
  MovieDetailsResponse,
} from "../utils/movieDetails";
import type { MoviesPage, MoviesResponse } from "../utils/moviePagination";

const isMovieApiError = (
  movie: MovieDetails | MovieApiError,
): movie is MovieApiError => "success" in movie && movie.success === false;

export const movieKeys = {
  all: ["movies"] as const,
  list: () => [...movieKeys.all, "list"] as const,
  detail: (id: number) => [...movieKeys.all, "detail", id] as const,
};

export async function getMovies(): Promise<MoviesPage> {
  const { data } = await api.get<MoviesResponse>("/movies");

  return data.movies;
}

export async function getMovieById(id: number): Promise<MovieDetails> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new TypeError("O ID do filme deve ser um número inteiro positivo.");
  }

  const { data } = await api.get<MovieDetailsResponse>(`/movies/${id}`);

  if (isMovieApiError(data.movie)) {
    throw new Error(data.movie.status_message);
  }

  return data.movie;
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
