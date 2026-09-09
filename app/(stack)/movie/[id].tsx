import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MovieDetailsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-lg text-white">
          Detalhes do filme em breve.
        </Text>
      </View>
    </SafeAreaView>
  );
}
