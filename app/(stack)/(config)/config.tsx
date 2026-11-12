import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { logout } from "../../../src/api/auth";
import { clearSession, getSession } from "../../../src/session/authSession";

export default function ConfigScreen() {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      if (getSession()) {
        try {
          await logout();
        } catch {
          // Local cleanup ends the session even when the server is unavailable.
        }
      }

      await clearSession();
      queryClient.clear();
      router.replace("/home");
    } catch (error) {
      queryClient.clear();

      Alert.alert(
        "Não foi possível sair",
        error instanceof Error
          ? error.message
          : "Tente novamente.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black px-6" edges={["bottom"]}>
      <View className="flex-1 justify-end pb-4">
        <Pressable
          accessibilityLabel="Sair da conta"
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoggingOut, busy: isLoggingOut }}
          className="min-h-16 w-full items-center justify-center rounded-full bg-[#dc2626] px-6 py-5"
          disabled={isLoggingOut}
          hitSlop={8}
          onPress={() => void handleLogout()}
          style={({ pressed }) => ({
            opacity: isLoggingOut ? 0.6 : pressed ? 0.72 : 1,
          })}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-lg font-bold text-white">Sair</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
