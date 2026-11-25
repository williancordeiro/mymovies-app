import { useMutation } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { login, register } from "../api/auth";
import {
  getAuthSessionSnapshot,
  subscribeToAuthSession,
  type AuthSessionSnapshot,
} from "../session/authSession";
import type {
  LoginError,
  LoginInput,
  LoginResponse,
  RegisterError,
  RegisterInput,
  RegisterResponse,
} from "../utils/auth";

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
