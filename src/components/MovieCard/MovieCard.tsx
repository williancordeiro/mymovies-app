import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { memo } from "react";
import { Text, View } from "react-native";

import type { Movie } from "../../utils/movie";

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

interface MovieCardProps {
  movie: Movie;
}

function getPosterUrl(posterPath: string | null) {
  if (!posterPath) return null;
  if (posterPath.startsWith("http://") || posterPath.startsWith("https://")) {
    return posterPath;
  }

  return `${POSTER_BASE_URL}/${posterPath.replace(/^\/+/, "")}`;
}

function MovieCard({ movie }: MovieCardProps) {
  const posterUrl = getPosterUrl(movie.poster_path);
  const releaseYear = movie.release_date
    ? new Date(`${movie.release_date}T00:00:00`).getFullYear()
    : null;
  const rating = Number.isFinite(movie.vote_average)
    ? movie.vote_average.toFixed(1)
    : "—";

  return (
    <View
      accessible
      accessibilityLabel={`${movie.title}, ${releaseYear ?? "ano não informado"}, avaliação ${rating}`}
      className="overflow-hidden rounded-2xl bg-[#1c1c1e]"
    >
      <View className="aspect-2/3 w-full overflow-hidden bg-[#29292c]">
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            accessibilityLabel={`Pôster do filme ${movie.title}`}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            recyclingKey={String(movie.id)}
            transition={180}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons
              name="film-outline"
              size={42}
              color="#737373"
              accessible={false}
            />
            <Text className="mt-2 text-center text-xs text-[#8e8e93]">
              Pôster indisponível
            </Text>
          </View>
        )}

        <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded-full bg-black/80 px-2 py-1">
          <Ionicons name="star" size={13} color="#FF8A3D" accessible={false} />
          <Text className="text-xs font-bold text-white">{rating}</Text>
        </View>
      </View>

      <View className="min-h-18 px-3 py-3">
        <Text className="font-semibold leading-5 text-white" numberOfLines={2}>
          {movie.title}
        </Text>
        <Text className="mt-1 text-xs text-[#a3a3a3]">
          {releaseYear ?? "Ano não informado"}
        </Text>
      </View>
    </View>
  );
}

export default memo(MovieCard);
