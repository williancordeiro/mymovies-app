import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import type { BottomTabBarProps } from "expo-router/tabs";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

const icons: Record<string, { active: IconName; inactive: IconName }> = {
  "home/index": { active: "home-outline", inactive: "home-outline" },
  "favorites/index": { active: "heart", inactive: "heart-outline" },
  "movie-lists/index": { active: "folder-open", inactive: "folder-open" },
};

export default function TabNavbar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  return (
    <View
      pointerEvents="box-none"
      className="bg-transparent pt-3"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingLeft: Math.max(insets.left, 8),
        paddingRight: Math.max(insets.right, 8),
      }}
    >
      <View
        pointerEvents="box-none"
        className="w-full max-w-110 flex-row items-center gap-4 self-center"
      >
        <View className="min-w-0 flex-1 flex-row rounded-full bg-neutral-700/75 p-1">
          {state.routes.map((route, index) => {
            const selected = state.index === index;
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const icon = icons[route.name];

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                accessibilityState={{ selected }}
                testID={options.tabBarButtonTestID}
                className={`min-h-17.5 min-w-0 flex-1 items-center justify-center rounded-full px-1 py-2 ${selected ? "bg-[#dd5d13]" : "bg-transparent"}`}
                style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
                onPress={() => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!selected && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                onLongPress={() =>
                  navigation.emit({ type: "tabLongPress", target: route.key })
                }
              >
                <Ionicons
                  name={
                    icon
                      ? selected
                        ? icon.active
                        : icon.inactive
                      : "ellipse-outline"
                  }
                  size={34}
                  color={selected ? "#FFFFFF" : "#969696"}
                  accessible={false}
                />
                <Text
                  className={`text-xs ${selected ? "font-semibold text-white" : "text-[#B0B0B0]"}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          className="h-19.5 w-19.5 items-center justify-center rounded-full bg-neutral-700/75"
          accessibilityRole="button"
          accessibilityLabel="Buscar filmes"
          onPress={() => router.push("/(stack)/search/search")}
          style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
        >
          <Ionicons
            name="search"
            size={44}
            color="#FFFFFF"
            accessible={false}
          />
        </Pressable>
      </View>
    </View>
  );
}
