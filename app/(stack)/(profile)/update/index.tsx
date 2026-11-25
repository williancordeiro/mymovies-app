import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

import { APP_COLORS } from "../../../../src/constants/colors";
import {
  useProfile,
  useUpdateAvatar,
  useUpdateProfile,
} from "../../../../src/hooks/profile";
import { getSession } from "../../../../src/session/authSession";
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

type ProfileFormValues = z.infer<typeof profileSchema>;

function resolveAvatarUri(
  avatarFile: string | null | undefined,
): string | null {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!avatarFile || !apiUrl) return null;

  try {
    return new URL(avatarFile, new URL(apiUrl).origin).toString();
  } catch {
    return null;
  }
}

function validateAvatar(
  asset: ImagePicker.ImagePickerAsset,
): AvatarUploadInput | string {
  const name = asset.fileName ?? asset.uri.split("/").pop() ?? "avatar";
  const extension = name.split(".").pop();
  const mimeType = asset.mimeType;

  if (
    (extension !== "jpg" && extension !== "jpeg" && extension !== "png") ||
    (mimeType !== "image/jpeg" && mimeType !== "image/png")
  ) {
    return "Escolha uma imagem JPG, JPEG ou PNG com a extensão em minúsculas.";
  }
  if (
    asset.fileSize !== null &&
    asset.fileSize !== undefined &&
    asset.fileSize > 2 * 1024 * 1024
  ) {
    return "Escolha uma imagem de até 2 MiB.";
  }
  if (asset.width && asset.height) {
    const ratio = asset.width / asset.height;
    if (ratio < 0.95 || ratio > 1.05) {
      return "Escolha uma imagem quadrada.";
    }
  }

  return {
    uri: asset.uri,
    name,
    mimeType,
    size: asset.fileSize ?? undefined,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
  };
}

