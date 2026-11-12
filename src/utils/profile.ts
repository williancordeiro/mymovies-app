import { isAxiosError } from "axios";

export interface Profile {
  id: number;
  username: string;
  handle: string;
  email: string;
  role: string;
  avatarFile: string | null;
  bannerFile: string | null;
}

export interface UserRating {
  movieId: number;
  rating: number | null;
}

export interface ProfileMovieRating extends UserRating {
  title: string;
  posterPath: string | null;
}

export type ProfileErrorKind = "unauthorized" | "notFound" | "network" | "timeout" | "general";

export class ProfileError extends Error {
  readonly kind: ProfileErrorKind;
  readonly status?: number;

  constructor({ message, kind, status }: { message: string; kind: ProfileErrorKind; status?: number }) {
    super(message);
    this.name = "ProfileError";
    this.kind = kind;
    this.status = status;
  }
}

export function isProfileError(error: unknown): error is ProfileError {
  return error instanceof ProfileError;
}

export function toProfileError(error: unknown, resource: "perfil" | "avaliações"): ProfileError {
  if (isProfileError(error)) {
    return error;
  }

  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401) {
      return new ProfileError({
        message: "Sua sessão expirou. Entre novamente.",
        kind: "unauthorized",
        status,
      });
    }

    if (status === 404) {
      return new ProfileError({
        message: "Usuário não encontrado.",
        kind: "notFound",
        status,
      });
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new ProfileError({
        message: "A solicitação demorou mais do que o esperado. Tente novamente.",
        kind: "timeout",
      });
    }

    if (!error.response) {
      return new ProfileError({
        message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        kind: "network",
      });
    }

    return new ProfileError({
      message: `Não foi possível carregar ${resource}. Tente novamente.`,
      kind: "general",
      status,
    });
  }

  return new ProfileError({
    message: `Não foi possível carregar ${resource}. Tente novamente.`,
    kind: "general",
  });
}
