export interface FavoriteItem {
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  user_favorited: true;
}

export interface FavoritesPage {
  favorites: FavoriteItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface FavoritesRequest {
  page: number;
  perPage: number;
}

export interface FavoriteMutationResponse {
  success: true;
  data: {
    movie_id: number;
    user_favorited: boolean;
  };
}

export interface FavoriteErrorResponse {
  error?: unknown;
  message?: unknown;
}
