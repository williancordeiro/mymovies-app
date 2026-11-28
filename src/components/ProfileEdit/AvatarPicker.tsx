import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

function AvatarPreview({
  uri,
  username,
}: {
  uri: string | null;
  username: string;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = uri !== null && failedUri !== uri;

  return (
    <View className="h-28 w-28 overflow-hidden rounded-full border-2 border-primary bg-[#1c1c1e]">
      {showImage ? (
        <Image
          accessibilityLabel={`Imagem de perfil de ${username}`}
          cachePolicy="disk"
          contentFit="cover"
          source={{ uri }}
          style={{ height: "100%", width: "100%" }}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <View
          accessibilityLabel="Prévia de avatar indisponível"
          accessibilityRole="image"
          className="flex-1 items-center justify-center"
        >
          <Ionicons
            accessible={false}
            color="#a3a3a3"
            name="person-circle-outline"
            size={74}
          />
        </View>
      )}
    </View>
  );
}

type AvatarPickerProps = {
  uri: string | null;
  username: string;
  disabled: boolean;
  isPreparing: boolean;
  error: string | null;
  onChoose: () => void;
};

export default function AvatarPicker({
  uri,
  username,
  disabled,
  isPreparing,
  error,
  onChoose,
}: AvatarPickerProps) {
  return (
    <View className="mt-8 items-center">
      <AvatarPreview uri={uri} username={username} />
      <Pressable
        accessibilityLabel="Escolher nova imagem de perfil"
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: isPreparing }}
        className="mt-4 rounded-full border border-primary px-5 py-3"
        disabled={disabled}
        onPress={onChoose}
        style={({ pressed }) => ({
          opacity: disabled ? 0.55 : pressed ? 0.72 : 1,
        })}
      >
        {isPreparing ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#facc15" size="small" />
            <Text className="font-semibold text-primary">Preparando...</Text>
          </View>
        ) : (
          <Text className="font-semibold text-primary">Escolher imagem</Text>
        )}
      </Pressable>
      <Text className="mt-3 text-center text-xs leading-5 text-[#a3a3a3]">
        JPG, JPEG ou PNG.
      </Text>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-2 text-center text-sm text-red-300"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
