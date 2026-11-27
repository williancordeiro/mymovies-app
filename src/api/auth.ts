import { isAxiosError } from "axios";

import { api } from "../interceptor/api";
import { SessionStorageError, persistSession } from "../session/authSession";
import {
  type ChangeEmailInput,
  type ChangePasswordInput,
  type DeleteAccountInput,
  LoginError,
  type LoginInput,
  type LoginResponse,
  RegisterError,
  type RegisterInput,
  type RegisterResponse,
  SensitiveAccountError,
  type SensitiveAccountMessageResponse,
} from "../utils/auth";

type RegisterErrorResponse = {
  message?: unknown;
  errors?: unknown;
};

type LoginErrorResponse = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

type SensitiveAccountErrorResponse = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

export type ChangeEmailResponse = LoginResponse & { flash?: unknown };

const INVALID_PASSWORD_MESSAGE = "A senha está incorreta!";

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
    message:
      "Ocorreu um erro inesperado ao realizar o cadastro. Tente novamente.",
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
    const message = getMessage(
      data?.message,
      getMessage(data?.error, fallback),
    );

    return new LoginError({
      message,
      kind:
        status === 401
          ? "credentials"
          : status === 400
            ? "validation"
            : status
              ? "general"
              : "network",
      status,
    });
  }

  return new LoginError({
    message: "Ocorreu um erro inesperado ao entrar. Tente novamente.",
    kind: "general",
  });
}

function getSensitiveFieldErrors(
  value: unknown,
  fields: Readonly<Record<string, string>>,
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

    const uiField = fields[field];
    if (!uiField) {
      hasUnknownFields = true;
      continue;
    }
    fieldErrors[uiField] = message;
  }

  return { fieldErrors, hasUnknownFields };
}

function toSensitiveAccountError(
  error: unknown,
  operation: "email" | "password" | "delete",
): SensitiveAccountError {
  if (error instanceof SensitiveAccountError) return error;

  if (error instanceof SessionStorageError) {
    return new SensitiveAccountError({
      message: error.message,
      kind: "general",
    });
  }

  if (isAxiosError<SensitiveAccountErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const serverMessage = getMessage(
      data?.error,
      getMessage(data?.message, ""),
    );

    if (status === 401) {
      if (serverMessage === INVALID_PASSWORD_MESSAGE) {
        return new SensitiveAccountError({
          message: serverMessage,
          kind: "invalidCredentials",
          status,
          fieldErrors:
            operation === "password"
              ? { currentPassword: serverMessage }
              : { password: serverMessage },
        });
      }

      return new SensitiveAccountError({
        message: "Sua sessão expirou. Entre novamente.",
        kind: "unauthorized",
        status,
      });
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new SensitiveAccountError({
        message:
          "A solicitação demorou mais do que o esperado. Tente novamente.",
        kind: "timeout",
      });
    }

    if (!error.response) {
      return new SensitiveAccountError({
        message:
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        kind: "network",
      });
    }

    if (status === 422) {
      const { fieldErrors, hasUnknownFields } = getSensitiveFieldErrors(
        data?.errors,
        operation === "email"
          ? { email: "email", password: "password" }
          : operation === "password"
            ? {
                current_password: "currentPassword",
                new_password: "newPassword",
              }
            : { password: "password" },
      );
      return new SensitiveAccountError({
        message: hasUnknownFields
          ? "Revise os dados informados e tente novamente."
          : getMessage(
              data?.message,
              "Revise os dados informados e tente novamente.",
            ),
        kind: "validation",
        status,
        fieldErrors,
      });
    }

    if (status === 400) {
      const field = operation === "password" ? "currentPassword" : "password";
      return new SensitiveAccountError({
        message: getMessage(
          data?.error,
          getMessage(
            data?.message,
            "Revise os dados informados e tente novamente.",
          ),
        ),
        kind: "validation",
        status,
        fieldErrors: { [field]: "Campo obrigatório." },
      });
    }

    return new SensitiveAccountError({
      message: "Não foi possível concluir a alteração. Tente novamente.",
      kind: "general",
      status,
    });
  }

  return new SensitiveAccountError({
    message: "Não foi possível concluir a alteração. Tente novamente.",
    kind: "general",
  });
}

