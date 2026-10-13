import { Stack, usePathname } from "expo-router";
import { View } from "react-native";

import FloatingBackButton from "../../src/components/FloatingBackButton/FloatingBackButton";

export default function StackLayout() {
  const pathname = usePathname();
  return (
    <View className="flex-1 bg-black">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}
      />
      {pathname !== "/search/search" && <FloatingBackButton />}
    </View>
  );
}
