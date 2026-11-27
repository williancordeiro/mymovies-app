import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
};

export default function PlaylistMoviesFooter({
  isFetching,
  isError,
  onRetry,
}: Props) {
  if (isError) {
    return (
      <View className="items-center py-5">
        <Text className="text-[#ff8a80]">
          Não foi possível carregar mais filmes.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          className="mt-3 rounded-full border border-[#4a4a4c] px-4 py-2"
        >
          <Text className="font-semibold text-white">Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return isFetching ? (
    <View className="py-5">
      <ActivityIndicator color="#e07000" />
    </View>
  ) : null;
}
