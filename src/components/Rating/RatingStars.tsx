import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { APP_COLORS } from "../../constants/colors";

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

type RatingStarsProps = {
  value: number;
  disabled: boolean;
  mode: "trigger" | "preview";
  onSelect: (rating: number) => void;
};

export default function RatingStars({
  value,
  disabled,
  mode,
  onSelect,
}: RatingStarsProps) {
  const isTrigger = mode === "trigger";

  return (
    <View
      accessibilityRole="radiogroup"
      className={
        isTrigger
          ? "mt-4 flex-row items-center justify-between"
          : "mt-6 flex-row justify-center"
      }
    >
      {RATING_OPTIONS.map((rating) => {
        const isFilled = rating <= value;

        return (
          <Pressable
            key={rating}
            accessibilityRole="radio"
            accessibilityLabel={
              isTrigger
                ? `Avaliar com ${rating} ${rating === 1 ? "estrela" : "estrelas"}`
                : `${rating} ${rating === 1 ? "estrela" : "estrelas"}`
            }
            accessibilityState={{
              checked: rating === value,
              disabled,
            }}
            disabled={disabled}
            hitSlop={4}
            onPress={() => onSelect(rating)}
            className={
              isTrigger
                ? "h-12 w-12 items-center justify-center rounded-full"
                : "h-11 w-11 items-center justify-center rounded-full"
            }
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#262626" : "transparent",
              opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
            })}
          >
            <Ionicons
              name={isFilled ? "star" : "star-outline"}
              size={isTrigger ? 32 : 36}
              color={APP_COLORS.ratingStar}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
