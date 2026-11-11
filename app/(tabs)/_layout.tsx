import { Tabs } from "expo-router";
import { Text } from "react-native";
import TabNavbar from "../../src/components/TabNavBar/TabNavbar";
import UserHeaderButton from "../../src/components/UserHeaderButton/UserHeaderButton";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabNavbar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#000000" },
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTitle: () => (
          <Text className="text-2xl font-semibold uppercase tracking-widest text-[#FF8A3D]">
            My Movies
          </Text>
        ),
        headerRight: () => <UserHeaderButton />,
        sceneStyle: { backgroundColor: "#000000" },
      }}
    >
      <Tabs.Screen name="home/index" options={{ title: "Início" }} />
      <Tabs.Screen name="favorites/index" options={{ title: "Favoritos" }} />
      <Tabs.Screen name="movie-lists/index" options={{ title: "Listas" }} />
    </Tabs>
  );
}
