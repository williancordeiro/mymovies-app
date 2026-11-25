import type { Movie } from "./movie";

export interface MoviesPage {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface MoviesResponse {
  movies: MoviesPage;
}
