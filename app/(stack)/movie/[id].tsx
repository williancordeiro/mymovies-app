import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
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
import PlaylistDropdown from "../../../src/components/PlaylistDropdown/PlaylistDropdown";
import Rating from "../../../src/components/Rating/Rating";
import { APP_COLORS } from "../../../src/constants/colors";
import { useAuthSession } from "../../../src/hooks/auth";
import {
  useMovie,
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

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

function getImageUrl(path: string | null, size: "w500" | "w1280") {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${IMAGE_BASE_URL}/${size}/${path.replace(/^\/+/, "")}`;
}

function formatRuntime(runtime: number | null) {
  if (!runtime) return null;
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours ? `${hours}h ${minutes}min` : `${minutes}min`;
}

function formatCurrency(value: number) {
  if (!value) return "Não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[46%] flex-1 border-t border-[#292929] py-4">
      <Text className="text-xs font-semibold uppercase text-[#8e8e93]">
        {label}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-white">{value}</Text>
    </View>
  );
}

function MovieContent({
  movie,
  movieId,
}: {
  movie: MovieDetails;
  movieId: number;
}) {
  const rateMovie = useRateMovie();
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
  const backdropUrl = getImageUrl(movie.backdrop_path, "w1280");
  const posterUrl = getImageUrl(movie.poster_path, "w500");
  const myMoviesRating = Number.isFinite(movie.mymovies_rating_average)
    ? movie.mymovies_rating_average.toFixed(1)
    : "—";
  const year = movie.release_date
    ? new Date(`${movie.release_date}T00:00:00`).getFullYear()
    : null;
  const runtime = formatRuntime(movie.runtime);
  const metadata = [year, runtime, movie.status].filter(Boolean).join("  •  ");
  const languages = movie.spoken_languages.map((item) => item.name).join(", ");
  const countries = movie.production_countries
    .map((item) => item.name)
    .join(", ");
  const companies = movie.production_companies
    .map((item) => item.name)
    .join(", ");
  const isFavorite = movie.user_favorited;
  const favoriteLabel = isFavorite
    ? "Remover dos favoritos"
    : "Adicionar aos favoritos";

  const toggleFavorite = () => {
    if (setFavorite.isPending || !Number.isInteger(movieId) || movieId <= 0)
      return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setFavorite.reset();
    setFavorite.mutate({ movieId, favorited: !isFavorite });
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
      <View className="h-64 bg-[#171717]">
        {backdropUrl ? (
          <Image
            source={{ uri: backdropUrl }}
            accessibilityLabel={`Cena de fundo do filme ${movie.title}`}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={220}
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="film-outline" size={56} color="#525252" />
          </View>
        )}
        <View className="absolute inset-0 bg-black/25" />
      </View>

      <View className="px-6">
        <View className="-mt-14 flex-row items-end gap-5">
          <View className="h-40 w-28 overflow-hidden rounded-lg border-2 border-black bg-[#29292c]">
            {posterUrl ? (
              <Image
                source={{ uri: posterUrl }}
                accessibilityLabel={`Pôster do filme ${movie.title}`}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={180}
                cachePolicy="memory-disk"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="film-outline" size={34} color="#737373" />
              </View>
            )}
          </View>

          <View className="mb-1 flex-1 flex-row items-center gap-2">
            <MaterialCommunityIcons
              name="star-circle"
              size={40}
              color={APP_COLORS.ratingStar}
            />
            <View>
              <Text className="text-xl font-bold text-white">
                {myMoviesRating}
              </Text>
              <Text className="text-xs text-[#8e8e93]">Avaliação Media</Text>
            </View>
          </View>
        </View>

        <View className="mt-6 flex-row items-start justify-between gap-4">
          <Text className="flex-1 text-2xl font-bold leading-9 text-white">
            {movie.title}
          </Text>
          <View className="flex-row gap-2">
            <PlaylistDropdown
              playlists={playlists}
              isLoading={playlistsQuery.isPending}
              listError={playlistsQuery.error?.message}
              selectionError={addMovie.error?.message}
              isPending={addMovie.isPending}
              isFetchingMore={playlistsQuery.isFetchingNextPage}
              hasNextPage={Boolean(playlistsQuery.hasNextPage)}
              hasMovieInPlaylist={playlistMembership.data === true}
              onRequestOpen={openPlaylistSelector}
              onCreate={() => setCreateVisible(true)}
              onSelect={selectPlaylist}
              onRetry={() => void playlistsQuery.refreshFromStart()}
              onLoadMore={() => void playlistsQuery.fetchNextPage()}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                setFavorite.isPending ? "Atualizando favoritos" : favoriteLabel
              }
              accessibilityState={{
                selected: isFavorite,
                disabled: setFavorite.isPending,
                busy: setFavorite.isPending,
              }}
              disabled={setFavorite.isPending}
              onPress={toggleFavorite}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-[#262626]"
              style={({ pressed }) => ({
                opacity: setFavorite.isPending ? 0.5 : pressed ? 0.72 : 1,
              })}
            >
              {setFavorite.isPending ? (
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
        </View>
        {movie.original_title !== movie.title ? (
          <Text className="mt-1 text-sm text-[#8e8e93]">
            {movie.original_title}
          </Text>
        ) : null}
        {metadata ? (
          <Text className="mt-3 text-sm font-medium text-[#b8b8b8]">
            {metadata}
          </Text>
        ) : null}

        {setFavorite.error ? (
          <Text
            accessibilityLiveRegion="assertive"
            className="mt-3 text-sm leading-5 text-[#ff8a80]"
          >
            {setFavorite.error.message}
          </Text>
        ) : null}

        {movie.genres.length ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <View
                key={genre.id}
                className="rounded-full border border-[#3a3a3c] bg-[#1c1c1e] px-3 py-1.5"
              >
                <Text className="text-xs font-medium text-[#dedede]">
                  {genre.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Rating
          movieId={movieId}
          movieTitle={movie.title}
          value={movie.user_rating}
          isPending={rateMovie.isPending}
          error={rateMovie.error}
          onSubmit={(rating) => rateMovie.mutateAsync({ movieId, rating })}
          onReset={rateMovie.reset}
        />

        <CreatePlaylistModal
          visible={createVisible}
          movieId={movieId}
          isPending={createPlaylist.isPending}
          error={createPlaylist.error?.message}
          onClose={() => setCreateVisible(false)}
          onCreate={async (title, contextualMovieId) => {
            await createPlaylist.mutateAsync(
              contextualMovieId === undefined
                ? { title }
                : { title, movieIds: [contextualMovieId] },
            );
          }}
        />

        {movie.tagline ? (
          <Text className="mt-7 border-l-2 border-primary pl-4 text-base italic leading-6 text-[#d4d4d4]">
            {movie.tagline}
          </Text>
        ) : null}

        <View className="mt-8">
          <Text className="text-xl font-bold text-white">Sinopse</Text>
          <Text className="mt-3 text-base leading-7 text-[#c7c7c7]">
            {movie.overview || "Sinopse não disponível."}
          </Text>
        </View>

        <View className="mt-8">
          <Text className="mb-2 text-xl font-bold text-white">Informações</Text>
          <View className="flex-row flex-wrap gap-x-5">
            <DetailItem
              label="Lançamento"
              value={movie.release_date || "Não informado"}
            />
            <DetailItem
              label="Idioma original"
              value={movie.original_language.toUpperCase()}
            />
            <DetailItem
              label="Orçamento"
              value={formatCurrency(movie.budget)}
            />
            <DetailItem label="Receita" value={formatCurrency(movie.revenue)} />
            {languages ? (
              <DetailItem label="Idiomas" value={languages} />
            ) : null}
            {countries ? <DetailItem label="Países" value={countries} /> : null}
          </View>
        </View>

        {companies ? (
          <View className="mt-4 border-t border-[#292929] pt-6">
            <Text className="text-xl font-bold text-white">Produção</Text>
            <Text className="mt-3 text-sm leading-6 text-[#b8b8b8]">
              {companies}
            </Text>
          </View>
        ) : null}
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
