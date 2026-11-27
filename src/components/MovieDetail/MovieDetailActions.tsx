import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { APP_COLORS } from "../../constants/colors";
import type { PlaylistMetadata } from "../../utils/playlist/playlist";
import PlaylistDropdown, {
  type PlaylistPickerActions,
  type PlaylistPickerState,
} from "../PlaylistDropdown/PlaylistDropdown";

type MovieDetailActionsProps = {
  isFavorite: boolean;
  favoritePending: boolean;
  favoriteError?: string;
  playlists: PlaylistMetadata[];
  playlistState: PlaylistPickerState;
  onToggleFavorite: () => void;
  onCreatePlaylist: () => void;
  onSelectPlaylist: (playlist: PlaylistMetadata) => Promise<void>;
  onOpenPlaylistPicker: () => boolean;
  onRetryPlaylists: () => void;
  onLoadMorePlaylists: () => void;
};

export default function MovieDetailActions({
  isFavorite,
  favoritePending,
  favoriteError,
  playlists,
  playlistState,
  onToggleFavorite,
  onCreatePlaylist,
  onSelectPlaylist,
  onOpenPlaylistPicker,
  onRetryPlaylists,
  onLoadMorePlaylists,
}: MovieDetailActionsProps) {
  const favoriteLabel = isFavorite
    ? "Remover dos favoritos"
    : "Adicionar aos favoritos";
  const playlistActions: PlaylistPickerActions = {
    requestOpen: onOpenPlaylistPicker,
    create: onCreatePlaylist,
    select: onSelectPlaylist,
    retry: onRetryPlaylists,
    loadMore: onLoadMorePlaylists,
  };

  return (
    <View>
      <View className="flex-row gap-2">
        <PlaylistDropdown
          playlists={playlists}
          state={playlistState}
          actions={playlistActions}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favoritePending ? "Atualizando favoritos" : favoriteLabel
          }
          accessibilityState={{
            selected: isFavorite,
            disabled: favoritePending,
            busy: favoritePending,
          }}
          disabled={favoritePending}
          onPress={onToggleFavorite}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full bg-[#262626]"
          style={({ pressed }) => ({
            opacity: favoritePending ? 0.5 : pressed ? 0.72 : 1,
          })}
        >
          {favoritePending ? (
            <ActivityIndicator size="small" color={APP_COLORS.primary} />
          ) : (
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={29}
              color={isFavorite ? "rgb(250, 82, 82)" : "#ffffff"}
            />
          )}
        </Pressable>
      </View>
      {favoriteError ? (
        <Text
          accessibilityLiveRegion="assertive"
          className="mt-3 text-sm leading-5 text-[#ff8a80]"
        >
          {favoriteError}
        </Text>
      ) : null}
    </View>
  );
}
