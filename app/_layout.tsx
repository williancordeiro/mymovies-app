import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { restoreSession } from "../src/session/authSession";
import "../global.css";

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
    background: "#000000",
    card: "#262626",
    primary: "#FF8A3D",
  },
};

export default function RootLayout() {
  const [isSessionRestored, setIsSessionRestored] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void restoreSession()
      .catch(() => null)
      .finally(() => {
        if (isMounted) {
          setIsSessionRestored(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        {isSessionRestored && (
          <Stack
            screenOptions={{
              animation: "slide_from_right",
              headerShown: false,
              contentStyle: { backgroundColor: "#000000" },
            }}
          />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
