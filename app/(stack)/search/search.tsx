import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black px-5">
      <View className="mb-6 flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          className="h-12 w-12 items-center justify-center rounded-full bg-[#262626]"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-3xl font-bold text-white">Buscar filmes</Text>
      </View>
      <View className="flex-row items-center gap-3 rounded-2xl bg-[#262626] px-4">
        <Ionicons name="search" size={24} color="#A3A3A3" accessible={false} />
        <TextInput
          accessibilityLabel="Nome do filme"
          placeholder="Nome do filme"
          placeholderTextColor="#A3A3A3"
          selectionColor="#FF8A3D"
          className="min-h-14 flex-1 py-3 text-base text-white"
          returnKeyType="search"
          autoFocus
        />
      </View>
      <Text className="mt-6 text-center text-sm text-[#A3A3A3]">
        A busca estará disponível quando o catálogo for conectado.
      </Text>
    </SafeAreaView>
  );
}
