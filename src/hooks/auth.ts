import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import {
  changeEmail,
  changePassword,
  deleteAccount,
  login,
  register,
} from "../api/auth";
import {
  clearSession,
  getAuthSessionSnapshot,
  getSession,
  replaceSession,
  SessionReplacedError,
  SessionStorageError,
  subscribeToAuthSession,
  type AuthSessionSnapshot,
} from "../session/authSession";
import type {
  ChangeEmailInput,
  ChangePasswordInput,
  DeleteAccountInput,
  LoginError,
  LoginInput,
  LoginResponse,
  RegisterError,
  RegisterInput,
  RegisterResponse,
  SensitiveAccountMessageResponse,
} from "../utils/auth";
import { SensitiveAccountError } from "../utils/auth";
import { toProfile } from "../utils/profile";
import { profileKeys } from "./keys/profile";

const getServerSnapshot = (): AuthSessionSnapshot => ({
  session: null,
  generation: 0,
  isRestored: false,
});

export function useAuthSession(): AuthSessionSnapshot {
  return useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSessionSnapshot,
    getServerSnapshot,
  );
}

export function useRegister() {
  return useMutation<RegisterResponse, RegisterError, RegisterInput>({
    mutationFn: register,
  });
}

export function useLogin() {
  return useMutation<LoginResponse, LoginError, LoginInput>({
    mutationFn: login,
  });
}

type SensitiveInput =
  | ChangeEmailInput
  | ChangePasswordInput
  | DeleteAccountInput;

function eraseSensitiveInput(input: SensitiveInput): void {
  if ("password" in input) input.password = "";
  if ("currentPassword" in input) input.currentPassword = "";
  if ("newPassword" in input) input.newPassword = "";
}

function sessionUnavailableError(): SensitiveAccountError {
  return new SensitiveAccountError({
    message: "Sua sessão expirou. Entre novamente.",
    kind: "unauthorized",
  });
}

function toSensitiveMutationError(error: unknown): SensitiveAccountError {
  if (error instanceof SensitiveAccountError) return error;
  if (error instanceof SessionReplacedError) {
    return new SensitiveAccountError({
      message: error.message,
      kind: "unauthorized",
    });
  }
  if (error instanceof SessionStorageError) {
    return new SensitiveAccountError({
      message: error.message,
      kind: "general",
    });
  }
  return new SensitiveAccountError({
    message: "Não foi possível concluir a alteração. Tente novamente.",
    kind: "general",
  });
}

export function useChangeEmail() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof changeEmail>>,
    SensitiveAccountError,
    ChangeEmailInput
  >({
    mutationFn: async (input) => {
      const session = getSession();
      if (!session) throw sessionUnavailableError();

      try {
        const response = await changeEmail(input);
        const previousQueryKey = profileKeys.me(session.user.id, session.token);

        await queryClient.cancelQueries({
          queryKey: previousQueryKey,
          exact: true,
        });
        const updatedSession = await replaceSession(response, session.token);

        queryClient.removeQueries({ queryKey: previousQueryKey, exact: true });
        queryClient.setQueryData(
          profileKeys.me(updatedSession.user.id, updatedSession.token),
          toProfile(updatedSession.user),
        );

        return response;
      } catch (error) {
        throw toSensitiveMutationError(error);
      }
    },
    gcTime: 0,
    onSettled: (_data, _error, input) => eraseSensitiveInput(input),
  });
}

export function useChangePassword() {
  return useMutation<
    SensitiveAccountMessageResponse,
    SensitiveAccountError,
    ChangePasswordInput
  >({
    mutationFn: async (input) => {
      if (!getSession()) throw sessionUnavailableError();

      try {
        return await changePassword(input);
      } catch (error) {
        throw toSensitiveMutationError(error);
      }
    },
    gcTime: 0,
    onSettled: (_data, _error, input) => eraseSensitiveInput(input),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<
    SensitiveAccountMessageResponse,
    SensitiveAccountError,
    DeleteAccountInput
  >({
    mutationFn: async (input) => {
      const session = getSession();
      if (!session) throw sessionUnavailableError();

      try {
        const response = await deleteAccount(input);
        if (getSession()?.token !== session.token) {
          throw new SessionReplacedError();
        }

        await queryClient.cancelQueries();
        let sessionWasCleared: boolean;
        try {
          sessionWasCleared = await clearSession(session.token);
        } catch (error) {
          if (getSession()) throw error;
          sessionWasCleared = true;
        }
        if (!sessionWasCleared) throw new SessionReplacedError();
        queryClient.clear();

        return response;
      } catch (error) {
        throw toSensitiveMutationError(error);
      }
    },
    gcTime: 0,
    onSettled: (_data, _error, input) => eraseSensitiveInput(input),
  });
}
