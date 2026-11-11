import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthenticatedUser, LoginResponse } from "../utils/auth";

const SESSION_KEY = "mymovies.auth.session.v1";

export interface AuthSession {
  token: string;
  user: AuthenticatedUser;
  /** Unix time in milliseconds, when it is available in the JWT. */
  expiresAt: number | null;
}

export class SessionStorageError extends Error {
  constructor() {
    super("Não foi possível salvar sua sessão neste dispositivo. Tente novamente.");
    this.name = "SessionStorageError";
  }
}

let currentSession: AuthSession | null = null;

function getJwtExpiration(token: string): number | null {
  const payload = token.split(".")[1];

  if (!payload || typeof globalThis.atob !== "function") {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const decodedPayload = JSON.parse(globalThis.atob(paddedPayload)) as { exp?: unknown };

    return typeof decodedPayload.exp === "number" && Number.isFinite(decodedPayload.exp)
      ? decodedPayload.exp * 1_000
      : null;
  } catch {
    return null;
  }
}

function isExpired(session: AuthSession): boolean {
  return session.expiresAt !== null && session.expiresAt <= Date.now();
}

function toSession(response: LoginResponse): AuthSession {
  return {
    token: response.token,
    user: response.user,
    expiresAt: getJwtExpiration(response.token),
  };
}

function isStoredSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<AuthSession>;

  return (
    typeof session.token === "string" &&
    session.token.length > 0 &&
    !!session.user &&
    typeof session.user === "object" &&
    (session.expiresAt === null ||
      (typeof session.expiresAt === "number" && Number.isFinite(session.expiresAt)))
  );
}

async function writeSession(session: AuthSession): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

async function removeStoredSession(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}

/**
 * Stores a session in encrypted native storage. On web, the session stays only
 * in memory and is intentionally lost when the page reloads.
 */
export async function persistSession(response: LoginResponse): Promise<AuthSession> {
  const session = toSession(response);

  if (isExpired(session)) {
    throw new SessionStorageError();
  }

  try {
    await writeSession(session);
  } catch {
    throw new SessionStorageError();
  }

  currentSession = session;
  return session;
}

/** Restores a valid session saved by a native app. Web has no persisted session. */
export async function restoreSession(): Promise<AuthSession | null> {
  if (Platform.OS === "web") {
    return getSession();
  }

  let serializedSession: string | null;

  try {
    serializedSession = await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    throw new SessionStorageError();
  }

  if (!serializedSession) {
    currentSession = null;
    return null;
  }

  try {
    const storedSession: unknown = JSON.parse(serializedSession);

    if (!isStoredSession(storedSession) || isExpired(storedSession)) {
      currentSession = null;
      await removeStoredSession();
      return null;
    }

    currentSession = storedSession;
    return currentSession;
  } catch {
    currentSession = null;

    try {
      await removeStoredSession();
    } catch {
      // The invalid entry cannot be used, even if cleanup is unavailable.
    }

    return null;
  }
}

export function getSession(): AuthSession | null {
  if (!currentSession) {
    return null;
  }

  if (isExpired(currentSession)) {
    currentSession = null;
    void removeStoredSession().catch(() => undefined);
    return null;
  }

  return currentSession;
}

export function getSessionToken(): string | null {
  return getSession()?.token ?? null;
}

export async function clearSession(): Promise<void> {
  currentSession = null;

  try {
    await removeStoredSession();
  } catch {
    throw new SessionStorageError();
  }
}
