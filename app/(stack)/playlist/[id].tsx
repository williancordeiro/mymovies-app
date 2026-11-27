import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MovieCard from "../../../src/components/MovieCard/MovieCard";
import { useAuthSession } from "../../../src/hooks/auth";
import { useMovieSearch } from "../../../src/hooks/movie";
import {
  useAddMovieToPlaylist,
  usePlaylistDetails,
} from "../../../src/hooks/playlist";
import type { MovieCardData } from "../../../src/utils/movies/movie";

function PlaylistDetailContent({ playlistId }: { playlistId: number }) {
  const detail = usePlaylistDetails(playlistId);
  const add = useAddMovieToPlaylist();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const { session, isRestored } = useAuthSession();
  const movies = useMemo<MovieCardData[]>(() => {
    const ids = new Set<number>();
    return (detail.data?.pages.flatMap((page) => page.movies) ?? [])
      .filter(
        (movie) => !ids.has(movie.movie_id) && (ids.add(movie.movie_id), true),
      )
      .map((movie) => ({
        id: movie.movie_id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        mymovies_rating_average: movie.mymovies_rating_average,
      }));
  }, [detail.data]);
  const search = useMovieSearch(query);

  if (!isRestored) {
    return (
      <SafeAreaView
        edges={["left", "right"]}
        className="flex-1 items-center justify-center bg-black"
      >
        <ActivityIndicator color="#e07000" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView
        edges={["left", "right"]}
        className="flex-1 items-center justify-center bg-black px-8"
      >
        <Text className="text-center text-xl font-bold text-white">
          Entre para acessar esta playlist
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
      <FlashList
        style={{ flex: 1 }}
        data={movies}
        numColumns={2}
        keyExtractor={(movie) => String(movie.id)}
        renderItem={({ item }) => (
          <View className="flex-1 px-1.5 pb-3">
            <MovieCard movie={item} />
          </View>
        )}
        refreshing={detail.isRefetching && !detail.isFetchingNextPage}
        onRefresh={() => void detail.refreshFromStart()}
        onEndReached={() => {
          if (detail.hasNextPage && !detail.isFetchingNextPage) {
            void detail.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120 }}
        ListHeaderComponent={
          <View className="px-1.5 pb-5 pt-4">
            <Text className="text-xl font-bold text-white">
              {detail.data?.pages[0]?.playlist.title ?? "Playlist"}
            </Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Buscar filme para adicionar"
              placeholderTextColor="#a3a3a3"
              accessibilityLabel="Buscar filme para adicionar"
              className="mt-5 min-h-12 rounded-xl bg-[#1c1c1e] px-4 text-white"
              onSubmitEditing={() => setQuery(text.trim())}
              returnKeyType="search"
            />
            {query.length >= 3 ? (
              <View className="mt-3">
                {search.isPending ? (
                  <ActivityIndicator color="#e07000" />
                ) : (
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator
                    indicatorStyle="white"
                    style={{ maxHeight: 360 }}
                    contentContainerStyle={{ paddingRight: 4 }}
                  >
                    {search.data?.map((movie) => (
                      <Pressable
                        key={movie.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Adicionar ${movie.title}`}
                        disabled={add.isPending}
                        onPress={() =>
                          void add.mutateAsync({ playlistId, movieId: movie.id })
                        }
                        className="mb-2 min-h-16 justify-center rounded-xl border border-[#4a4a4c] px-4 py-3"
                      >
                        <Text
                          numberOfLines={2}
                          className="font-semibold leading-5 text-white"
                        >
                          {movie.title}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : null}
            {add.error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mt-2 text-[#ff8a80]"
              >
                {add.error.message}
              </Text>
            ) : null}
          </View>
        }
        ListFooterComponent={
          detail.isFetchNextPageError ? (
            <View className="items-center py-5">
              <Text className="text-[#ff8a80]">
                Não foi possível carregar mais filmes.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void detail.fetchNextPage()}
                className="mt-3 rounded-full border border-[#4a4a4c] px-4 py-2"
              >
                <Text className="font-semibold text-white">
                  Tentar novamente
                </Text>
              </Pressable>
            </View>
          ) : detail.isFetchingNextPage ? (
            <View className="py-5">
              <ActivityIndicator color="#e07000" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="min-h-64 items-center justify-center px-8">
            {detail.isPending ? (
              <ActivityIndicator color="#e07000" />
            ) : detail.error ? (
              <>
                <Text className="text-center text-lg font-semibold text-white">
                  Não foi possível carregar esta playlist
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void detail.refreshFromStart()}
                  className="mt-5 rounded-full bg-primary px-6 py-3"
                >
                  <Text className="font-semibold text-white">
                    Tentar novamente
                  </Text>
                </Pressable>
              </>
            ) : (
              <Text className="text-center text-lg font-semibold text-white">
                Nenhum filme nesta playlist
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const playlistId = Number(Array.isArray(id) ? id[0] : id);

  if (!Number.isInteger(playlistId) || playlistId <= 0) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-lg font-bold text-white">
            Playlist não encontrada
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <PlaylistDetailContent playlistId={playlistId} />;
}
