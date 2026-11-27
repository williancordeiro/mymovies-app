import { Stack, usePathname } from "expo-router";
import { View } from "react-native";

import { AppStackHeader } from "../../src/components/AppHeader/AppHeader";
import FloatingBackButton from "../../src/components/FloatingBackButton/FloatingBackButton";

export default function StackLayout() {
  const pathname = usePathname();
  const hasScreenBackButton =
    pathname === "/search/search" || pathname === "/profile";

  return (
    <View className="flex-1 bg-black">
      <Stack
        screenOptions={{
          animation: "slide_from_right",
          headerShown: true,
          header: () => <AppStackHeader />,
          title: "My Movies",
        }}
      />
      {!hasScreenBackButton && <FloatingBackButton />}
    </View>
  );
}
