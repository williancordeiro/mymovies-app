import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

import AvatarPicker from "../../../../src/components/ProfileEdit/AvatarPicker";
import ProfileEditFeedback from "../../../../src/components/ProfileEdit/ProfileEditFeedback";
import ProfileIdentityFields, {
  type ProfileIdentityFieldsValues,
} from "../../../../src/components/ProfileEdit/ProfileIdentityFields";
import { resolveAvatarUri } from "../../../../src/components/shared/imageUrls";
import { APP_COLORS } from "../../../../src/constants/colors";
import {
  useProfile,
  useUpdateAvatar,
  useUpdateProfile,
} from "../../../../src/hooks/profile";
import { getSession } from "../../../../src/session/authSession";
import { getAvatarInputError } from "../../../../src/utils/avatar";
import {
  isUpdateProfileError,
  type AvatarUploadInput,
  type Profile,
} from "../../../../src/utils/profile";

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Informe seu nome de usuário.")
    .max(64, "Use no máximo 64 caracteres."),
  handle: z
    .string()
    .trim()
    .min(1, "Informe seu identificador.")
    .max(64, "Use no máximo 64 caracteres."),
});

function validateAvatar(
  asset: ImagePicker.ImagePickerAsset,
): AvatarUploadInput | string {
  const mimeType = asset.mimeType;

  if (mimeType !== "image/jpeg" && mimeType !== "image/png") {
    return "Não foi possível identificar o formato da imagem. Escolha um arquivo JPG, JPEG ou PNG.";
  }

  const name = asset.fileName ?? asset.uri.split("/").pop() ?? "";
  const input: AvatarUploadInput = {
    uri: asset.uri,
    name,
    mimeType,
    size: asset.fileSize ?? undefined,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
  };

  return getAvatarInputError(input) ?? input;
}

