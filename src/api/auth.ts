import { isAxiosError } from "axios";

import { api } from "../interceptor/api";
import {
  LoginError,
  type LoginInput,
  type LoginResponse,
  RegisterError,
  type RegisterInput,
  type RegisterResponse,
} from "../utils/auth";
import { SessionStorageError, persistSession } from "../session/authSession";

type RegisterErrorResponse = {
  message?: unknown;
  errors?: unknown;
};

type LoginErrorResponse = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

function getMessage(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getFieldErrors(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  for (const [field, message] of Object.entries(value)) {
    if (typeof message === "string" && message.trim()) {
      fieldErrors[field] = message;
      continue;
    }

    if (Array.isArray(message)) {
      const firstMessage = message.find(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      );

      if (firstMessage) {
        fieldErrors[field] = firstMessage;
      }
    }
  }

  return fieldErrors;
}

function toRegisterError(error: unknown): RegisterError {
  if (isAxiosError<RegisterErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const fallback = status
      ? "Não foi possível concluir o cadastro. Tente novamente."
      : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

    return new RegisterError({
      message: getMessage(data?.message, fallback),
      kind: status === 422 ? "validation" : "general",
      status,
      fieldErrors: status === 422 ? getFieldErrors(data?.errors) : {},
    });
  }

  return new RegisterError({
    message: "Ocorreu um erro inesperado ao realizar o cadastro. Tente novamente.",
    kind: "general",
  });
}

function toLoginError(error: unknown): LoginError {
  if (error instanceof SessionStorageError) {
    return new LoginError({ message: error.message, kind: "persistence" });
  }

  if (isAxiosError<LoginErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const fallback = status
      ? "Não foi possível entrar. Tente novamente."
      : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
    const message = getMessage(data?.message, getMessage(data?.error, fallback));

    return new LoginError({
      message,
      kind: status === 401 ? "credentials" : status === 400 ? "validation" : status ? "general" : "network",
      status,
    });
  }

  return new LoginError({
    message: "Ocorreu um erro inesperado ao entrar. Tente novamente.",
    kind: "general",
  });
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  try {
    const { data } = await api.post<RegisterResponse>("/auth/register", input);
    return data;
  } catch (error) {
    throw toRegisterError(error);
  }
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>("/auth/login", input, {
      skipAuth: true,
    });

    await persistSession(data);
    return data;
  } catch (error) {
    throw toLoginError(error);
  }
}
