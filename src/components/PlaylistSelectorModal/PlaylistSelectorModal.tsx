import { Modal, Pressable, Text, View } from "react-native";

import type { PlaylistMetadata } from "../../utils/playlist/playlist";

type Props = {
  visible: boolean;
  playlists: PlaylistMetadata[];
  isPending: boolean;
  error?: string;
  onSelect: (playlist: PlaylistMetadata) => void;
  onCreate: () => void;
  onClose: () => void;
};

export default function PlaylistSelectorModal(props: Props) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/75 px-4">
        <View
          accessibilityViewIsModal
          className="w-full max-w-sm rounded-[20px] bg-[#171716] p-5"
        >
          <Text className="text-center text-xl font-bold text-white">
            Adicionar à playlist
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={props.onCreate}
            disabled={props.isPending}
            className="mt-5 min-h-12 items-center justify-center rounded-xl bg-primary"
          >
            <Text className="font-bold text-white">Nova playlist</Text>
          </Pressable>
          {props.playlists.map((playlist) => (
            <Pressable
              key={playlist.id}
              accessibilityRole="button"
              onPress={() => props.onSelect(playlist)}
              disabled={props.isPending}
              className="mt-2 min-h-12 justify-center rounded-xl border border-[#4a4a4c] px-4"
            >
              <Text className="font-semibold text-white">{playlist.title}</Text>
            </Pressable>
          ))}
          {props.error ? (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 text-[#ff8a80]"
            >
              {props.error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={props.onClose}
            className="mt-5 items-center"
          >
            <Text className="font-semibold text-white">Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
