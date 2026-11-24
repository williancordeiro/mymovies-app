import { isAxiosError } from "axios";

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

export type RateMovieInput = {
  movieId: number;
  rating: number;
};

export type RateMovieResponse = {
  success: true;
  message: string;
  data: {
    movie_id: number;
    rating: number;
    average_rating: number;
  };
};

type RateMovieErrorResponse = {
  error?: unknown;
  message?: unknown;
};

export class RateMovieError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "RateMovieError";
    this.status = status;
  }
}

function getRateMovieError(error: unknown): RateMovieError {
  if (isAxiosError<RateMovieErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = typeof data?.error === "string" && data.error.trim()
      ? data.error
      : typeof data?.message === "string" && data.message.trim()
        ? data.message
        : status
          ? "Não foi possível salvar sua avaliação. Tente novamente."
          : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

    return new RateMovieError(message, status);
  }

  return new RateMovieError("Ocorreu um erro inesperado ao salvar sua avaliação. Tente novamente.");
}

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

export async function rateMovie({ movieId, rating }: RateMovieInput): Promise<RateMovieResponse> {
  if (!Number.isInteger(movieId) || movieId <= 0) {
    throw new RateMovieError("O ID do filme é inválido.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new RateMovieError("Selecione uma nota de 1 a 5 estrelas.");
  }

  try {
    const { data } = await api.post<RateMovieResponse>("/movies/rate", {
      movie_id: movieId,
      rating,
    });

    return data;
  } catch (error) {
    throw getRateMovieError(error);
  }
}
