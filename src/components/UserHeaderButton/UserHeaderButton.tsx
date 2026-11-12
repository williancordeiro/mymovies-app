import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable } from "react-native";

import { getSession } from "../../session/authSession";

type UserHeaderButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};

function resolveAvatarUri(avatarFile: string | undefined): string | null {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!avatarFile || !apiUrl) {
    return null;
  }

  try {
    return new URL(avatarFile, new URL(apiUrl).origin).toString();
  } catch {
    return null;
  }
}

export default function UserHeaderButton({
  disabled = false,
  onPress,
}: UserHeaderButtonProps) {
  const isDisabled = disabled;
  const avatarUri = resolveAvatarUri(getSession()?.user.avatar_file);
  const [failedAvatarUri, setFailedAvatarUri] = useState<string | null>(null);
  const canShowAvatar = avatarUri !== null && failedAvatarUri !== avatarUri;

  return (
    <Pressable
      accessibilityLabel="Abrir conta"
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      className="mr-4 h-16 w-16 items-center justify-center rounded-full"
      disabled={isDisabled}
      onPress={
        onPress ??
        (() => router.push(getSession() ? "/profile" : "/auth/login"))
      }
      style={({ pressed }) => ({
        opacity: isDisabled ? 0.45 : pressed ? 0.65 : 1,
      })}
    >
      {canShowAvatar ? (
        <Image
          accessibilityLabel="Avatar da conta"
          cachePolicy="disk"
          contentFit="cover"
          source={avatarUri}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          onError={() => setFailedAvatarUri(avatarUri)}
        />
      ) : (
        <Ionicons
          name="person-circle-outline"
          size={48}
          color="#FFFFFF"
          accessible={false}
        />
      )}
    </Pressable>
  );
}
