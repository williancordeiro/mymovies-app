import { isAxiosError } from "axios";

import { api } from "../interceptor/api";
import type {
  FavoriteErrorResponse,
  FavoriteMutationResponse,
  FavoritesPage,
  FavoritesRequest,
} from "../utils/movies/favorite";
import type {
  MovieApiError,
  MovieDetails,
  MovieDetailsResponse,
} from "../utils/movies/movieDetails";
import type { Movie, MovieSearchResponse } from "../utils/movies/movie";
import type { MoviesPage, MoviesResponse } from "../utils/movies/moviePagination";
import type {
  RateMovieErrorResponse,
  RateMovieInput,
  RateMovieResponse,
} from "../utils/movies/rating";

export class FavoriteError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "FavoriteError";
    this.status = status;
  }
}

function getFavoriteError(error: unknown): FavoriteError {
  if (isAxiosError<FavoriteErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message =
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : typeof data?.message === "string" && data.message.trim()
          ? data.message
          : status === 404
            ? "Este filme não está disponível para favoritos."
            : status === 502
              ? "O serviço de filmes está indisponível. Tente novamente."
              : status
                ? "Não foi possível atualizar seus favoritos. Tente novamente."
                : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
    return new FavoriteError(message, status);
  }

  return new FavoriteError(
    "Ocorreu um erro inesperado ao atualizar seus favoritos. Tente novamente.",
  );
}

function assertMovieId(movieId: number): void {
  if (!Number.isInteger(movieId) || movieId <= 0 || movieId > 4_294_967_295) {
    throw new FavoriteError("O ID do filme é inválido.");
  }
}

export async function getFavorites(
  { page, perPage }: FavoritesRequest,
  signal?: AbortSignal,
): Promise<FavoritesPage> {
  if (
    !Number.isInteger(page) ||
    page <= 0 ||
    !Number.isInteger(perPage) ||
    perPage <= 0 ||
    perPage > 100
  ) {
    throw new FavoriteError("A página de favoritos é inválida.");
  }

  try {
    const { data } = await api.get<FavoritesPage>("/favorites", {
      params: { page, per_page: perPage },
      signal,
    });
    return data;
  } catch (error) {
    throw getFavoriteError(error);
  }
}

export async function addFavorite(
  movieId: number,
): Promise<FavoriteMutationResponse> {
  assertMovieId(movieId);
  try {
    const { data } = await api.post<FavoriteMutationResponse>(
      "/movies/favorites",
      { movie_id: movieId },
    );
    return data;
  } catch (error) {
    throw getFavoriteError(error);
  }
}

export async function removeFavorite(
  movieId: number,
): Promise<FavoriteMutationResponse> {
  assertMovieId(movieId);
  try {
    const { data } = await api.delete<FavoriteMutationResponse>(
      `/movies/favorites/${movieId}`,
    );
    return data;
  } catch (error) {
    throw getFavoriteError(error);
  }
}

const isMovieApiError = (
  movie: MovieDetails | MovieApiError,
): movie is MovieApiError => "success" in movie && movie.success === false;

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
    const message =
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : typeof data?.message === "string" && data.message.trim()
          ? data.message
          : status
            ? "Não foi possível salvar sua avaliação. Tente novamente."
            : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

    return new RateMovieError(message, status);
  }

  return new RateMovieError(
    "Ocorreu um erro inesperado ao salvar sua avaliação. Tente novamente.",
  );
}

export async function searchMovies(
  query: string,
  signal?: AbortSignal,
): Promise<Movie[]> {
  const { data } = await api.get<MovieSearchResponse>("/movies/search", {
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

export async function rateMovie({
  movieId,
  rating,
}: RateMovieInput): Promise<RateMovieResponse> {
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
