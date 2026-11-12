import { Stack, usePathname } from "expo-router";
import { Header } from "expo-router/build/react-navigation/elements/index";
import { Text, View } from "react-native";

import FloatingBackButton from "../../src/components/FloatingBackButton/FloatingBackButton";
import UserHeaderButton from "../../src/components/UserHeaderButton/UserHeaderButton";

export default function StackLayout() {
  const pathname = usePathname();
  const hasScreenBackButton =
    pathname === "/search/search" || pathname === "/profile";

  return (
    <View className="flex-1 bg-black">
      <Stack
        screenOptions={{
          headerShown: true,
          header: () => (
            <Header
              headerShadowVisible={false}
              headerStyle={{ backgroundColor: "#000000", height: 104 }}
              headerTitleAlign="left"
              headerTitle={() => (
                <Text className="text-3xl font-semibold uppercase tracking-widest text-[#FF8A3D]">
                  My Movies
                </Text>
              )}
              headerRight={() => <UserHeaderButton />}
              title="My Movies"
            />
          ),
        }}
      />
      {!hasScreenBackButton && <FloatingBackButton />}
    </View>
  );
}
