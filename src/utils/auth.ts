export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  handle: string;
  email: string;
  role: string;
  avatar_file: string;
  banner_file: string;
}

export interface RegisterResponse {
  token: string;
  user: AuthenticatedUser;
}

export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}

export type RegisterErrorKind = "validation" | "general";

export class RegisterError extends Error {
  readonly kind: RegisterErrorKind;
  readonly status?: number;
  readonly fieldErrors: Record<string, string>;

  constructor({
    message,
    kind,
    status,
    fieldErrors = {},
  }: {
    message: string;
    kind: RegisterErrorKind;
    status?: number;
    fieldErrors?: Record<string, string>;
  }) {
    super(message);
    this.name = "RegisterError";
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function isRegisterError(error: unknown): error is RegisterError {
  return error instanceof RegisterError;
}

export type LoginErrorKind = "credentials" | "validation" | "network" | "persistence" | "general";

export class LoginError extends Error {
  readonly kind: LoginErrorKind;
  readonly status?: number;

  constructor({
    message,
    kind,
    status,
  }: {
    message: string;
    kind: LoginErrorKind;
    status?: number;
  }) {
    super(message);
    this.name = "LoginError";
    this.kind = kind;
    this.status = status;
  }
}

export function isLoginError(error: unknown): error is LoginError {
  return error instanceof LoginError;
}
