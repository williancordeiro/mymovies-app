import { Stack, usePathname } from "expo-router";
import { Text, View } from "react-native";

import FloatingBackButton from "../../src/components/FloatingBackButton/FloatingBackButton";

export default function StackLayout() {
  const pathname = usePathname();
  const hasScreenBackButton =
    pathname === "/search/search" || pathname === "/profile";

  return (
    <View className="flex-1 bg-black">
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: "#000000" },
          headerShadowVisible: false,
          headerTitleAlign: "left",
          headerTitle: () => (
            <Text className="text-3xl font-semibold uppercase tracking-widest text-[#FF8A3D]">
              My Movies
            </Text>
          ),
        }}
      />
      {!hasScreenBackButton && <FloatingBackButton />}
    </View>
  );
}
