import { router } from "expo-router";
import { View } from "react-native";

import FloatingBackButton from "../../src/components/FloatingBackButton/FloatingBackButton";

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-black">
      <FloatingBackButton onPress={() => router.replace("/home")} />
    </View>
  );
}
