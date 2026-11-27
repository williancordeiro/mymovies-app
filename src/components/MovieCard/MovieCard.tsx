import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { APP_COLORS } from "../../constants/colors";
import type { MovieCardData } from "../../utils/movies/movie";

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

interface MovieCardProps {
  movie: MovieCardData;
  badgeVariant?: "rating" | "favorite";
  onRemoveFromPlaylist?: () => void;
  removingFromPlaylist?: boolean;
}

function getPosterUrl(posterPath: string | null) {
  if (!posterPath) return null;
  if (posterPath.startsWith("http://") || posterPath.startsWith("https://")) {
    return posterPath;
  }

  return `${POSTER_BASE_URL}/${posterPath.replace(/^\/+/, "")}`;
}

function MovieCard({
  movie,
  badgeVariant = "rating",
  onRemoveFromPlaylist,
  removingFromPlaylist = false,
}: MovieCardProps) {
  const posterUrl = getPosterUrl(movie.poster_path);
  const releaseYear = movie.release_date
    ? new Date(`${movie.release_date}T00:00:00`).getFullYear()
    : null;
  const ratingValue = movie.mymovies_rating_average;
  const hasRating =
    typeof ratingValue === "number" && Number.isFinite(ratingValue);
  const rating =
    typeof ratingValue === "number" && Number.isFinite(ratingValue)
      ? ratingValue.toFixed(1)
      : "—";

  return (
    <View className="relative overflow-hidden rounded-2xl bg-[#1c1c1e]">
      <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${movie.title}, ${releaseYear ?? "ano não informado"}, ${badgeVariant === "favorite" ? "favorito" : hasRating ? `avaliação ${rating}` : "avaliação indisponível"}`}
      className="overflow-hidden"
      onPress={() =>
        router.push({
          pathname: "/movie/[id]",
          params: { id: String(movie.id) },
        })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
    >
      <View className="aspect-[2/3] w-full overflow-hidden bg-[#29292c]">
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

        {badgeVariant === "favorite" ? (
          <View
            accessible
            accessibilityLabel="Favorito"
            className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          >
            <Ionicons
              name="heart"
              size={17}
              color="rgba(250, 82, 82, 0.9)"
              accessible={false}
            />
          </View>
        ) : null}
      </View>

      <View className="justify-between px-3 py-3" style={{ height: 88 }}>
        <Text className="font-semibold leading-5 text-white" numberOfLines={2}>
          {movie.title}
        </Text>
        <Text className="mt-1 text-xs text-[#a3a3a3]">
          {releaseYear ?? "Ano não informado"}
        </Text>
      </View>
      </Pressable>
      {badgeVariant === "rating" ? (
        <>
          {onRemoveFromPlaylist ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover ${movie.title} da playlist`}
              accessibilityState={{ disabled: removingFromPlaylist, busy: removingFromPlaylist }}
              disabled={removingFromPlaylist}
              onPress={onRemoveFromPlaylist}
              className="absolute left-2 top-2 h-11 w-11 items-center justify-center rounded-full bg-[#262626]"
            >
              <Ionicons name="trash-outline" size={21} color="#ff8a80" accessible={false} />
            </Pressable>
          ) : null}
          <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded-full bg-black/80 px-2 py-1">
          <View accessible accessibilityLabel={hasRating ? `Avaliação ${rating}` : "Avaliação indisponível"} className="flex-row items-center gap-1">
            <Ionicons name="star" size={13} color={APP_COLORS.ratingStar} accessible={false} />
            <Text className="text-xs font-bold text-white">{rating}</Text>
          </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

export default memo(MovieCard);
