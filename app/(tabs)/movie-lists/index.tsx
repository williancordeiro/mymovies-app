import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ListsScreen() {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-black p-6"
    >
      <Text className="text-3xl font-bold text-white">Listas</Text>
    </SafeAreaView>
  );
}
