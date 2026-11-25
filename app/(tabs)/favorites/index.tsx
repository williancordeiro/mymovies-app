import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MovieCard from "../../../src/components/MovieCard/MovieCard";
import { APP_COLORS } from "../../../src/constants/colors";
import { useAuthSession } from "../../../src/hooks/auth";
import { useFavorites } from "../../../src/hooks/movie";
import type { MovieCardData } from "../../../src/utils/movie";

export default function FavoritesScreen() {
  const { session, isRestored } = useAuthSession();
  const favorites = useFavorites();
  const movies = useMemo<MovieCardData[]>(() => {
    const seen = new Set<number>();
    return (favorites.data?.pages.flatMap((page) => page.favorites) ?? [])
      .filter(
        (favorite) =>
          !seen.has(favorite.movie_id) && (seen.add(favorite.movie_id), true),
      )
      .map((favorite) => ({
        id: favorite.movie_id,
        title: favorite.title,
        poster_path: favorite.poster_path,
        release_date: favorite.release_date,
      }));
  }, [favorites.data]);

  const renderMovie = useCallback(
    ({ item }: { item: MovieCardData }) => (
      <View className="flex-1 px-1.5 pb-3">
        <MovieCard movie={item} badgeVariant="favorite" />
      </View>
    ),
    [],
  );

  if (!isRestored) {
    return (
      <SafeAreaView
        edges={["left", "right"]}
        className="flex-1 items-center justify-center bg-black"
      >
        <ActivityIndicator color={APP_COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView
        edges={["left", "right"]}
        className="flex-1 items-center justify-center bg-black px-8"
      >
        <Ionicons
          name="heart-outline"
          size={54}
          color="#737373"
          accessible={false}
        />
        <Text className="mt-4 text-center text-xl font-bold text-white">
          Entre para ver seus favoritos
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-[#a3a3a3]">
          Salve filmes e acesse-os nesta lista.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/auth/login")}
          className="mt-6 rounded-full bg-primary px-6 py-3"
        >
          <Text className="font-semibold text-white">Entrar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-black">
      <View className="px-6 pb-5 pt-4">
        <Text className="text-xl font-bold text-white">Favoritos</Text>
      </View>
      <FlashList
        style={{ flex: 1 }}
        data={movies}
        keyExtractor={(movie) => String(movie.id)}
        numColumns={2}
        renderItem={renderMovie}
        refreshing={favorites.isRefetching && !favorites.isFetchingNextPage}
        onRefresh={() => void favorites.refreshFromStart()}
        onEndReached={() => {
          if (favorites.hasNextPage && !favorites.isFetchingNextPage)
            void favorites.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 112 }}
        ListFooterComponent={
          favorites.isFetchingNextPage ? (
            <View className="py-5">
              <ActivityIndicator color={APP_COLORS.primary} />
            </View>
          ) : favorites.isFetchNextPageError ? (
            <View className="items-center py-5">
              <Text className="text-sm text-[#ff8a80]">
                Não foi possível carregar mais favoritos.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void favorites.fetchNextPage()}
                className="mt-3 rounded-full border border-[#4a4a4c] px-4 py-2"
              >
                <Text className="text-sm font-semibold text-white">
                  Tentar novamente
                </Text>
              </Pressable>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="min-h-80 items-center justify-center px-8">
            {favorites.isPending ? (
              <>
                <ActivityIndicator size="large" color={APP_COLORS.primary} />
                <Text className="mt-4 text-base text-[#a3a3a3]">
                  Carregando favoritos...
                </Text>
              </>
            ) : favorites.error ? (
              <>
                <Ionicons
                  name="cloud-offline-outline"
                  size={52}
                  color="#737373"
                  accessible={false}
                />
                <Text className="mt-4 text-center text-lg font-semibold text-white">
                  Não foi possível carregar seus favoritos
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void favorites.refreshFromStart()}
                  className="mt-5 rounded-full bg-primary px-6 py-3"
                >
                  <Text className="font-semibold text-white">
                    Tentar novamente
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Ionicons
                  name="heart-outline"
                  size={52}
                  color="#737373"
                  accessible={false}
                />
                <Text className="mt-4 text-center text-lg font-semibold text-white">
                  Nenhum favorito ainda
                </Text>
                <Text className="mt-2 text-center text-sm text-[#a3a3a3]">
                  Adicione filmes pelo detalhe para vê-los aqui.
                </Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
