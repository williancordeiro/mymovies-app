import { Tabs } from "expo-router";
import AppHeader from "../../src/components/AppHeader/AppHeader";
import TabNavbar from "../../src/components/TabNavBar/TabNavbar";
import UserHeaderButton from "../../src/components/UserHeaderButton/UserHeaderButton";
import { APP_COLORS } from "../../src/constants/colors";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabNavbar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: APP_COLORS.background, height: 104 },
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTitle: () => <AppHeader />,
        headerRight: () => <UserHeaderButton />,
        sceneStyle: { backgroundColor: APP_COLORS.background },
      }}
    >
      <Tabs.Screen name="home/index" options={{ title: "Início" }} />
      <Tabs.Screen name="favorites/index" options={{ title: "Favoritos" }} />
      <Tabs.Screen name="movie-lists/index" options={{ title: "Listas" }} />
    </Tabs>
  );
}
