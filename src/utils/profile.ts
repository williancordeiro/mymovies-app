import { isAxiosError } from "axios";

import type { AuthenticatedUser } from "./auth";

export interface Profile {
  id: number;
  username: string;
  handle: string;
  email: string;
  role: string;
  avatarFile: string | null;
  bannerFile: string | null;
}

type ProfileSource = Pick<
  AuthenticatedUser,
  "id" | "username" | "handle" | "email" | "role"
> & {
  avatar_file: string | null;
  banner_file: string | null;
};

export function toProfile(user: ProfileSource): Profile {
  return {
    id: user.id,
    username: user.username,
    handle: user.handle,
    email: user.email,
    role: user.role,
    avatarFile: user.avatar_file ?? null,
    bannerFile: user.banner_file ?? null,
  };
}

export interface UpdateProfileInput {
  username?: string;
  handle?: string;
}

export interface AvatarUploadInput {
  uri: string;
  name: string;
  mimeType: "image/jpeg" | "image/png";
  size?: number;
  width?: number;
  height?: number;
}

export interface UpdatedProfileResponse {
  token: string;
  user: AuthenticatedUser;
}

export type UpdateProfileErrorKind =
  | "validation"
  | "unchanged"
  | "invalidFile"
  | "unauthorized"
  | "network"
  | "timeout"
  | "general";

export class UpdateProfileError extends Error {
  readonly kind: UpdateProfileErrorKind;
  readonly status?: number;
  readonly fieldErrors: Record<string, string>;

  constructor({
    message,
    kind,
    status,
    fieldErrors = {},
  }: {
    message: string;
    kind: UpdateProfileErrorKind;
    status?: number;
    fieldErrors?: Record<string, string>;
  }) {
    super(message);
    this.name = "UpdateProfileError";
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function isUpdateProfileError(
  error: unknown,
): error is UpdateProfileError {
  return error instanceof UpdateProfileError;
}

export interface UserRating {
  movieId: number;
  rating: number | null;
}

export interface ProfileMovieRating extends UserRating {
  title: string;
  posterPath: string | null;
}

export type ProfileErrorKind =
  | "unauthorized"
  | "notFound"
  | "network"
  | "timeout"
  | "general";

export class ProfileError extends Error {
  readonly kind: ProfileErrorKind;
  readonly status?: number;

  constructor({
    message,
    kind,
    status,
  }: {
    message: string;
    kind: ProfileErrorKind;
    status?: number;
  }) {
    super(message);
    this.name = "ProfileError";
    this.kind = kind;
    this.status = status;
  }
}

export function isProfileError(error: unknown): error is ProfileError {
  return error instanceof ProfileError;
}

export function toProfileError(
  error: unknown,
  resource: "perfil" | "avaliações",
): ProfileError {
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
        message:
          "A solicitação demorou mais do que o esperado. Tente novamente.",
        kind: "timeout",
      });
    }

    if (!error.response) {
      return new ProfileError({
        message:
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
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
