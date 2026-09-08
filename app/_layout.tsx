import "../global.css";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: "#000000", card: "#262626", primary: "#FF8A3D" },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#000000" } }} />
    </ThemeProvider>
  );
}
