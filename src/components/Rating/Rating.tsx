import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

import { getSession } from "../../session/authSession";

interface RatingProps {
  movieId: number;
  value?: number | null;
  isPending: boolean;
  error: Error | null;
  onSubmit: (rating: number) => Promise<unknown>;
  onReset: () => void;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

type RatingSelection = {
  movieId: number;
  value: number;
  rating: number;
  isPreview: boolean;
};

export default function Rating({
  movieId,
  value = null,
  isPending,
  error,
  onSubmit,
  onReset,
}: RatingProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const currentRating = value ? Math.min(Math.max(Math.round(value), 1), 5) : 0;
  const [selection, setSelection] = useState<RatingSelection>(() => ({
    movieId,
    value: currentRating,
    rating: currentRating,
    isPreview: false,
  }));
  const isCurrentSelection =
    selection.movieId === movieId && selection.value === currentRating;
  const selectedRating = isCurrentSelection ? selection.rating : currentRating;
  const hasPreview = isCurrentSelection && selection.isPreview;

  const closeModal = () => {
    if (!isPending) {
      setSelection({
        movieId,
        value: currentRating,
        rating: currentRating,
        isPreview: false,
      });
      setIsModalVisible(false);
    }
  };

  const openModal = (rating: number) => {
    if (
      isPending ||
      !Number.isInteger(movieId) ||
      movieId <= 0 ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return;
    }

    if (!getSession()) {
      router.push("/auth/login");
      return;
    }

    onReset();
    setSelection({ movieId, value: currentRating, rating, isPreview: true });
    setIsModalVisible(true);
  };

  const submit = async () => {
    if (isPending || selectedRating < 1 || selectedRating > 5) return;

    try {
      await onSubmit(selectedRating);
      AccessibilityInfo.announceForAccessibility("Avaliação salva com sucesso.");
      setIsModalVisible(false);
    } catch {
      // The mutation error remains visible and allows the user to retry.
    }
  };

  return (
    <>
      <View className="mt-8 border-y border-[#292929] py-6">
        <Text className="text-xl font-bold text-white">Sua avaliação</Text>
        {!hasPreview ? (
          <Text className="mt-1 text-sm text-[#8e8e93]">
            {currentRating
              ? `Você avaliou este filme com ${currentRating} de 5.`
              : "O que você achou deste filme?"}
          </Text>
        ) : null}

        <View
          accessibilityRole="radiogroup"
          className="mt-4 flex-row items-center justify-between"
        >
          {RATING_OPTIONS.map((rating) => {
            const isFilled = rating <= selectedRating;

            return (
              <Pressable
                key={rating}
                accessibilityRole="radio"
                accessibilityLabel={`Avaliar com ${rating} ${rating === 1 ? "estrela" : "estrelas"}`}
                accessibilityState={{ checked: rating === selectedRating, disabled: isPending }}
                disabled={isPending}
                hitSlop={4}
                onPress={() => openModal(rating)}
                className="h-12 w-12 items-center justify-center rounded-full"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#262626" : "transparent",
                  opacity: isPending ? 0.5 : pressed ? 0.75 : 1,
                })}
              >
                <Ionicons
                  name={isFilled ? "star" : "star-outline"}
                  size={32}
                  color="#FF8A3D"
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View
            accessibilityViewIsModal
            className="w-full max-w-sm rounded-lg border border-[#343434] bg-[#1c1c1e] px-6 pb-5 pt-6"
          >
            <Text accessibilityRole="header" className="text-xl font-bold text-white">
              Sua avaliação
            </Text>
            <Text className="mt-5 text-xl font-bold text-white">
              Quantas estrelas você dá para este filme?
            </Text>
            <Text className="mt-2 text-sm leading-5 text-[#a3a3a3]">
              Escolha uma nota de 1 a 5 estrelas.
            </Text>
            <View
              accessibilityRole="radiogroup"
              className="mt-5 flex-row justify-between"
            >
              {RATING_OPTIONS.map((rating) => {
                const isSelected = rating <= selectedRating;

                return (
                  <Pressable
                    key={rating}
                    accessibilityRole="radio"
                    accessibilityLabel={`${rating} ${rating === 1 ? "estrela" : "estrelas"}`}
                    accessibilityState={{ checked: selectedRating === rating, disabled: isPending }}
                    disabled={isPending}
                    hitSlop={4}
                    onPress={() =>
                      setSelection({
                        movieId,
                        value: currentRating,
                        rating,
                        isPreview: true,
                      })
                    }
                    className="h-11 w-11 items-center justify-center rounded-full"
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? "#262626" : "transparent",
                      opacity: isPending ? 0.5 : pressed ? 0.75 : 1,
                    })}
                  >
                    <Ionicons
                      name={isSelected ? "star" : "star-outline"}
                      size={29}
                      color="#FF8A3D"
                    />
                  </Pressable>
                );
              })}
            </View>
            {error ? (
              <Text
                accessibilityLiveRegion="assertive"
                className="mt-4 text-sm leading-5 text-[#ff8a80]"
              >
                {error.message}
              </Text>
            ) : null}
            <View className="mt-6 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isPending }}
                disabled={isPending}
                onPress={closeModal}
                className="min-h-12 flex-1 items-center justify-center rounded-lg border border-[#4a4a4c] px-4"
                style={({ pressed }) => ({ opacity: isPending ? 0.5 : pressed ? 0.72 : 1 })}
              >
                <Text className="font-bold text-white">Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPending ? "Salvando avaliação" : "Confirmar avaliação"}
                accessibilityState={{ disabled: isPending || selectedRating === 0, busy: isPending }}
                disabled={isPending || selectedRating === 0}
                onPress={() => void submit()}
                className="min-h-12 flex-1 items-center justify-center rounded-lg bg-[#dd5d13] px-4"
                style={({ pressed }) => ({
                  opacity: isPending || selectedRating === 0 ? 0.5 : pressed ? 0.72 : 1,
                })}
              >
                {isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="font-bold text-white">Confirmar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
