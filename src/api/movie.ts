import { api } from "../interceptor/api";
import type { Movie } from "../utils/movie";
import type {
  MovieApiError,
  MovieDetails,
  MovieDetailsResponse,
} from "../utils/movieDetails";
import type { MoviesPage, MoviesResponse } from "../utils/moviePagination";

const isMovieApiError = (
  movie: MovieDetails | MovieApiError,
): movie is MovieApiError => "success" in movie && movie.success === false;

export async function searchMovies(query: string, signal?: AbortSignal): Promise<Movie[]> {
  const { data } = await api.get<{ results: Movie[] }>("/movies/search", {
    params: { q: query.trim() },
    signal,
  });

  return data.results;
}

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
