import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { APP_COLORS } from "../../constants/colors";

type ConfirmPasswordProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  isPending: boolean;
  error?: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
};

export default function ConfirmPassword(props: ConfirmPasswordProps) {
  if (!props.visible) return null;

  return <ConfirmPasswordContent {...props} />;
}

function ConfirmPasswordContent({
  visible,
  title,
  description,
  confirmLabel = "Confirmar",
  destructive = false,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmPasswordProps) {
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string>();
  const confirmingRef = useRef(false);

  function cancel() {
    if (isPending || confirmingRef.current) return;
    setPassword("");
    setLocalError(undefined);
    onCancel();
  }

  async function confirm() {
    if (confirmingRef.current || isPending) return;
    if (password.length === 0) {
      setLocalError("Informe sua senha atual.");
      return;
    }

    confirmingRef.current = true;
    setLocalError(undefined);
    try {
      await onConfirm(password);
    } finally {
      setPassword("");
      confirmingRef.current = false;
    }
  }

  const displayedError = localError ?? error;
  const disabled = isPending;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={cancel}
    >
      <SafeAreaView className="flex-1 bg-black/75" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 items-center justify-center px-4"
        >
          <View
            accessibilityViewIsModal
            className="w-full max-w-sm rounded-[20px] border border-[#3b3b39] bg-[#171716] px-5 pb-5 pt-6"
          >
            <Text
              accessibilityRole="header"
              className="text-center text-xl font-bold text-white"
            >
              {title}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-[#a3a3a3]">
              {description}
            </Text>
            <Text className="mb-2 mt-6 text-base font-bold text-white">
              Senha atual
            </Text>
            <View
              className="min-h-[52px] justify-center rounded-[14px] border-2 bg-[#292929] px-4"
              style={{ borderColor: displayedError ? "#ef4444" : APP_COLORS.primary }}
            >
              <TextInput
                accessibilityHint={displayedError}
                accessibilityLabel="Senha atual"
                accessibilityState={{ disabled }}
                autoCapitalize="none"
                autoComplete="current-password"
                autoCorrect={false}
                className="text-base leading-5 text-white"
                editable={!disabled}
                onChangeText={(value) => {
                  setPassword(value);
                  setLocalError(undefined);
                }}
                secureTextEntry
                selectionColor={APP_COLORS.primary}
                style={{ paddingVertical: 0, textAlignVertical: "center" }}
                underlineColorAndroid="transparent"
                value={password}
              />
            </View>
            {displayedError && (
              <Text
                accessibilityLiveRegion="polite"
                className="mt-2 text-sm leading-5 text-red-300"
              >
                {displayedError}
              </Text>
            )}
            <View className="mt-6 flex-row gap-3">
              <Pressable
                accessibilityLabel="Cancelar confirmação de senha"
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                className="min-h-12 flex-1 items-center justify-center rounded-xl border border-[#4a4a4c] bg-[#232322] px-4"
                disabled={disabled}
                onPress={cancel}
                style={({ pressed }) => ({
                  opacity: disabled ? 0.5 : pressed ? 0.72 : 1,
                })}
              >
                <Text className="font-bold text-white">Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={disabled ? "Confirmando senha" : confirmLabel}
                accessibilityRole="button"
                accessibilityState={{ disabled, busy: disabled }}
                className={`min-h-12 flex-1 items-center justify-center rounded-xl px-4 ${destructive ? "bg-red-600" : "bg-primary"}`}
                disabled={disabled}
                onPress={() => void confirm()}
                style={({ pressed }) => ({
                  opacity: disabled ? 0.5 : pressed ? 0.72 : 1,
                })}
              >
                {disabled ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="font-bold text-white">{confirmLabel}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
