import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { PlaylistMetadata } from "../../utils/playlist/playlist";
import PlaylistCover from "../PlaylistCover/PlaylistCover";

type Props = {
  playlists: PlaylistMetadata[];
  isPending: boolean;
  error: Error | null;
  refreshing: boolean;
  fetchingMore: boolean;
  moreError: boolean;
  hasNextPage: boolean;
  onCreate: () => void;
  onOpen: (item: PlaylistMetadata) => void;
  onRefresh: () => void;
  onNext: () => void;
};

type Item = { create: true } | { create: false; playlist: PlaylistMetadata };

export default function Playlist({
  playlists,
  isPending,
  error,
  refreshing,
  fetchingMore,
  moreError,
  hasNextPage,
  onCreate,
  onOpen,
  onRefresh,
  onNext,
}: Props) {
  const data: Item[] = [
    { create: true },
    ...playlists.map((playlist) => ({ create: false as const, playlist })),
  ];

  const renderInitialState = () => {
    if (!playlists.length && isPending) {
      return (
        <View className="min-h-36 items-center justify-center">
          <ActivityIndicator color="#ffffff" />
          <Text className="mt-3 text-sm text-[#a3a3a3]">
            Carregando playlists...
          </Text>
        </View>
      );
    }

    if (!playlists.length && error) {
      return (
        <View className="min-h-36 items-center justify-center px-6">
          <Text className="text-center text-base font-semibold text-white">
            Não foi possível carregar suas playlists
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRefresh}
            className="mt-4 rounded-xl bg-primary px-5 py-3"
          >
            <Text className="font-semibold text-white">Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    if (!playlists.length) {
      return (
        <View className="min-h-36 items-center justify-center px-6">
          <Text className="text-center text-base text-[#a3a3a3]">
            Crie a sua primeira coleção de filmes.
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <FlashList
      style={{ flex: 1, width: "100%", maxWidth: 560, alignSelf: "center" }}
      data={data}
      numColumns={2}
      keyExtractor={(item) =>
        item.create ? "create" : String(item.playlist.id)
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={() => {
        if (hasNextPage && !fetchingMore) onNext();
      }}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{ paddingHorizontal: 13, paddingBottom: 120 }}
      renderItem={({ item }) => (
        <View style={{ flex: 1, paddingHorizontal: 5, paddingBottom: 10 }}>
          {item.create ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Criar nova playlist"
              onPress={onCreate}
              className="aspect-square items-center justify-center rounded-xl bg-primary"
              style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
            >
              <Ionicons name="add" size={48} color="#ffffff" />
              <Text className="absolute bottom-0 left-0 right-0 px-3 pb-4 text-center text-base font-bold text-white">
                Nova lista
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir playlist ${item.playlist.title}`}
              onPress={() => onOpen(item.playlist)}
              className="aspect-square overflow-hidden rounded-xl border-2 border-primary bg-[#262626]"
              style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
            >
              <PlaylistCover title={item.playlist.title} movies={item.playlist.cover_movies} />
              <View className="absolute bottom-0 left-0 right-0 bg-black/75 px-3 py-3">
                <Text numberOfLines={2} className="text-center text-base font-semibold leading-5 text-white">
                  {item.playlist.title}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      )}
      ListHeaderComponent={
        <View className="px-5 pb-6 pt-5">
          <Text className="text-2xl font-bold text-white">Listas</Text>
          <Text className="mt-1 text-base text-[#a3a3a3]">
            Suas coleções personalizadas
          </Text>
        </View>
      }
      ListFooterComponent={
        renderInitialState() ??
        (fetchingMore ? (
          <View className="py-5">
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : moreError ? (
          <Pressable
            accessibilityRole="button"
            onPress={onNext}
            className="items-center py-5"
          >
            <Text className="font-semibold text-[#ff8a80]">
              Tentar carregar mais
            </Text>
          </Pressable>
        ) : null)
      }
    />
  );
}
