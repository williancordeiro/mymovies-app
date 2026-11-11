import { create as createAxiosClient, type AxiosRequestConfig } from "axios";

import { clearSession, getSessionToken } from "../session/authSession";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Skips the bearer token and prevents a 401 from clearing the current session. */
    skipAuth?: boolean;
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

api.interceptors.request.use((config) => {
  if (isPublicRequest(config)) {
    return config;
  }

  const token = getSessionToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = (error as { config?: AxiosRequestConfig }).config;
    const status = (error as { response?: { status?: number } }).response?.status;

    if (status === 401 && !isPublicRequest(config)) {
      try {
        await clearSession();
      } catch {
        // The in-memory session is cleared even if native cleanup fails.
      }
    }

    return Promise.reject(error);
  },
);