function AvatarPreview({
  uri,
  username,
}: {
  uri: string | null;
  username: string;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = uri !== null && failedUri !== uri;

  return (
    <View className="h-28 w-28 overflow-hidden rounded-full border-2 border-primary bg-[#1c1c1e]">
      {showImage ? (
        <Image
          accessibilityLabel={`Imagem de perfil de ${username}`}
          cachePolicy="disk"
          contentFit="cover"
          source={{ uri }}
          style={{ height: "100%", width: "100%" }}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <View
          accessibilityLabel="Prévia de avatar indisponível"
          accessibilityRole="image"
          className="flex-1 items-center justify-center"
        >
          <Ionicons
            accessible={false}
            color="#a3a3a3"
            name="person-circle-outline"
            size={74}
          />
        </View>
      )}
    </View>
  );
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
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: initialProfile.username,
      handle: initialProfile.handle,
    },
  });
  const isSaving = updateProfile.isPending || updateAvatar.isPending;
  const previewUri = avatar?.uri ?? resolveAvatarUri(baseline.avatarFile);
  const hasPendingChange = isDirty || avatar !== null;

  const chooseAvatar = async () => {
    if (isSaving) return;
    setAvatarError(null);
    setGeneralError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    const selected = validateAvatar(result.assets[0]);
    if (typeof selected === "string") {
      setAvatarError(selected);
      return;
    }
    setAvatar(selected);
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
    if (
      avatarOperation &&
      (error.kind === "invalidFile" || !Object.keys(error.fieldErrors).length)
    ) {
      setAvatarError(error.message);
      return;
    }
    setGeneralError(error.message);
  };

  const submit = handleSubmit(async (values) => {
    if (isSaving) return;
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
            <View className="mt-8 items-center">
              <AvatarPreview uri={previewUri} username={baseline.username} />
              <Pressable
                accessibilityLabel="Escolher nova imagem de perfil"
                accessibilityRole="button"
                accessibilityState={{ disabled: isSaving }}
                className="mt-4 rounded-full border border-primary px-5 py-3"
                disabled={isSaving}
                onPress={() => void chooseAvatar()}
                style={({ pressed }) => ({
                  opacity: isSaving ? 0.55 : pressed ? 0.72 : 1,
                })}
              >
                <Text className="font-semibold text-primary">
                  Trocar imagem
                </Text>
              </Pressable>
              <Text className="mt-3 text-center text-xs leading-5 text-[#a3a3a3]">
                JPG, JPEG ou PNG em minúsculas, até 2 MiB e com proporção
                quadrada.
              </Text>
              {avatarError && (
                <Text
                  accessibilityLiveRegion="polite"
                  className="mt-2 text-center text-sm text-red-300"
                >
                  {avatarError}
                </Text>
              )}
            </View>
            <View className="mt-8 gap-5">
              <FormField
                control={control}
                editable={!isSaving}
                error={errors.username?.message}
                label="Nome de usuário"
                name="username"
                autoCapitalize="words"
                onFocus={() => {
                  clearErrors("username");
                  setGeneralError(null);
                  setNotice(null);
                }}
              />
              <FormField
                control={control}
                editable={!isSaving}
                error={errors.handle?.message}
                label="Identificador"
                name="handle"
                autoCapitalize="none"
                onFocus={() => {
                  clearErrors("handle");
                  setGeneralError(null);
                  setNotice(null);
                }}
                prefix="@"
              />
            </View>
            {(generalError || notice) && (
              <View
                accessibilityLiveRegion="polite"
                className={`mt-5 rounded-xl border px-4 py-3 ${generalError ? "border-red-500/60 bg-red-950/50" : "border-primary/60 bg-[#1c1c1e]"}`}
              >
                <Text
                  className={
                    generalError
                      ? "text-sm text-red-200"
                      : "text-sm text-[#d4d4d4]"
                  }
                >
                  {generalError ?? notice}
                </Text>
              </View>
            )}
            <Pressable
              accessibilityLabel="Salvar alterações"
              accessibilityRole="button"
              accessibilityState={{
                disabled: isSaving || !hasPendingChange,
                busy: isSaving,
              }}
              className="mt-9 min-h-[60px] items-center justify-center rounded-[14px] bg-primary px-6"
              disabled={isSaving || !hasPendingChange}
              onPress={() => void submit()}
              style={({ pressed }) => ({
                opacity:
                  isSaving || !hasPendingChange ? 0.5 : pressed ? 0.75 : 1,
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

function FormField({
  control,
  editable,
  error,
  label,
  name,
  autoCapitalize,
  onFocus,
  prefix,
}: {
  control: ReturnType<typeof useForm<ProfileFormValues>>["control"];
  editable: boolean;
  error?: string;
  label: string;
  name: keyof ProfileFormValues;
  autoCapitalize: "none" | "words";
  onFocus: () => void;
  prefix?: string;
}) {
  return (
    <View>
      <Text className="mb-2 text-base font-bold text-white">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <View
            className="min-h-[58px] flex-row items-center rounded-[14px] border-2 bg-[#292929] px-5"
            style={{ borderColor: error ? "#ef4444" : APP_COLORS.primary }}
          >
            {prefix && (
              <View className="mr-1 self-stretch justify-center">
                <Text className="text-base leading-5 text-[#a3a3a3]">
                  {prefix}
                </Text>
              </View>
            )}
            <TextInput
              accessibilityHint={error}
              accessibilityLabel={label}
              accessibilityState={{ disabled: !editable }}
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
              className="flex-1 self-stretch text-base leading-5 text-white"
              editable={editable}
              maxLength={64}
              onBlur={onBlur}
              onChangeText={onChange}
              onFocus={onFocus}
              placeholderTextColor="#8A8A8F"
              selectionColor={APP_COLORS.primary}
              style={{ paddingVertical: 0, textAlignVertical: "center" }}
              underlineColorAndroid="transparent"
              value={value}
            />
          </View>
        )}
      />
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-2 text-sm text-red-300"
        >
          {error}
        </Text>
      )}
    </View>
  );
}