export default function UpdateProfileScreen() {
  const session = getSession();
  const {
    data: profile,
    isPending: isProfilePending,
    error: profileError,
  } = useProfile();
  if (!session) {
    return (
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        className="flex-1 bg-black"
      >
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-lg font-bold text-white">
            Entre para editar seu perfil
          </Text>
          <Pressable
            accessibilityLabel="Ir para login"
            accessibilityRole="button"
            className="mt-6 rounded-full bg-primary px-6 py-3"
            onPress={() => router.replace("/auth/login")}
          >
            <Text className="font-bold text-black">Entrar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (profileError) {
    return (
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        className="flex-1 bg-black"
      >
        <View className="flex-1 items-center justify-center px-8">
          <Text
            accessibilityLiveRegion="polite"
            className="text-center text-base text-red-200"
          >
            Não foi possível carregar o perfil. Tente voltar e abrir esta tela
            novamente.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isProfilePending || !profile) {
    return (
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        className="flex-1 bg-black"
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={APP_COLORS.primary} size="large" />
          <Text className="mt-4 text-[#a3a3a3]">Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <UpdateProfileForm initialProfile={profile} />;
}

function UpdateProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const insets = useSafeAreaInsets();
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const [baseline, setBaseline] = useState(initialProfile);
  const [avatar, setAvatar] = useState<AvatarUploadInput | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileIdentityFieldsValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: initialProfile.username,
      handle: initialProfile.handle,
    },
  });
  const isSaving = updateProfile.isPending || updateAvatar.isPending;
  const isAvatarBusy = isSaving || isPreparingAvatar;
  const previewUri = avatar?.uri ?? resolveAvatarUri(baseline.avatarFile);
  const hasPendingChange = isDirty || avatar !== null;

  const chooseAvatar = async () => {
    if (isAvatarBusy) return;

    setIsPreparingAvatar(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;

      const selected = validateAvatar(result.assets[0]);
      if (typeof selected === "string") {
        setAvatarError(selected);
        return;
      }

      setAvatarError(null);
      setGeneralError(null);
      setAvatar(selected);
    } catch {
      setAvatarError(
        "Não foi possível preparar a imagem. Escolha outra foto e tente novamente.",
      );
    } finally {
      setIsPreparingAvatar(false);
    }
  };

  const applyServerError = (error: unknown, avatarOperation = false) => {
    if (!isUpdateProfileError(error)) {
      setGeneralError("Não foi possível atualizar o perfil. Tente novamente.");
      return;
    }

    if (error.kind === "unchanged") {
      setNotice(error.message);
      return;
    }
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      if (field === "username" || field === "handle") {
        setError(field, { type: "server", message });
      } else if (field === "avatar_file") {
        setAvatarError(message);
      }
    }
    if (avatarOperation && error.kind !== "unauthorized") {
      if (!Object.keys(error.fieldErrors).length) {
        setAvatarError(error.message);
      }
      return;
    }
    setGeneralError(error.message);
  };

  const submit = handleSubmit(async (values) => {
    if (isAvatarBusy) return;
    setGeneralError(null);
    setNotice(null);
    setAvatarError(null);

    const username = values.username.trim();
    const handle = values.handle.trim();
    const textUpdate = {
      ...(username !== baseline.username ? { username } : {}),
      ...(handle !== baseline.handle ? { handle } : {}),
    };

    if (!Object.keys(textUpdate).length && !avatar) {
      setNotice("Faça uma alteração antes de salvar.");
      return;
    }

    if (Object.keys(textUpdate).length) {
      try {
        const response = await updateProfile.mutateAsync(textUpdate);
        const nextBaseline: Profile = {
          id: response.user.id,
          username: response.user.username,
          handle: response.user.handle,
          email: response.user.email,
          role: response.user.role,
          avatarFile: response.user.avatar_file,
          bannerFile: response.user.banner_file,
        };
        setBaseline(nextBaseline);
        reset({ username: nextBaseline.username, handle: nextBaseline.handle });
      } catch (error) {
        applyServerError(error);
        return;
      }
    }

    if (avatar) {
      try {
        await updateAvatar.mutateAsync(avatar);
        setAvatar(null);
      } catch (error) {
        applyServerError(error, true);
        return;
      }
    }

    router.dismissTo("/profile");
  });

  const formDescription = useMemo(
    () => "Altere seu nome, identificador ou imagem de perfil.",
    [],
  );

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      className="flex-1 bg-black"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 26,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full self-center" style={{ maxWidth: 480 }}>
            <Text className="text-3xl font-bold text-white">Editar perfil</Text>
            <Text className="mt-2 text-base leading-6 text-[#a3a3a3]">
              {formDescription}
            </Text>
            <AvatarPicker
              uri={previewUri}
              username={baseline.username}
              disabled={isAvatarBusy}
              isPreparing={isPreparingAvatar}
              error={avatarError}
              onChoose={() => void chooseAvatar()}
            />
            <ProfileIdentityFields
              control={control}
              errors={errors}
              disabled={isSaving}
              onFieldFocus={(field) => {
                clearErrors(field);
                setGeneralError(null);
                setNotice(null);
              }}
            />
            <ProfileEditFeedback error={generalError} notice={notice} />
            <Pressable
              accessibilityLabel="Salvar alterações"
              accessibilityRole="button"
              accessibilityState={{
                disabled: isAvatarBusy || !hasPendingChange,
                busy: isAvatarBusy,
              }}
              className="mt-9 min-h-[60px] items-center justify-center rounded-[14px] bg-primary px-6"
              disabled={isAvatarBusy || !hasPendingChange}
              onPress={() => void submit()}
              style={({ pressed }) => ({
                opacity:
                  isAvatarBusy || !hasPendingChange ? 0.5 : pressed ? 0.75 : 1,
              })}
            >
              {isSaving ? (
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator color="#fff" />
                  <Text className="font-semibold text-white">Salvando...</Text>
                </View>
              ) : (
                <Text className="text-xl font-bold text-white">
                  Salvar alterações
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
