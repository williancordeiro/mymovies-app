import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { APP_COLORS } from "../../constants/colors";

export default function AppHeader() {
  return (
    <Text className="text-3xl font-semibold uppercase tracking-widest text-primary">
      My Movies
    </Text>
  );
}

export function AppStackHeader() {
  return (
    <SafeAreaView edges={["top"]} style={{ height: 104 }}>
      <View
        className="flex-1 justify-center px-4"
        style={{ backgroundColor: APP_COLORS.background }}
      >
        <AppHeader />
      </View>
    </SafeAreaView>
  );
}
