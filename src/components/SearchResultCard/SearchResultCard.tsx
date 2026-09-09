import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import type { Movie } from "../../utils/movie";

interface SearchResultCardProps {
  movie: Movie;
}

function SearchResultCard({ movie }: SearchResultCardProps) {
  const posterUrl = movie.poster_path
    ? /^https?:\/\//.test(movie.poster_path)
      ? movie.poster_path
      : `https://image.tmdb.org/t/p/w342/${movie.poster_path.replace(/^\/+/, "")}`
    : null;
  const year = movie.release_date?.match(/^\d{4}/)?.[0] ?? "Ano não informado";
  const rating = Number.isFinite(movie.mymovies_rating_average)
    ? movie.mymovies_rating_average.toFixed(1)
    : "—";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${movie.title}, ${year}, avaliação ${rating}`}
      className="flex-row items-center overflow-hidden rounded-2xl bg-[#1c1c1e]"
      onPress={() => router.push({
        pathname: "/movie/[id]",
        params: { id: String(movie.id) },
      })}
      style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
    >
      <View
        className="items-center justify-center overflow-hidden bg-[#29292c]"
        style={{ width: 96, height: 144, flexShrink: 0 }}
      >
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
          <>
            <Ionicons name="film-outline" size={32} color="#737373" accessible={false} />
            <Text className="mt-2 px-2 text-center text-xs text-[#8e8e93]">
              Pôster indisponível
            </Text>
          </>
        )}
      </View>
      <View className="min-w-0 flex-1 px-4 py-4">
        <Text className="text-base font-semibold leading-6 text-white" numberOfLines={3}>
          {movie.title}
        </Text>
        <View className="mt-3 flex-row items-center justify-between gap-3">
          <Text className="min-w-0 flex-1 text-sm text-[#a3a3a3]">{year}</Text>
          <View className="shrink-0 flex-row items-center gap-1">
            <Ionicons name="star" size={15} color="#FF8A3D" accessible={false} />
            <Text className="text-sm font-semibold text-white">{rating}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(SearchResultCard);
