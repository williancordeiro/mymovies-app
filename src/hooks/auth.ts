import { useMutation } from "@tanstack/react-query";

import { login, register } from "../api/auth";
import type {
  LoginError,
  LoginInput,
  LoginResponse,
  RegisterError,
  RegisterInput,
  RegisterResponse,
} from "../utils/auth";

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
