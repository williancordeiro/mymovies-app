export interface PlaylistMetadata {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePlaylistInput {
  title: string;
  movieIds?: number[];
}

export interface CreatePlaylistResponse {
  success: true;
  data: PlaylistMetadata;
}

export interface PlaylistPage {
  playlists: PlaylistMetadata[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface PlaylistMovie {
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  mymovies_rating_average: number;
  user_rating: number | null;
}

export interface PlaylistDetailsPage {
  playlist: PlaylistMetadata;
  movies: PlaylistMovie[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface PlaylistDetailsRequest {
  page: number;
  perPage: number;
}

export interface UpdatePlaylistInput {
  id: number;
  title: string;
  movieIds?: number[];
}

export interface PlaylistsRequest {
  page: number;
  perPage: number;
}

export interface PlaylistErrorResponse {
  error?: string;
  message?: string;
}
