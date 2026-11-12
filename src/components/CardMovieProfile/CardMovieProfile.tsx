import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

export interface CardMovieProfileProps {
  movieId: number;
  title: string;
  posterPath: string | null;
  rating: number | null;
}

function getPosterUrl(posterPath: string | null): string | null {
  if (!posterPath) return null;

  if (posterPath.startsWith("http://") || posterPath.startsWith("https://")) {
    return posterPath;
  }

  return `${POSTER_BASE_URL}/${posterPath.replace(/^\/+/, "")}`;
}

function getRatingLabel(rating: number | null): string {
  if (rating === null || !Number.isFinite(rating)) {
    return "Avaliação não informada";
  }

  return `Avaliação: ${rating} de 5 estrelas`;
}

function CardMovieProfile({
  movieId,
  title,
  posterPath,
  rating,
}: CardMovieProfileProps) {
  const posterUrl = getPosterUrl(posterPath);
  const normalizedRating =
    rating !== null && Number.isFinite(rating)
      ? Math.min(5, Math.max(0, rating))
      : null;
  const filledStars = normalizedRating === null ? 0 : Math.round(normalizedRating);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir filme ${title}. ${getRatingLabel(normalizedRating)}`}
      className="flex-row overflow-hidden rounded-2xl border border-[#dd5d13] bg-[#1c1c1e]"
      hitSlop={4}
      onPress={() =>
        router.push({
          pathname: "/movie/[id]",
          params: { id: String(movieId) },
        })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.76 : 1 })}
    >
      <View className="h-32 w-24 overflow-hidden bg-[#29292c]">
        {posterUrl ? (
          <Image
            accessibilityLabel={`Pôster do filme ${title}`}
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={String(movieId)}
            source={{ uri: posterUrl }}
            style={{ width: "100%", height: "100%" }}
            transition={180}
          />
        ) : (
          <View
            accessibilityLabel="Pôster indisponível"
            accessibilityRole="image"
            className="flex-1 items-center justify-center"
          >
            <Ionicons name="film-outline" size={31} color="#8e8e93" accessible={false} />
          </View>
        )}
      </View>

      <View className="flex-1 justify-between px-4 py-4">
        <Text className="text-base font-bold leading-5 text-white" numberOfLines={2}>
          {title}
        </Text>

        <View accessibilityLabel={getRatingLabel(normalizedRating)} accessibilityRole="text">
          <View className="flex-row gap-1">
            {Array.from({ length: 5 }, (_, index) => (
              <Ionicons
                key={index}
                accessible={false}
                color="#FF8A3D"
                name={index < filledStars ? "star" : "star-outline"}
                size={18}
              />
            ))}
          </View>
          {normalizedRating === null ? (
            <Text className="mt-1 text-xs text-[#a3a3a3]">Não avaliado</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default memo(CardMovieProfile);
