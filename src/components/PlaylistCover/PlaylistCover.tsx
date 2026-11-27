import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Text, View } from "react-native";

import type { PlaylistCoverMovie } from "../../utils/playlist/playlist";

type Props = { title: string; movies?: PlaylistCoverMovie[] };

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w342";

function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path)
    ? path
    : `${POSTER_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

function CoverCell({ movie }: { movie?: PlaylistCoverMovie }) {
  const uri = movie ? posterUrl(movie.poster_path) : null;
  return (
    <View className="flex-1 overflow-hidden bg-[#29292c]">
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={180}
          accessible={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Ionicons
            name="film-outline"
            size={28}
            color="#737373"
            accessible={false}
          />
        </View>
      )}
    </View>
  );
}

export default function PlaylistCover({ title, movies = [] }: Props) {
  const covers = movies.slice(0, 4);
  const count = covers.length;

  if (!count) {
    return (
      <View
        accessible
        accessibilityLabel={`Capa da playlist ${title} com 0 filmes`}
        className="flex-1 items-center justify-center bg-[#29292c]"
      >
        <Ionicons
          name="film-outline"
          size={42}
          color="#737373"
          accessible={false}
        />
        <Text className="mt-2 text-xs text-[#a3a3a3]">Lista vazia</Text>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={`Capa da playlist ${title} com ${count} ${count === 1 ? "filme" : "filmes"}`}
      className="flex-1 overflow-hidden bg-[#29292c]"
    >
      {count === 1 ? <CoverCell movie={covers[0]} /> : null}
      {count === 2 ? (
        <View className="flex-1 flex-row gap-px">
          <CoverCell movie={covers[0]} />
          <CoverCell movie={covers[1]} />
        </View>
      ) : null}
      {count === 3 ? (
        <>
          <View className="flex-1 flex-row gap-px">
            <CoverCell movie={covers[0]} />
            <CoverCell movie={covers[1]} />
          </View>
          <View className="flex-1 mt-px">
            <CoverCell movie={covers[2]} />
          </View>
        </>
      ) : null}
      {count >= 4 ? (
        <>
          <View className="flex-1 flex-row gap-px">
            <CoverCell movie={covers[0]} />
            <CoverCell movie={covers[1]} />
          </View>
          <View className="flex-1 mt-px flex-row gap-px">
            <CoverCell movie={covers[2]} />
            <CoverCell movie={covers[3]} />
          </View>
        </>
      ) : null}
    </View>
  );
}
