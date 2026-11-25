export interface RateMovieInput {
  movieId: number;
  rating: number;
}

export interface RateMovieResponse {
  success: true;
  message: string;
  data: {
    movie_id: number;
    rating: number;
    average_rating: number;
  };
}

export interface RateMovieErrorResponse {
  error?: unknown;
  message?: unknown;
}
