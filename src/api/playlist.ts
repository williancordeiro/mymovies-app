import { isAxiosError } from "axios";

import { api } from "../interceptor/api";
import type {
  CreatePlaylistInput,
  CreatePlaylistResponse,
  PlaylistDetailsPage,
  PlaylistDetailsRequest,
  PlaylistErrorResponse,
  PlaylistPage,
  PlaylistsRequest,
  UpdatePlaylistInput,
} from "../utils/playlist/playlist";

export class PlaylistError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PlaylistError";
    this.status = status;
  }
}

function toPlaylistError(
  error: unknown,
  action: "create" | "list" | "detail" | "update",
): PlaylistError {
  if (error instanceof PlaylistError) return error;

  if (isAxiosError<PlaylistErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message =
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : typeof data?.message === "string" && data.message.trim()
          ? data.message
          : status === 401
            ? "Sua sessão expirou. Entre novamente."
            : action === "create" || action === "update"
              ? "Não foi possível salvar a playlist. Tente novamente."
              : action === "detail"
                ? "Não foi possível carregar esta playlist. Tente novamente."
                : "Não foi possível listar as playlists. Tente novamente.";
    return new PlaylistError(message, status);
  }

  return new PlaylistError(
    action === "create" || action === "update"
      ? "Não foi possível conectar ao servidor para salvar a playlist."
      : action === "detail"
        ? "Não foi possível conectar ao servidor para carregar esta playlist."
        : "Não foi possível conectar ao servidor para listar as playlists.",
  );
}

function assertPlaylistId(id: number): void {
  if (!Number.isInteger(id) || id <= 0 || id > 4_294_967_295) {
    throw new PlaylistError("A playlist é inválida.");
  }
}

function normalizeMovieIds(
  movieIds: number[] | undefined,
): number[] | undefined {
  if (movieIds === undefined) return undefined;
  const normalized = [...new Set(movieIds)];
  if (
    normalized.length !== movieIds.length ||
    normalized.some(
      (movieId) =>
        !Number.isInteger(movieId) || movieId <= 0 || movieId > 4_294_967_295,
    )
  ) {
    throw new PlaylistError("Os filmes selecionados são inválidos.");
  }
  return normalized;
}

function normalizeTitle(title: string): string {
  const normalizedTitle = title.trim();
  if (normalizedTitle.length < 1 || normalizedTitle.length > 255) {
    throw new PlaylistError("O título deve ter entre 1 e 255 caracteres.");
  }
  return normalizedTitle;
}

export async function getPlaylists(
  { page, perPage }: PlaylistsRequest,
  signal?: AbortSignal,
): Promise<PlaylistPage> {
  if (
    !Number.isInteger(page) ||
    page <= 0 ||
    !Number.isInteger(perPage) ||
    perPage <= 0 ||
    perPage > 100
  ) {
    throw new PlaylistError("A página de playlists é inválida.");
  }

  try {
    const { data } = await api.get<PlaylistPage>("/playlists", {
      params: { page, per_page: perPage },
      signal,
    });
    return data;
  } catch (error) {
    throw toPlaylistError(error, "list");
  }
}

export async function createPlaylist(
  input: CreatePlaylistInput,
): Promise<CreatePlaylistResponse> {
  const title = normalizeTitle(input.title);
  const movieIds = normalizeMovieIds(input.movieIds);

  try {
    const { data } = await api.post<CreatePlaylistResponse>(
      "/playlists",
      movieIds === undefined ? { title } : { title, movie_ids: movieIds },
    );
    return data;
  } catch (error) {
    throw toPlaylistError(error, "create");
  }
}

export async function getPlaylistDetails(
  id: number,
  { page, perPage }: PlaylistDetailsRequest,
  signal?: AbortSignal,
): Promise<PlaylistDetailsPage> {
  assertPlaylistId(id);
  if (
    !Number.isInteger(page) ||
    page <= 0 ||
    !Number.isInteger(perPage) ||
    perPage <= 0 ||
    perPage > 100
  ) {
    throw new PlaylistError("A página de filmes da playlist é inválida.");
  }

  try {
    const { data } = await api.get<PlaylistDetailsPage>(`/playlists/${id}`, {
      params: { page, per_page: perPage },
      signal,
    });
    return data;
  } catch (error) {
    throw toPlaylistError(error, "detail");
  }
}

export async function updatePlaylist(
  input: UpdatePlaylistInput,
): Promise<CreatePlaylistResponse> {
  assertPlaylistId(input.id);
  const title = normalizeTitle(input.title);
  const movieIds = normalizeMovieIds(input.movieIds);

  try {
    const { data } = await api.put<CreatePlaylistResponse>(
      `/playlists/${input.id}`,
      movieIds === undefined ? { title } : { title, movie_ids: movieIds },
    );
    return data;
  } catch (error) {
    throw toPlaylistError(error, "update");
  }
}
