import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "../global.css";
import { APP_COLORS } from "../src/constants/colors";
import { useAuthSession } from "../src/hooks/auth";
import { restoreSession } from "../src/session/authSession";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: APP_COLORS.background,
    card: APP_COLORS.surface,
    primary: APP_COLORS.primary,
  },
};

function SessionCacheCoordinator() {
  const queryClient = useQueryClient();
  const { generation } = useAuthSession();
  const previousGeneration = useRef(generation);

  useEffect(() => {
    if (previousGeneration.current === generation) return;
    previousGeneration.current = generation;
    const isPrivateMovieData = (query: { queryKey: readonly unknown[] }) =>
      query.queryKey[0] === "movies" || query.queryKey[0] === "favorites";
    void queryClient.cancelQueries({ predicate: isPrivateMovieData });
    queryClient.removeQueries({ predicate: isPrivateMovieData });
  }, [generation, queryClient]);

  return null;
}

export default function RootLayout() {
  const { isRestored: isSessionRestored } = useAuthSession();

  useEffect(() => {
    void restoreSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionCacheCoordinator />
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        {isSessionRestored && (
          <Stack
            screenOptions={{
              animation: "slide_from_right",
              headerShown: false,
              contentStyle: { backgroundColor: APP_COLORS.background },
            }}
          />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
