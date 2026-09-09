import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MovieCard from "../../../src/components/MovieCard/MovieCard";
import { useMovies } from "../../../src/hooks/movie";
import type { Movie } from "../../../src/utils/movie";

export default function HomeScreen() {
  const { data, error, isPending, isRefetching, refetch } = useMovies();
  const movies = data?.results ?? [];

  const renderMovie = useCallback(
    ({ item }: { item: Movie }) => (
      <View className="flex-1 px-1.5 pb-3">
        <MovieCard movie={item} />
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <View className="px-6 pb-5 pt-4">
        <Text className="text-3xl font-semibold uppercase tracking-widest text-[#FF8A3D]">
          My Movies
        </Text>
        <Text className="mt-1 text-2xl font-bold text-white">Início</Text>
        <Text className="mt-2 text-base text-[#a3a3a3]">
          Descubra os títulos disponíveis no catálogo.
        </Text>
      </View>

      <FlashList
        style={{ flex: 1 }}
        data={movies}
        keyExtractor={(movie) => String(movie.id)}
        numColumns={2}
        renderItem={renderMovie}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="min-h-80 items-center justify-center px-8">
            {isPending ? (
              <>
                <ActivityIndicator size="large" color="#FF8A3D" />
                <Text className="mt-4 text-base text-[#a3a3a3]">
                  Carregando filmes...
                </Text>
              </>
            ) : error ? (
              <>
                <Ionicons
                  name="cloud-offline-outline"
                  size={52}
                  color="#737373"
                  accessible={false}
                />
                <Text className="mt-4 text-center text-lg font-semibold text-white">
                  Não foi possível carregar os filmes
                </Text>
                <Text className="mt-2 text-center text-sm leading-5 text-[#a3a3a3]">
                  Verifique sua conexão e tente novamente.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="mt-5 rounded-full bg-[#dd5d13] px-6 py-3"
                  onPress={() => refetch()}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="font-semibold text-white">
                    Tentar novamente
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Ionicons
                  name="film-outline"
                  size={52}
                  color="#737373"
                  accessible={false}
                />
                <Text className="mt-4 text-center text-lg font-semibold text-white">
                  Nenhum filme encontrado
                </Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
