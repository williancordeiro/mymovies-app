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
import RatingStars from "./RatingStars";

interface RatingProps {
  movieId: number;
  movieTitle: string;
  value?: number | null;
  isPending: boolean;
  error: Error | null;
  onSubmit: (rating: number) => Promise<unknown>;
  onReset: () => void;
}

type RatingSelection = {
  movieId: number;
  value: number;
  rating: number;
  isPreview: boolean;
};

export default function Rating({
  movieId,
  movieTitle,
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
      AccessibilityInfo.announceForAccessibility(
        "Avaliação salva com sucesso.",
      );
      setIsModalVisible(false);
    } catch {}
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

        <RatingStars
          value={selectedRating}
          disabled={isPending}
          mode="trigger"
          onSelect={openModal}
        />
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-4">
          <View
            accessibilityViewIsModal
            className="w-full max-w-sm rounded-[20px] border border-[#3b3b39] bg-[#171716] px-4 pb-5 pt-6"
          >
            <Text
              accessibilityRole="header"
              className="text-center text-xl font-bold text-white"
            >
              Avalie este filme
            </Text>
            <Text
              numberOfLines={2}
              className="mt-2 text-center text-sm leading-5 text-[#a3a3a3]"
            >
              {movieTitle}
            </Text>
            <RatingStars
              value={selectedRating}
              disabled={isPending}
              mode="preview"
              onSelect={(rating) =>
                setSelection({
                  movieId,
                  value: currentRating,
                  rating,
                  isPreview: true,
                })
              }
            />
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 text-center text-sm font-medium text-[#d4d4d4]"
            >
              {selectedRating
                ? `${selectedRating} de 5 ${selectedRating === 1 ? "estrela" : "estrelas"}`
                : "Selecione uma nota"}
            </Text>
            {error ? (
              <Text
                accessibilityLiveRegion="assertive"
                className="mt-4 text-center text-sm leading-5 text-[#ff8a80]"
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
                className="min-h-12 flex-1 items-center justify-center rounded-xl border border-[#4a4a4c] bg-[#232322] px-4"
                style={({ pressed }) => ({
                  opacity: isPending ? 0.5 : pressed ? 0.72 : 1,
                })}
              >
                <Text className="font-bold text-white">Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isPending ? "Salvando avaliação" : "Confirmar avaliação"
                }
                accessibilityState={{
                  disabled: isPending || selectedRating === 0,
                  busy: isPending,
                }}
                disabled={isPending || selectedRating === 0}
                onPress={() => void submit()}
                className="min-h-12 flex-1 items-center justify-center rounded-xl bg-primary px-4"
                style={({ pressed }) => ({
                  opacity:
                    isPending || selectedRating === 0
                      ? 0.5
                      : pressed
                        ? 0.72
                        : 1,
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
