import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FloatingBackButton() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        left: 20,
        bottom: Math.max(insets.bottom, 12),
        zIndex: 10,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
        className="h-[58px] w-[58px] items-center justify-center rounded-full bg-neutral-700/75"
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
      >
        <Ionicons
          name="chevron-back"
          size={32}
          color="#FFFFFF"
          accessible={false}
        />
      </Pressable>
    </View>
  );
}
