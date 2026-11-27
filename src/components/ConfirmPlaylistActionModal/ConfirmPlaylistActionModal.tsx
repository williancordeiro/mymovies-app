import { useRef } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

type ConfirmProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmPlaylistActionModal({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  pending,
  error,
  onClose,
  onConfirm,
}: ConfirmProps) {
  const submitting = useRef(false);
  const submit = async () => {
    if (pending || submitting.current) return;
    submitting.current = true;
    try {
      await onConfirm();
      onClose();
    } catch {
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/75 px-4">
        <View
          accessibilityViewIsModal
          className="w-full max-w-sm rounded-[20px] border border-[#3b3b39] bg-[#171716] p-5"
        >
          <Text
            accessibilityRole="header"
            className="text-center text-xl font-bold text-white"
          >
            {title}
          </Text>
          <Text className="mt-3 text-center leading-5 text-[#d1d1d1]">
            {message}
          </Text>
          {error ? (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 text-center text-sm text-[#ff8a80]"
            >
              {error}
            </Text>
          ) : null}
          <View className="mt-6 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              accessibilityState={{ disabled: pending }}
              disabled={pending}
              onPress={onClose}
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-[#4a4a4c]"
              style={({ pressed }) => ({
                opacity: pending ? 0.5 : pressed ? 0.72 : 1,
              })}
            >
              <Text className="font-bold text-white">Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                pending ? `${confirmLabel} em andamento` : confirmLabel
              }
              accessibilityState={{ busy: pending, disabled: pending }}
              disabled={pending}
              onPress={() => void submit()}
              className={`min-h-12 flex-1 items-center justify-center rounded-xl px-3 ${destructive ? "bg-[#b3261e]" : "bg-primary"}`}
              style={({ pressed }) => ({
                opacity: pending ? 0.5 : pressed ? 0.72 : 1,
              })}
            >
              {pending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-bold text-white">
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