function assertChangeEmailResponse(data: unknown): ChangeEmailResponse {
  if (!data || typeof data !== "object") {
    throw new SensitiveAccountError({
      message: "Não foi possível atualizar o e-mail. Tente novamente.",
      kind: "general",
    });
  }

  const response = data as Partial<ChangeEmailResponse>;
  if (
    typeof response.token !== "string" ||
    !response.token ||
    !response.user ||
    typeof response.user !== "object"
  ) {
    throw new SensitiveAccountError({
      message: "Não foi possível atualizar o e-mail. Tente novamente.",
      kind: "general",
    });
  }

  return response as ChangeEmailResponse;
}

function assertMessageResponse(data: unknown): SensitiveAccountMessageResponse {
  if (!data || typeof data !== "object") {
    throw new SensitiveAccountError({
      message: "Não foi possível concluir a alteração. Tente novamente.",
      kind: "general",
    });
  }

  const response = data as Partial<SensitiveAccountMessageResponse>;
  if (typeof response.message !== "string" || !response.message.trim()) {
    throw new SensitiveAccountError({
      message: "Não foi possível concluir a alteração. Tente novamente.",
      kind: "general",
    });
  }

  return response as SensitiveAccountMessageResponse;
}

function assertChangeEmailInput(input: ChangeEmailInput): void {
  const email = input.email.trim();
  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Informe o novo e-mail.";
  else if (email.length > 64)
    fieldErrors.email = "O e-mail deve ter no máximo 64 caracteres.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fieldErrors.email = "Informe um e-mail válido.";
  if (!input.password) fieldErrors.password = "Informe sua senha atual.";
  if (Object.keys(fieldErrors).length) {
    throw new SensitiveAccountError({
      message: "Revise os dados informados e tente novamente.",
      kind: "validation",
      fieldErrors,
    });
  }
}

function assertPasswordInput(
  input: ChangePasswordInput | DeleteAccountInput,
  operation: "password" | "delete",
): void {
  const fieldErrors: Record<string, string> = {};
  if (operation === "password") {
    const passwordInput = input as ChangePasswordInput;
    if (!passwordInput.currentPassword)
      fieldErrors.currentPassword = "Informe sua senha atual.";
    if (!passwordInput.newPassword)
      fieldErrors.newPassword = "Informe a nova senha.";
  } else if (!(input as DeleteAccountInput).password) {
    fieldErrors.password = "Informe sua senha atual.";
  }
  if (Object.keys(fieldErrors).length) {
    throw new SensitiveAccountError({
      message: "Revise os dados informados e tente novamente.",
      kind: "validation",
      fieldErrors,
    });
  }
}

export async function register(
  input: RegisterInput,
): Promise<RegisterResponse> {
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

export async function changeEmail(
  input: ChangeEmailInput,
): Promise<ChangeEmailResponse> {
  try {
    assertChangeEmailInput(input);
    const { data } = await api.put<unknown>("/change/email", input, {
      preserveSessionOnCredential401: true,
    });
    return assertChangeEmailResponse(data);
  } catch (error) {
    throw toSensitiveAccountError(error, "email");
  }
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<SensitiveAccountMessageResponse> {
  try {
    assertPasswordInput(input, "password");
    const { data } = await api.put<unknown>(
      "/change/password",
      {
        current_password: input.currentPassword,
        new_password: input.newPassword,
      },
      { preserveSessionOnCredential401: true },
    );
    return assertMessageResponse(data);
  } catch (error) {
    throw toSensitiveAccountError(error, "password");
  }
}

export async function deleteAccount(
  input: DeleteAccountInput,
): Promise<SensitiveAccountMessageResponse> {
  try {
    assertPasswordInput(input, "delete");
    const { data } = await api.delete<unknown>("/account/delete", {
      data: { password: input.password },
      preserveSessionOnCredential401: true,
    });
    return assertMessageResponse(data);
  } catch (error) {
    throw toSensitiveAccountError(error, "delete");
  }
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
