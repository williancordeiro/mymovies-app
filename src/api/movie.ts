import { useQuery } from "@tanstack/react-query";
import { api } from "../interceptor/api";

export interface Movie {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  softcore?: boolean;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  mymovies_rating_average: number;
  user_rating: number | null;
}

export interface MovieGenre {
  id: number;
  name: string;
}

export interface MovieCollection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface MovieDetails extends Omit<Movie, "genre_ids"> {
  belongs_to_collection: MovieCollection | null;
  budget: number;
  genres: MovieGenre[];
  homepage: string;
  imdb_id: string | null;
  origin_country: string[];
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  revenue: number;
  runtime: number | null;
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string;
}

export interface MoviesPage {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

interface MoviesResponse {
  movies: MoviesPage;
}

interface MovieDetailsResponse {
  movie: MovieDetails | MovieApiError;
}

interface MovieApiError {
  success: false;
  status_code: number;
  status_message: string;
}

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
