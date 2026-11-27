import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState, useSyncExternalStore } from "react";
import { Pressable } from "react-native";

import {
  getAuthSessionSnapshot,
  subscribeToAuthSession,
} from "../../session/authSession";
import { resolveAvatarUri } from "../shared/imageUrls";

type UserHeaderButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};

export default function UserHeaderButton({
  disabled = false,
  onPress,
}: UserHeaderButtonProps) {
  const isDisabled = disabled;
  const session = useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionSnapshot,
  ).session;
  const avatarUri = resolveAvatarUri(session?.user.avatar_file);
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
        onPress ?? (() => router.push(session ? "/profile" : "/auth/login"))
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
