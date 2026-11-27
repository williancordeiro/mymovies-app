import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmPlaylistActionModal } from "../../../src/components/ConfirmPlaylistActionModal/ConfirmPlaylistActionModal";
import MovieCard from "../../../src/components/MovieCard/MovieCard";
import PlaylistDetailHeader from "../../../src/components/PlaylistDetail/PlaylistDetailHeader";
import PlaylistMovieSearch from "../../../src/components/PlaylistDetail/PlaylistMovieSearch";
import PlaylistMoviesFooter from "../../../src/components/PlaylistDetail/PlaylistMoviesFooter";
import { useAuthSession } from "../../../src/hooks/auth";
import { useMovieSearch } from "../../../src/hooks/movie";
import {
  useAddMovieToPlaylist,
  useDeletePlaylist,
  usePlaylistDetails,
  useRemoveMovieFromPlaylist,
  useRenamePlaylist,
} from "../../../src/hooks/playlist";
import type { MovieCardData } from "../../../src/utils/movies/movie";

function PlaylistDetailContent({ playlistId }: { playlistId: number }) {
  const detail = usePlaylistDetails(playlistId);
  const add = useAddMovieToPlaylist();
  const rename = useRenamePlaylist();
  const remove = useRemoveMovieFromPlaylist();
  const deletePlaylist = useDeletePlaylist();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [titleError, setTitleError] = useState<string>();
  const renaming = useRef(false);
  const [movieToRemove, setMovieToRemove] = useState<MovieCardData | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
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
  const title = detail.data?.pages[0]?.playlist.title ?? "Playlist";
  const submitTitle = async () => {
    const title = titleDraft.trim();
    if (!title) {
      setTitleError("Informe um título entre 1 e 255 caracteres.");
      return;
    }
    if (rename.isPending || renaming.current) return;
    renaming.current = true;
    try {
      await rename.mutateAsync({ playlistId, title });
      setEditing(false);
    } catch {
    } finally {
      renaming.current = false;
    }
  };
  const startEditing = () => {
    setTitleDraft(title);
    setTitleError(undefined);
    setEditing(true);
  };
  const cancelEditing = () => {
    setEditing(false);
    setTitleError(undefined);
  };
  const updateTitleDraft = (value: string) => {
    setTitleDraft(value);
    setTitleError(undefined);
  };
  const submitSearch = () => setQuery(text.trim());
  const addMovie = (movieId: number) => {
    void add.mutateAsync({ playlistId, movieId });
  };

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
            <MovieCard
              movie={item}
              onRemoveFromPlaylist={
                editing ? () => setMovieToRemove(item) : undefined
              }
              removingFromPlaylist={remove.isPending}
            />
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
            <PlaylistDetailHeader
              title={title}
              editing={editing}
              titleDraft={titleDraft}
              titleError={titleError}
              renameError={rename.error?.message}
              isRenamePending={rename.isPending}
              canManage={Boolean(detail.data?.pages[0])}
              isDeletePending={deletePlaylist.isPending}
              onTitleChange={updateTitleDraft}
              onSubmitTitle={() => void submitTitle()}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onRequestDelete={() => setDeleting(true)}
            />
            <PlaylistMovieSearch
              text={text}
              query={query}
              movies={search.data}
              isSearchPending={search.isPending}
              isAddPending={add.isPending}
              addError={add.error?.message}
              onTextChange={setText}
              onSubmit={submitSearch}
              onAdd={addMovie}
            />
          </View>
        }
        ListFooterComponent={
          <PlaylistMoviesFooter
            isError={detail.isFetchNextPageError}
            isFetching={detail.isFetchingNextPage}
            onRetry={() => void detail.fetchNextPage()}
          />
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
      <ConfirmPlaylistActionModal
        visible={Boolean(movieToRemove)}
        title="Remover filme"
        message={`Remover ${movieToRemove?.title ?? "este filme"} desta playlist?`}
        confirmLabel="Remover"
        destructive
        pending={remove.isPending}
        error={remove.error?.message}
        onClose={() => {
          if (!remove.isPending) setMovieToRemove(null);
        }}
        onConfirm={async () => {
          if (movieToRemove)
            await remove.mutateAsync({ playlistId, movieId: movieToRemove.id });
        }}
      />
      <ConfirmPlaylistActionModal
        visible={deleting}
        title="Excluir playlist"
        message={`Excluir ${detail.data?.pages[0]?.playlist.title ?? "esta playlist"}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        pending={deletePlaylist.isPending}
        error={deletePlaylist.error?.message}
        onClose={() => {
          if (!deletePlaylist.isPending) setDeleting(false);
        }}
        onConfirm={async () => {
          await deletePlaylist.mutateAsync({ playlistId });
          router.replace("/movie-lists");
        }}
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
