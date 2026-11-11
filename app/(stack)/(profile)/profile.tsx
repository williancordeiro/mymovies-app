import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CardMovieProfile from "../../../src/components/CardMovieProfile/CardMovieProfile";
import FloatingBackButton from "../../../src/components/FloatingBackButton/FloatingBackButton";
import { useProfile } from "../../../src/hooks/profile";
import { useUserRatings } from "../../../src/hooks/users";
import { getSession } from "../../../src/session/authSession";
import { isProfileError } from "../../../src/utils/profile";

function resolveAvatarUri(avatarFile: string | null | undefined): string | null {
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

function RetryState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="items-center px-6 py-12">
      <Ionicons name="alert-circle-outline" size={38} color="#FF8A3D" accessible={false} />
      <Text className="mt-4 text-center text-base leading-6 text-[#d4d4d4]">{message}</Text>
      <Pressable
        accessibilityLabel="Tentar novamente"
        accessibilityRole="button"
        className="mt-5 rounded-full border border-[#FF8A3D] px-5 py-3"
        hitSlop={8}
        onPress={onRetry}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text className="font-semibold text-[#FF8A3D]">Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const session = getSession();
  const { data: profile, error: profileError, isPending: isProfilePending, refetch: refetchProfile } =
    useProfile();
  const {
    data: ratings,
    error: ratingsError,
    isPending: isRatingsPending,
    refetch: refetchRatings,
  } = useUserRatings(profile?.handle);
  const [failedAvatarUri, setFailedAvatarUri] = useState<string | null>(null);
  const avatarUri = resolveAvatarUri(profile?.avatarFile);
  const canShowAvatar = avatarUri !== null && failedAvatarUri !== avatarUri;

  if (profileError) {
    const message = isProfileError(profileError)
      ? profileError.message
      : "Não foi possível carregar perfil. Tente novamente.";

    return (
      <SafeAreaView className="flex-1 bg-black">
        <RetryState message={message} onRetry={() => void refetchProfile()} />
        <FloatingBackButton onPress={() => router.replace("/home")} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="person-circle-outline" size={56} color="#FF8A3D" accessible={false} />
          <Text className="mt-5 text-center text-lg font-bold text-white">Entre para ver seu perfil</Text>
          <Text className="mt-2 text-center text-base leading-6 text-[#a3a3a3]">
            Faça login para acessar suas avaliações.
          </Text>
          <Pressable
            accessibilityLabel="Ir para login"
            accessibilityRole="button"
            className="mt-6 rounded-full bg-[#FF8A3D] px-6 py-3"
            hitSlop={8}
            onPress={() => router.replace("/auth/login")}
            style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
          >
            <Text className="font-bold text-black">Entrar</Text>
          </Pressable>
        </View>
        <FloatingBackButton onPress={() => router.replace("/home")} />
      </SafeAreaView>
    );
  }

  if (isProfilePending || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF8A3D" />
          <Text className="mt-4 text-base text-[#a3a3a3]">Carregando perfil...</Text>
        </View>
        <FloatingBackButton onPress={() => router.replace("/home")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-6 pt-3">
          <Text className="text-xl font-black tracking-wide text-[#FF8A3D]">MYMOVIES</Text>
          <Pressable
            accessibilityLabel="Configurações do perfil"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-[#1c1c1e]"
            hitSlop={8}
            onPress={() => Alert.alert("Em Desenvolvimento")}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="settings-outline" size={23} color="#FFFFFF" accessible={false} />
          </Pressable>
        </View>

        <View className="items-center px-6 pt-9">
          <View className="h-28 w-28 overflow-hidden rounded-full border-2 border-[#FF8A3D] bg-[#1c1c1e]">
            {canShowAvatar ? (
              <Image
                accessibilityLabel={`Avatar de ${profile.username}`}
                cachePolicy="disk"
                contentFit="cover"
                source={{ uri: avatarUri }}
                style={{ width: "100%", height: "100%" }}
                onError={() => setFailedAvatarUri(avatarUri)}
              />
            ) : (
              <View accessibilityLabel="Avatar indisponível" accessibilityRole="image" className="flex-1 items-center justify-center">
                <Ionicons name="person-circle-outline" size={72} color="#a3a3a3" accessible={false} />
              </View>
            )}
          </View>
          <Text className="mt-4 text-2xl font-bold text-white">{profile.username}</Text>
          <Text className="mt-1 text-base text-[#a3a3a3]">@{profile.handle}</Text>
          <Pressable
            accessibilityLabel="Editar perfil"
            accessibilityRole="button"
            className="mt-6 rounded-full bg-[#FF8A3D] px-7 py-3"
            hitSlop={8}
            onPress={() => Alert.alert("Em Desenvolvimento")}
            style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
          >
            <Text className="font-bold text-black">Editar perfil</Text>
          </Pressable>
        </View>

        <View className="mt-10 px-6">
          <Text className="text-xl font-bold text-white">Últimas avaliações</Text>

          {ratingsError ? (
            <RetryState
              message={isProfileError(ratingsError) ? ratingsError.message : "Não foi possível carregar avaliações. Tente novamente."}
              onRetry={() => void refetchRatings()}
            />
          ) : isRatingsPending ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#FF8A3D" />
              <Text className="mt-3 text-sm text-[#a3a3a3]">Carregando avaliações...</Text>
            </View>
          ) : ratings?.length ? (
            <View className="mt-4 gap-4">
              {ratings.map((rating) => (
                <CardMovieProfile key={rating.movieId} {...rating} />
              ))}
            </View>
          ) : (
            <View className="items-center rounded-2xl bg-[#1c1c1e] px-6 py-10">
              <Ionicons name="star-outline" size={34} color="#a3a3a3" accessible={false} />
              <Text className="mt-3 text-center text-base text-[#d4d4d4]">
                Você ainda não avaliou nenhum filme.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <FloatingBackButton onPress={() => router.replace("/home")} />
    </SafeAreaView>
  );
}
