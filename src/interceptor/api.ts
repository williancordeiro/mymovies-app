import { create as createAxiosClient } from "axios";

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
