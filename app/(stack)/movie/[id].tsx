import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CreatePlaylistModal from "../../../src/components/CreatePlaylistModal/CreatePlaylistModal";
import MovieDetailActions from "../../../src/components/MovieDetail/MovieDetailActions";
import MovieHero from "../../../src/components/MovieDetail/MovieHero";
import MovieInformation from "../../../src/components/MovieDetail/MovieInformation";
import Rating from "../../../src/components/Rating/Rating";
import { resolveMovieImageUrl } from "../../../src/components/shared/imageUrls";
import { APP_COLORS } from "../../../src/constants/colors";
import { useAuthSession } from "../../../src/hooks/auth";
import {
  useMovie,
  useRemoveMovieRating,
  useRateMovie,
  useSetMovieFavorite,
} from "../../../src/hooks/movie";
import {
  useAddMovieToPlaylist,
  useCreatePlaylist,
  useMoviePlaylistMembership,
  usePlaylists,
} from "../../../src/hooks/playlist";
import type { MovieDetails } from "../../../src/utils/movies/movieDetails";

function MovieContent({
  movie,
  movieId,
}: {
  movie: MovieDetails;
  movieId: number;
}) {
  const rateMovie = useRateMovie();
  const removeMovieRating = useRemoveMovieRating();
  const setFavorite = useSetMovieFavorite();
  const playlistsQuery = usePlaylists();
  const addMovie = useAddMovieToPlaylist();
  const createPlaylist = useCreatePlaylist();
  const playlistMembership = useMoviePlaylistMembership(movieId);
  const { session } = useAuthSession();
  const [createVisible, setCreateVisible] = useState(false);
  const selectionSubmitting = useRef(false);
  const playlists = useMemo(() => {
    const ids = new Set<number>();
    return (
      playlistsQuery.data?.pages.flatMap((page) => page.playlists) ?? []
    ).filter(
      (playlist) => !ids.has(playlist.id) && (ids.add(playlist.id), true),
    );
  }, [playlistsQuery.data]);
  const backdropUrl = resolveMovieImageUrl(movie.backdrop_path, "w1280");
  const posterUrl = resolveMovieImageUrl(movie.poster_path, "w500");
  const myMoviesRating = Number.isFinite(movie.mymovies_rating_average)
    ? movie.mymovies_rating_average.toFixed(1)
    : "—";

  const toggleFavorite = () => {
    if (setFavorite.isPending || !Number.isInteger(movieId) || movieId <= 0)
      return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setFavorite.reset();
    setFavorite.mutate({ movieId, favorited: !movie.user_favorited });
  };
  const openPlaylistSelector = () => {
    if (!session) {
      router.push("/auth/login");
      return false;
    }
    return true;
  };
  const selectPlaylist = async (playlist: (typeof playlists)[number]) => {
    if (selectionSubmitting.current || addMovie.isPending) return;
    selectionSubmitting.current = true;
    addMovie.reset();
    try {
      await addMovie.mutateAsync({ playlistId: playlist.id, movieId });
    } finally {
      selectionSubmitting.current = false;
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#000000" }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <MovieHero
        backdropUrl={backdropUrl}
        posterUrl={posterUrl}
        title={movie.title}
        rating={myMoviesRating}
      />
      <View className="px-6">
        <View className="mt-6 flex-row items-start justify-between gap-4">
          <Text className="flex-1 text-2xl font-bold leading-9 text-white">
            {movie.title}
          </Text>
          <MovieDetailActions
            isFavorite={movie.user_favorited}
            favoritePending={setFavorite.isPending}
            favoriteError={setFavorite.error?.message}
            playlists={playlists}
            playlistState={{
              isLoading: playlistsQuery.isPending,
              listError: playlistsQuery.error?.message,
              selectionError: addMovie.error?.message,
              isSelecting: addMovie.isPending,
              isFetchingMore: playlistsQuery.isFetchingNextPage,
              hasNextPage: Boolean(playlistsQuery.hasNextPage),
              hasMovieInPlaylist: playlistMembership.data === true,
            }}
            onToggleFavorite={toggleFavorite}
            onCreatePlaylist={() => setCreateVisible(true)}
            onSelectPlaylist={selectPlaylist}
            onOpenPlaylistPicker={openPlaylistSelector}
            onRetryPlaylists={() => void playlistsQuery.refreshFromStart()}
            onLoadMorePlaylists={() => void playlistsQuery.fetchNextPage()}
          />
        </View>
        <MovieInformation
          movie={movie}
          rating={
            <Rating
              movieId={movieId}
              movieTitle={movie.title}
              value={movie.user_rating}
              isPending={rateMovie.isPending}
              error={rateMovie.error}
              onSubmit={(rating) => rateMovie.mutateAsync({ movieId, rating })}
              onReset={rateMovie.reset}
              isRemoving={removeMovieRating.isPending}
              removeError={removeMovieRating.error}
              onRemove={() => removeMovieRating.mutateAsync(movieId)}
              onRemoveReset={removeMovieRating.reset}
            />
          }
        />
        <CreatePlaylistModal
          visible={createVisible}
          isPending={createPlaylist.isPending}
          error={createPlaylist.error?.message}
          onClose={() => setCreateVisible(false)}
          onCreate={async (title) => {
            await createPlaylist.mutateAsync({ title, movieIds: [movieId] });
          }}
        />
      </View>
    </ScrollView>
  );
}

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const movieId = Number(Array.isArray(id) ? id[0] : id);
  const isValidId = Number.isInteger(movieId) && movieId > 0;
  const { data: movie, error, isPending, refetch } = useMovie(movieId);
  if (isPending && isValidId) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
          <Text className="mt-4 text-base text-[#a3a3a3]">
            Carregando detalhes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isValidId || error || !movie) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center px-8 pb-20">
          <Ionicons name="alert-circle-outline" size={56} color="#737373" />
          <Text className="mt-4 text-center text-xl font-bold text-white">
            Filme não encontrado
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-[#a3a3a3]">
            Não foi possível carregar os detalhes deste filme.
          </Text>
          {isValidId ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => refetch()}
              className="mt-6 rounded-full bg-primary px-6 py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="font-semibold text-white">Tentar novamente</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <MovieContent movie={movie} movieId={movieId} />
    </SafeAreaView>
  );
}
