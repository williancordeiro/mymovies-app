import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type EditProps = {
  visible: boolean;
  title: string;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (title: string) => Promise<void>;
};

export function EditPlaylistModal({
  visible,
  title,
  pending,
  error,
  onClose,
  onConfirm,
}: EditProps) {
  // The parent mounts this dialog only while it is open, so this initializer
  // reliably receives the current title without synchronizing state in an effect.
  const [value, setValue] = useState(title);
  const [localError, setLocalError] = useState<string>();
  const submitting = useRef(false);
  const submit = async () => {
    const next = value.trim();
    if (!next || next.length > 255) {
      setLocalError("Informe um título entre 1 e 255 caracteres.");
      return;
    }
    if (pending || submitting.current) return;
    submitting.current = true;
    try {
      await onConfirm(next);
      onClose();
    } catch {
      /* Error is rendered from mutation. */
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
            Editar playlist
          </Text>
          <TextInput
            value={value}
            onChangeText={(next) => {
              setValue(next);
              setLocalError(undefined);
            }}
            editable={!pending}
            maxLength={255}
            accessibilityLabel="Novo título da playlist"
            className="mt-5 min-h-12 rounded-xl border border-[#4a4a4c] bg-[#292929] px-4 text-white"
          />
          {localError || error ? (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 text-center text-sm text-[#ff8a80]"
            >
              {localError ?? error}
            </Text>
          ) : null}
          <View className="mt-6 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              onPress={onClose}
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-[#4a4a4c]"
            >
              <Text className="font-bold text-white">Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: pending, disabled: pending }}
              disabled={pending}
              onPress={() => void submit()}
              className="min-h-12 flex-1 items-center justify-center rounded-xl bg-primary"
            >
              {pending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-bold text-white">Salvar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
