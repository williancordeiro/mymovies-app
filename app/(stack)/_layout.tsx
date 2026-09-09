import { Stack } from "expo-router";
import { View } from "react-native";

import FloatingBackButton from "../../src/components/FloatingBackButton/FloatingBackButton";

export default function StackLayout() {
  return (
    <View className="flex-1 bg-black">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}
      />
      <FloatingBackButton />
    </View>
  );
}
