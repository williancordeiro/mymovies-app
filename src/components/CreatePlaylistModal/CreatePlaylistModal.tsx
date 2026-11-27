import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  isPending: boolean;
  error?: string;
  onCreate: (title: string) => Promise<void>;
  onClose: () => void;
};

export default function CreatePlaylistModal({
  visible,
  isPending,
  error,
  onCreate,
  onClose,
}: Props) {
  const [title, setTitle] = useState("");
  const [localError, setLocalError] = useState<string>();
  const submitting = useRef(false);

  if (!visible) return null;

  const close = () => {
    if (!isPending && !submitting.current) {
      setTitle("");
      setLocalError(undefined);
      onClose();
    }
  };

  const submit = async () => {
    const value = title.trim();
    if (!value || value.length > 255) {
      setLocalError("Informe um título entre 1 e 255 caracteres.");
      return;
    }
    if (isPending || submitting.current) return;

    submitting.current = true;
    try {
      await onCreate(value);
      setTitle("");
      onClose();
    } catch {
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View className="flex-1 items-center justify-center bg-black/75 px-4">
        <View
          accessibilityViewIsModal
          className="w-full max-w-sm rounded-[20px] border border-[#3b3b39] bg-[#171716] px-4 pb-5 pt-6"
        >
          <Text
            accessibilityRole="header"
            className="text-center text-xl font-bold text-white"
          >
            Nova playlist
          </Text>
          <TextInput
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setLocalError(undefined);
            }}
            editable={!isPending}
            maxLength={255}
            placeholder="Nome da playlist"
            placeholderTextColor="#a3a3a3"
            accessibilityLabel="Título da playlist"
            className="mt-6 min-h-12 rounded-xl border border-[#4a4a4c] bg-[#292929] px-4 text-white"
            onSubmitEditing={() => void submit()}
          />
          {localError || error ? (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 text-center text-sm leading-5 text-[#ff8a80]"
            >
              {localError ?? error}
            </Text>
          ) : null}
          <View className="mt-6 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isPending }}
              disabled={isPending}
              onPress={close}
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-[#4a4a4c] bg-[#232322] px-4"
              style={({ pressed }) => ({
                opacity: isPending ? 0.5 : pressed ? 0.72 : 1,
              })}
            >
              <Text className="font-bold text-white">Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isPending ? "Criando playlist" : "Criar playlist"
              }
              accessibilityState={{ disabled: isPending, busy: isPending }}
              disabled={isPending}
              onPress={() => void submit()}
              className="min-h-12 flex-1 items-center justify-center rounded-xl bg-primary px-4"
              style={({ pressed }) => ({
                opacity: isPending ? 0.5 : pressed ? 0.72 : 1,
              })}
            >
              {isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-bold text-white">Criar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
