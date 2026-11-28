import { isAxiosError } from "axios";
import { Platform } from "react-native";

import { api } from "../interceptor/api";
import {
  AVATAR_REQUIREMENTS_MESSAGE,
  getAvatarInputError,
} from "../utils/avatar";
import type { AuthenticatedUser } from "../utils/auth";
import {
  isUpdateProfileError,
  toProfile,
  toProfileError,
  UpdateProfileError,
  type AvatarUploadInput,
  type Profile,
  type UpdatedProfileResponse,
  type UpdateProfileInput,
} from "../utils/profile";

export { toProfile, type UpdatedProfileResponse } from "../utils/profile";

type UpdateErrorResponse = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

type UpdateOperation = "profile" | "avatar";

function getMessage(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getFieldErrors(
  value: unknown,
  fields: readonly string[],
): { fieldErrors: Record<string, string>; hasUnknownFields: boolean } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { fieldErrors: {}, hasUnknownFields: false };
  }

  const fieldErrors: Record<string, string> = {};
  let hasUnknownFields = false;

  for (const [field, fieldValue] of Object.entries(value)) {
    const message =
      typeof fieldValue === "string" && fieldValue.trim()
        ? fieldValue
        : Array.isArray(fieldValue)
          ? fieldValue.find(
              (item): item is string =>
                typeof item === "string" && item.trim().length > 0,
            )
          : undefined;

    if (!message) continue;
    if (!fields.includes(field)) {
      hasUnknownFields = true;
      continue;
    }

    fieldErrors[field] = message;
  }

  return { fieldErrors, hasUnknownFields };
}

function toUpdateProfileError(
  error: unknown,
  operation: UpdateOperation,
): UpdateProfileError {
  if (isUpdateProfileError(error)) {
    return error;
  }

  if (isAxiosError<UpdateErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      return new UpdateProfileError({
        message: "Sua sessão expirou. Entre novamente.",
        kind: "unauthorized",
        status,
      });
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new UpdateProfileError({
        message:
          "A solicitação demorou mais do que o esperado. Tente novamente.",
        kind: "timeout",
      });
    }

    if (!error.response) {
      return new UpdateProfileError({
        message:
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        kind: "network",
      });
    }

    if (operation === "avatar" && status === 413) {
      return new UpdateProfileError({
        message: "A imagem excede o limite permitido de 5 MiB.",
        kind: "invalidFile",
        status,
      });
    }

    if (status === 422) {
      const { fieldErrors, hasUnknownFields } = getFieldErrors(
        data?.errors,
        operation === "profile" ? ["username", "handle"] : ["avatar_file"],
      );
      const fallback =
        operation === "avatar"
          ? "Não foi possível enviar a imagem. Tente novamente."
          : "Revise os dados informados e tente novamente.";

      return new UpdateProfileError({
        message: hasUnknownFields
          ? fallback
          : getMessage(data?.message, getMessage(data?.error, fallback)),
        kind: "validation",
        status,
        fieldErrors,
      });
    }

    if (operation === "avatar" && status === 400) {
      const serverMessage = getMessage(data?.error, "");
      return new UpdateProfileError({
        message:
          serverMessage && serverMessage !== "Arquivo inválido"
            ? serverMessage
            : AVATAR_REQUIREMENTS_MESSAGE,
        kind: "invalidFile",
        status,
      });
    }

    const fallback =
      operation === "avatar"
        ? status === 500
          ? "Não foi possível salvar a imagem. Tente novamente."
          : "Não foi possível atualizar a imagem. Tente novamente."
        : "Não foi possível atualizar o perfil. Tente novamente.";

    return new UpdateProfileError({
      message:
        status === 400
          ? getMessage(data?.message, getMessage(data?.error, fallback))
          : fallback,
      kind: status === 400 ? "validation" : "general",
      status,
    });
  }

  return new UpdateProfileError({
    message:
      operation === "avatar"
        ? "Não foi possível atualizar a imagem. Tente novamente."
        : "Não foi possível atualizar o perfil. Tente novamente.",
    kind: "general",
  });
}

function assertUpdatedProfileResponse(data: unknown): UpdatedProfileResponse {
  if (!data || typeof data !== "object") {
    throw new UpdateProfileError({
      message: "Não foi possível atualizar o perfil. Tente novamente.",
      kind: "general",
    });
  }

  const response = data as Partial<UpdatedProfileResponse> & {
    error?: unknown;
  };

  if (typeof response.error === "string" && !response.token && !response.user) {
    throw new UpdateProfileError({
      message: response.error,
      kind: "unchanged",
    });
  }

  if (
    typeof response.token !== "string" ||
    !response.token ||
    !response.user ||
    typeof response.user !== "object"
  ) {
    throw new UpdateProfileError({
      message: "Não foi possível atualizar o perfil. Tente novamente.",
      kind: "general",
    });
  }

  return response as UpdatedProfileResponse;
}

function normalizeProfileInput(input: UpdateProfileInput): UpdateProfileInput {
  const payload: UpdateProfileInput = {};

  if (input.username !== undefined) payload.username = input.username.trim();
  if (input.handle !== undefined) payload.handle = input.handle.trim();

  if (!Object.keys(payload).length) {
    throw new UpdateProfileError({
      message: "Faça uma alteração antes de salvar.",
      kind: "unchanged",
    });
  }

  return payload;
}

function validateAvatar(input: AvatarUploadInput): void {
  const error = getAvatarInputError(input);

  if (error) {
    throw new UpdateProfileError({
      message: error,
      kind: "invalidFile",
      fieldErrors: {
        avatar_file: error,
      },
    });
  }
}

async function createAvatarFormData(
  input: AvatarUploadInput,
): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(input.uri);
    const blob = await response.blob();
    formData.append("avatar_file", blob, input.name);
    return formData;
  }

  formData.append("avatar_file", {
    uri: input.uri,
    name: input.name,
    type: input.mimeType,
  } as unknown as Blob);
  return formData;
}

export async function getMyProfile(): Promise<Profile> {
  try {
    const { data } = await api.get<AuthenticatedUser>("/profile");
    return toProfile(data);
  } catch (error) {
    throw toProfileError(error, "perfil");
  }
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<UpdatedProfileResponse> {
  try {
    const { data } = await api.put<unknown>(
      "/profile/update",
      normalizeProfileInput(input),
    );
    return assertUpdatedProfileResponse(data);
  } catch (error) {
    throw toUpdateProfileError(error, "profile");
  }
}

export async function updateAvatar(
  input: AvatarUploadInput,
): Promise<UpdatedProfileResponse> {
  try {
    validateAvatar(input);
    const formData = await createAvatarFormData(input);
    const { data } = await api.post<unknown>("/change/avatar", formData);
    return assertUpdatedProfileResponse(data);
  } catch (error) {
    throw toUpdateProfileError(error, "avatar");
  }
}
