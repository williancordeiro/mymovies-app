import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, TextInput, View } from "react-native";

type Props = {
  title: string;
  editing: boolean;
  titleDraft: string;
  titleError?: string;
  renameError?: string;
  isRenamePending: boolean;
  canManage: boolean;
  isDeletePending: boolean;
  onTitleChange: (value: string) => void;
  onSubmitTitle: () => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onRequestDelete: () => void;
};

export default function PlaylistDetailHeader({
  title,
  editing,
  titleDraft,
  titleError,
  renameError,
  isRenamePending,
  canManage,
  isDeletePending,
  onTitleChange,
  onSubmitTitle,
  onStartEditing,
  onCancelEditing,
  onRequestDelete,
}: Props) {
  return (
    <>
      <View className="flex-row items-center justify-between gap-3">
        {editing ? (
          <TextInput
            value={titleDraft}
            onChangeText={onTitleChange}
            editable={!isRenamePending}
            maxLength={255}
            accessibilityLabel="Título da playlist"
            className="flex-1 rounded-xl border border-[#4a4a4c] bg-[#1c1c1e] px-3 text-xl font-bold text-white"
            style={{
              height: 44,
              paddingVertical: 0,
              textAlignVertical: "center",
              includeFontPadding: false,
            }}
            onSubmitEditing={onSubmitTitle}
          />
        ) : (
          <Text className="flex-1 text-xl font-bold text-white">{title}</Text>
        )}
        {editing ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Salvar título da playlist"
              accessibilityState={{
                disabled: isRenamePending,
                busy: isRenamePending,
              }}
              disabled={isRenamePending}
              onPress={onSubmitTitle}
              className="h-11 w-11 items-center justify-center rounded-full bg-[#262626]"
            >
              <Ionicons
                name="checkmark"
                size={23}
                color="#e07000"
                accessible={false}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar edição do título"
              accessibilityState={{ disabled: isRenamePending }}
              disabled={isRenamePending}
              onPress={onCancelEditing}
              className="h-11 w-11 items-center justify-center rounded-full bg-[#262626]"
            >
              <Ionicons
                name="close"
                size={23}
                color="#fff"
                accessible={false}
              />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar título da playlist"
              accessibilityState={{ disabled: !canManage || isRenamePending }}
              disabled={!canManage || isRenamePending}
              onPress={onStartEditing}
              className="h-11 w-11 items-center justify-center rounded-full bg-[#262626]"
            >
              <Ionicons
                name="pencil"
                size={20}
                color="#fff"
                accessible={false}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Excluir esta playlist"
              accessibilityState={{ disabled: !canManage || isDeletePending }}
              disabled={!canManage || isDeletePending}
              onPress={onRequestDelete}
              className="h-11 w-11 items-center justify-center rounded-full bg-[#262626]"
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color="#ff8a80"
                accessible={false}
              />
            </Pressable>
          </>
        )}
      </View>
      {titleError || renameError ? (
        <Text accessibilityLiveRegion="polite" className="mt-2 text-[#ff8a80]">
          {titleError ?? renameError}
        </Text>
      ) : null}
    </>
  );
}
