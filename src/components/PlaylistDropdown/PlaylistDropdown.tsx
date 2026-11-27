import Ionicons from "@expo/vector-icons/Ionicons";
import { type ComponentRef, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { APP_COLORS } from "../../constants/colors";
import type { PlaylistMetadata } from "../../utils/playlist/playlist";

type TriggerPosition = { top: number; right: number };

type Props = {
  playlists: PlaylistMetadata[];
  isLoading: boolean;
  listError?: string;
  selectionError?: string;
  isPending: boolean;
  isFetchingMore: boolean;
  hasNextPage: boolean;
  hasMovieInPlaylist?: boolean;
  onRequestOpen: () => boolean;
  onCreate: () => void;
  onSelect: (playlist: PlaylistMetadata) => Promise<void>;
  onRetry: () => void;
  onLoadMore: () => void;
};

export default function PlaylistDropdown({
  playlists,
  isLoading,
  listError,
  selectionError,
  isPending,
  isFetchingMore,
  hasNextPage,
  hasMovieInPlaylist = false,
  onRequestOpen,
  onCreate,
  onSelect,
  onRetry,
  onLoadMore,
}: Props) {
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TriggerPosition>({
    top: 64,
    right: 20,
  });

  const open = () => {
    if (!onRequestOpen()) return;
    trigger.current?.measureInWindow((x, y, width, height) => {
      setPosition({
        top: y + height + 8,
        right: Math.max(12, Dimensions.get("window").width - x - width),
      });
      setVisible(true);
    });
  };

  const create = () => {
    setVisible(false);
    onCreate();
  };

  const select = async (playlist: PlaylistMetadata) => {
    if (isPending) return;
    try {
      await onSelect(playlist);
      setVisible(false);
    } catch {
      // The mutation error stays visible in the menu so the user can retry.
    }
  };

  return (
    <>
      <View ref={trigger} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hasMovieInPlaylist
              ? "Gerenciar playlists deste filme"
              : "Adicionar a uma playlist"
          }
          accessibilityHint="Abre as suas playlists"
          accessibilityState={{ expanded: visible }}
          onPress={open}
          className="h-11 w-11 items-center justify-center rounded-full bg-[#262626]"
        >
          <Ionicons
            name={hasMovieInPlaylist ? "checkmark" : "add"}
            size={29}
            color={hasMovieInPlaylist ? APP_COLORS.primary : "#ffffff"}
          />
        </Pressable>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar menu de playlists"
            onPress={() => setVisible(false)}
            className="absolute inset-0"
          />
          <View
            accessibilityViewIsModal
            style={{ top: position.top, right: position.right, maxHeight: 320 }}
            className="absolute w-64 overflow-hidden rounded-xl border border-[#4a4a4c] bg-[#171716] py-1 shadow-2xl"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nova lista"
              onPress={create}
              disabled={isPending}
              className="min-h-12 flex-row items-center gap-3 px-4"
              style={({ pressed }) => ({
                opacity: isPending ? 0.5 : pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
              <Text className="font-semibold text-white">Nova lista</Text>
            </Pressable>

            <View className="border-t border-[#3a3a3c]" />
            {isLoading && !playlists.length ? (
              <View className="min-h-14 items-center justify-center">
                <ActivityIndicator color="#ffffff" />
              </View>
            ) : null}
            {listError ? (
              <View className="gap-2 px-4 py-3">
                <Text
                  accessibilityLiveRegion="polite"
                  className="text-sm text-[#ff8a80]"
                >
                  {listError}
                </Text>
                <Pressable accessibilityRole="button" onPress={onRetry}>
                  <Text className="font-semibold text-primary">
                    Tentar novamente
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {selectionError ? (
              <Text
                accessibilityLiveRegion="polite"
                className="px-4 py-2 text-sm text-[#ff8a80]"
              >
                {selectionError}
              </Text>
            ) : null}
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {playlists.map((playlist) => (
                <Pressable
                  key={playlist.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Adicionar à playlist ${playlist.title}`}
                  disabled={isPending}
                  onPress={() => void select(playlist)}
                  className="min-h-12 justify-center px-4"
                  style={({ pressed }) => ({
                    opacity: isPending ? 0.5 : pressed ? 0.7 : 1,
                  })}
                >
                  <Text numberOfLines={1} className="font-medium text-white">
                    {isPending ? "Adicionando..." : playlist.title}
                  </Text>
                </Pressable>
              ))}
              {hasNextPage ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Carregar mais playlists"
                  disabled={isFetchingMore || isPending}
                  onPress={onLoadMore}
                  className="min-h-12 items-center justify-center border-t border-[#3a3a3c]"
                >
                  {isFetchingMore ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="font-semibold text-primary">
                      Carregar mais
                    </Text>
                  )}
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
