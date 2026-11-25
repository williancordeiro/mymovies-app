import { create as createAxiosClient, type AxiosRequestConfig } from "axios";

import { clearSession, getSessionToken } from "../session/authSession";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Skips the bearer token and prevents a 401 from clearing the current session. */
    skipAuth?: boolean;
    /** Bearer token captured when the request starts, used to reject stale 401s. */
    authSessionToken?: string;
    /** Preserves a current session only for the confirmed invalid-password 401. */
    preserveSessionOnCredential401?: boolean;
  }
}

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL não foi definida. Configure a URL da API no arquivo .env.local.",
  );
}

export const api = createAxiosClient({
  baseURL: apiUrl,
  headers: {
    Accept: "application/json",
  },
  timeout: 10_000,
});

function isPublicRequest(config?: AxiosRequestConfig): boolean {
  if (config?.skipAuth) {
    return true;
  }

  const path = config?.url?.split("?")[0];
  return path === "/auth/login" || path === "/auth/register";
}

function isConfirmedInvalidPasswordResponse(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const response = data as { error?: unknown; message?: unknown };
  return (
    response.error === "A senha está incorreta!" ||
    response.message === "A senha está incorreta!"
  );
}

api.interceptors.request.use((config) => {
  if (isPublicRequest(config)) {
    return config;
  }

  const token = getSessionToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.authSessionToken = token;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = (error as { config?: AxiosRequestConfig }).config;
    const status = (error as { response?: { status?: number } }).response
      ?.status;

    if (
      status === 401 &&
      !isPublicRequest(config) &&
      !(
        config?.preserveSessionOnCredential401 &&
        isConfirmedInvalidPasswordResponse(
          (error as { response?: { data?: unknown } }).response?.data,
        )
      ) &&
      config?.authSessionToken === getSessionToken()
    ) {
      try {
        await clearSession(config.authSessionToken);
      } catch {
        // The in-memory session is cleared even if native cleanup fails.
      }
    }

    return Promise.reject(error);
  },
);
