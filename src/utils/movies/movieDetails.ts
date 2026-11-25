import type { Movie, MovieCollection, MovieGenre } from "./movie";
import type {
  ProductionCompany,
  ProductionCountry,
  SpokenLanguage,
} from "./movieMetadata";

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

export interface MovieApiError {
  success: false;
  status_code: number;
  status_message: string;
}

export interface MovieDetailsResponse {
  movie: MovieDetails | MovieApiError;
}
