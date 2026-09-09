import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Rating from "../../../src/components/Rating/Rating";
import { useMovie } from "../../../src/hooks/movie";
import type { MovieDetails } from "../../../src/utils/movieDetails";

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

function MovieContent({ movie }: { movie: MovieDetails }) {
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
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#FF8A3D]">
              <Ionicons name="star" size={19} color="#111111" />
            </View>
            <View>
              <Text className="text-xl font-bold text-white">
                {myMoviesRating}
              </Text>
              <Text className="text-xs text-[#8e8e93]">Avaliação Media</Text>
            </View>
          </View>
        </View>

        <Text className="mt-6 text-2xl font-bold leading-9 text-white">
          {movie.title}
        </Text>
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

        <Rating value={movie.user_rating} />

        {movie.tagline ? (
          <Text className="mt-7 border-l-2 border-[#FF8A3D] pl-4 text-base italic leading-6 text-[#d4d4d4]">
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
          <ActivityIndicator size="large" color="#FF8A3D" />
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
              className="mt-6 rounded-full bg-[#dd5d13] px-6 py-3"
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
      <MovieContent movie={movie} />
    </SafeAreaView>
  );
}
