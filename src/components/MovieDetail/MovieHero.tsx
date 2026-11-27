import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { Text, View } from "react-native";

import { APP_COLORS } from "../../constants/colors";

type MovieHeroProps = {
  backdropUrl: string | null;
  posterUrl: string | null;
  title: string;
  rating: string;
};

export default function MovieHero({
  backdropUrl,
  posterUrl,
  title,
  rating,
}: MovieHeroProps) {
  return (
    <>
      <View className="h-64 bg-[#171717]">
        {backdropUrl ? (
          <Image
            source={{ uri: backdropUrl }}
            accessibilityLabel={`Cena de fundo do filme ${title}`}
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
                accessibilityLabel={`Pôster do filme ${title}`}
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
              <Text className="text-xl font-bold text-white">{rating}</Text>
              <Text className="text-xs text-[#8e8e93]">Avaliação Media</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}
