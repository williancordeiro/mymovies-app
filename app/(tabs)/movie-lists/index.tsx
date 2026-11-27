import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CreatePlaylistModal from "../../../src/components/CreatePlaylistModal/CreatePlaylistModal";
import Playlist from "../../../src/components/Playlist/Playlist";
import { useAuthSession } from "../../../src/hooks/auth";
import { useCreatePlaylist, usePlaylists } from "../../../src/hooks/playlist";

export default function ListsScreen() {
  const { session, isRestored } = useAuthSession();
  const query = usePlaylists();
  const create = useCreatePlaylist();
  const [open, setOpen] = useState(false);
  const playlists = useMemo(() => {
    const ids = new Set<number>();
    return (query.data?.pages.flatMap((page) => page.playlists) ?? []).filter(
      (item) => !ids.has(item.id) && (ids.add(item.id), true),
    );
  }, [query.data]);

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
          Entre para criar listas
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
      <Playlist
        playlists={playlists}
        isPending={Boolean(query.isPending)}
        error={query.error ?? null}
        refreshing={Boolean(query.isRefetching && !query.isFetchingNextPage)}
        fetchingMore={Boolean(query.isFetchingNextPage)}
        moreError={Boolean(query.isFetchNextPageError)}
        hasNextPage={Boolean(query.hasNextPage)}
        onCreate={() => setOpen(true)}
        onOpen={(item) =>
          router.push({
            pathname: "/playlist/[id]",
            params: { id: String(item.id) },
          })
        }
        onRefresh={() => void query.refreshFromStart()}
        onNext={() => void query.fetchNextPage()}
      />
      <CreatePlaylistModal
        visible={open}
        isPending={create.isPending}
        error={create.error?.message}
        onClose={() => setOpen(false)}
        onCreate={async (title) => {
          await create.mutateAsync({ title });
        }}
      />
    </SafeAreaView>
  );
}
