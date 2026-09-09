import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

interface RatingProps {
  value?: number | null;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

export default function Rating({ value = null }: RatingProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const currentRating = value ? Math.min(Math.max(Math.round(value), 1), 5) : 0;

  const closeModal = () => setIsModalVisible(false);

  return (
    <>
      <View className="mt-8 border-y border-[#292929] py-6">
        <Text className="text-xl font-bold text-white">Sua avaliação</Text>
        <Text className="mt-1 text-sm text-[#8e8e93]">
          {currentRating
            ? `Você avaliou este filme com ${currentRating} de 5.`
            : "O que você achou deste filme?"}
        </Text>

        <View
          accessibilityRole="radiogroup"
          className="mt-4 flex-row items-center justify-between"
        >
          {RATING_OPTIONS.map((rating) => {
            const isSelected = rating <= currentRating;

            return (
              <Pressable
                key={rating}
                accessibilityRole="radio"
                accessibilityLabel={`Avaliar com ${rating} ${rating === 1 ? "estrela" : "estrelas"}`}
                accessibilityState={{ checked: isSelected }}
                hitSlop={4}
                onPress={() => setIsModalVisible(true)}
                className="h-12 w-12 items-center justify-center rounded-full"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#262626" : "transparent",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons
                  name={isSelected ? "star" : "star-outline"}
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
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#332116]">
              <Ionicons name="construct-outline" size={23} color="#FF8A3D" />
            </View>
            <Text className="mt-5 text-xl font-bold text-white">
              Funcionalidade em desenvolvimento
            </Text>
            <Text className="mt-2 text-sm leading-5 text-[#a3a3a3]">
              Em breve você poderá registrar sua avaliação para este filme.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={closeModal}
              className="mt-6 min-h-12 items-center justify-center rounded-lg bg-[#dd5d13] px-6"
              style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
            >
              <Text className="font-bold text-white">OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
