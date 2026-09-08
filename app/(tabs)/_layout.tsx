import { Tabs } from "expo-router";
import TabNavbar from "../../src/components/tabnavbar/TabNavbar";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home/index"
      tabBar={(props) => <TabNavbar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "#000000" } }}
    >
      <Tabs.Screen name="home/index" options={{ title: "Início" }} />
      <Tabs.Screen name="favorites/index" options={{ title: "Favoritos" }} />
      <Tabs.Screen name="movie-lists/index" options={{ title: "Listas" }} />
    </Tabs>
  );
}
