import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Controller, type Control, useForm } from "react-hook-form";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { useRegister } from "../../../src/hooks/auth";
import { isRegisterError } from "../../../src/utils/auth";

const registerSchema = z.object({
  username: z.string().trim().min(1, "Informe seu nome de usuário."),
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
  passwordConfirmation: z.string().min(1, "Confirme sua senha."),
}).refine((values) => values.password === values.passwordConfirmation, {
  message: "As senhas precisam ser iguais.",
  path: ["passwordConfirmation"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const knownFields = new Set<keyof RegisterFormValues>([
  "username",
  "email",
  "password",
  "passwordConfirmation",
]);

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { mutateAsync, isPending } = useRegister();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    control,
    clearErrors,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    if (isPending) return;

    setGeneralError(null);

    try {
      await mutateAsync({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      });

      Alert.alert(
        "Cadastro concluído",
        "Sua conta foi criada. Você ainda precisará entrar para iniciar uma sessão.",
        [{ text: "Entrar", onPress: () => router.replace("/auth/login") }],
      );
    } catch (error) {
      if (!isRegisterError(error)) {
        setGeneralError("Não foi possível concluir o cadastro. Tente novamente.");
        return;
      }

      const unmappedErrors: string[] = [];

      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (knownFields.has(field as keyof RegisterFormValues)) {
          setError(field as keyof RegisterFormValues, { type: "server", message });
        } else {
          unmappedErrors.push(message);
        }
      }

      setGeneralError(
        unmappedErrors.length > 0
          ? [error.message, ...unmappedErrors].filter(Boolean).join("\n")
          : error.kind === "general"
            ? error.message
            : null,
      );
    }
  });

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
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
            paddingTop: 32,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full self-center" style={{ maxWidth: 480 }}>
            <View className="mb-10 items-center">
              <Text className="text-[42px] font-bold leading-[50px] text-[#C45E25]">
                My Movies
              </Text>
              <Text className="mt-5 text-base leading-6 text-[#8A8A8F]">
                Crie sua conta no My Movies
              </Text>
            </View>

            <View className="gap-4">
              <FormField
                control={control}
                error={errors.username?.message}
                label="Nome de usuário"
                name="username"
                placeholder="Usuario"
                autoCapitalize="words"
                autoComplete="username"
                editable={!isPending}
                icon="person"
                onFocus={() => {
                  clearErrors("username");
                  setGeneralError(null);
                }}
                returnKeyType="next"
              />
              <FormField
                control={control}
                error={errors.email?.message}
                label="E-mail"
                name="email"
                placeholder="usuario@email.com"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isPending}
                icon="at"
                keyboardType="email-address"
                onFocus={() => {
                  clearErrors("email");
                  setGeneralError(null);
                }}
                returnKeyType="next"
              />
              <FormField
                control={control}
                error={errors.password?.message}
                label="Senha"
                name="password"
                placeholder="••••••••"
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isPending}
                icon="lock-closed"
                onFocus={() => {
                  clearErrors("password");
                  clearErrors("passwordConfirmation");
                  setGeneralError(null);
                }}
                returnKeyType="next"
                secureTextEntry
              />
              <FormField
                control={control}
                error={errors.passwordConfirmation?.message}
                label="Confirmar Senha"
                name="passwordConfirmation"
                placeholder="••••••••"
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isPending}
                icon="lock-closed"
                onFocus={() => {
                  clearErrors("passwordConfirmation");
                  setGeneralError(null);
                }}
                onSubmitEditing={() => {
                  void submit();
                }}
                returnKeyType="done"
                secureTextEntry
              />
            </View>

            {generalError && (
              <View
                accessibilityLiveRegion="polite"
                className="mt-5 rounded-xl border border-red-500/60 bg-red-950/50 px-4 py-3"
              >
                <Text className="text-sm leading-5 text-red-200">{generalError}</Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Criar conta"
              accessibilityState={{ disabled: isPending, busy: isPending }}
              className="mb-[74px] mt-9 min-h-[60px] items-center justify-center rounded-[14px] bg-[#C45E25] px-6"
              disabled={isPending}
              onPress={() => {
                void submit();
              }}
              style={({ pressed }) => ({ opacity: isPending ? 0.6 : pressed ? 0.75 : 1 })}
            >
              {isPending ? (
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator color="#FFFFFF" />
                  <Text className="font-semibold text-white">Criando conta...</Text>
                </View>
              ) : (
                <Text className="text-xl font-bold text-white">Criar Conta</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FormFieldProps = {
  control: Control<RegisterFormValues>;
  error?: string;
  label: string;
  name: keyof RegisterFormValues;
  placeholder: string;
  autoCapitalize: "none" | "words";
  autoComplete: "email" | "new-password" | "username";
  editable: boolean;
  keyboardType?: "default" | "email-address";
  icon: "person" | "at" | "lock-closed";
  onFocus: () => void;
  onSubmitEditing?: () => void;
  returnKeyType: "next" | "done";
  secureTextEntry?: boolean;
};

function FormField({
  control,
  error,
  label,
  name,
  placeholder,
  icon,
  ...inputProps
}: FormFieldProps) {
  const inputId = `register-${name}`;

  return (
    <View>
      <Text className="mb-2 text-base font-bold text-white">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <View
            className="min-h-[58px] flex-row items-center rounded-[14px] border-2 bg-[#292929] px-5"
            style={{ borderColor: error ? "#ef4444" : "#C45E25" }}
          >
            <Ionicons
              accessible={false}
              color="#C45E25"
              name={icon}
              size={23}
            />
            <TextInput
              {...inputProps}
              accessibilityHint={error}
              accessibilityLabel={label}
              accessibilityState={{ disabled: !inputProps.editable }}
              autoCorrect={false}
              className="ml-4 flex-1 py-2 text-base text-white"
              nativeID={inputId}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor="#8A8A8F"
              selectionColor="#C45E25"
              underlineColorAndroid="transparent"
              value={value}
            />
          </View>
        )}
      />
      {error && (
        <Text accessibilityLiveRegion="polite" className="mt-2 text-sm text-red-300">
          {error}
        </Text>
      )}
    </View>
  );
}
