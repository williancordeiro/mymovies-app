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
