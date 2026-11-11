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

import { useLogin } from "../../../src/hooks/auth";
import { isLoginError } from "../../../src/utils/auth";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { mutateAsync, isPending } = useLogin();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    control,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    if (isPending) return;

    setGeneralError(null);

    try {
      await mutateAsync({ email: values.email.trim(), password: values.password });
      router.replace("/home");
    } catch (error) {
      setGeneralError(
        isLoginError(error)
          ? error.message
          : "Não foi possível entrar. Tente novamente.",
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
                Entre na sua conta
              </Text>
            </View>

            <View className="gap-4">
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
                autoComplete="current-password"
                editable={!isPending}
                icon="lock-closed"
                onFocus={() => {
                  clearErrors("password");
                  setGeneralError(null);
                }}
                onSubmitEditing={() => {
                  void submit();
                }}
                returnKeyType="done"
                secureTextEntry
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Esqueci minha senha"
              className="mt-4 self-end py-2"
              disabled={isPending}
              onPress={() => {
                Alert.alert(
                  "Recuperação de senha",
                  "A recuperação de senha ainda não está disponível.",
                );
              }}
              style={({ pressed }) => ({ opacity: isPending ? 0.45 : pressed ? 0.7 : 1 })}
            >
              <Text className="text-sm font-semibold text-[#C45E25]">Esqueci minha senha</Text>
            </Pressable>

            {generalError && (
              <View
                accessibilityLiveRegion="polite"
                className="mt-3 rounded-xl border border-red-500/60 bg-red-950/50 px-4 py-3"
              >
                <Text className="text-sm leading-5 text-red-200">{generalError}</Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Entrar"
              accessibilityState={{ disabled: isPending, busy: isPending }}
              className="mt-7 min-h-[60px] items-center justify-center rounded-[14px] bg-[#C45E25] px-6"
              disabled={isPending}
              onPress={() => {
                void submit();
              }}
              style={({ pressed }) => ({ opacity: isPending ? 0.6 : pressed ? 0.75 : 1 })}
            >
              {isPending ? (
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator color="#FFFFFF" />
                  <Text className="font-semibold text-white">Entrando...</Text>
                </View>
              ) : (
                <Text className="text-xl font-bold text-white">Entrar</Text>
              )}
            </Pressable>

            <View className="mb-[74px] mt-6 flex-row items-center justify-center">
              <Text className="text-base text-[#8A8A8F]">Ainda não tem uma conta? </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Criar nova conta"
                disabled={isPending}
                onPress={() => router.push("/auth/register")}
                style={({ pressed }) => ({ opacity: isPending ? 0.45 : pressed ? 0.7 : 1 })}
              >
                <Text className="text-base font-bold text-[#C45E25]">Nova Conta</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FormFieldProps = {
  control: Control<LoginFormValues>;
  error?: string;
  label: string;
  name: keyof LoginFormValues;
  placeholder: string;
  autoCapitalize: "none";
  autoComplete: "email" | "current-password";
  editable: boolean;
  keyboardType?: "default" | "email-address";
  icon: "at" | "lock-closed";
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
            <Ionicons accessible={false} color="#C45E25" name={icon} size={23} />
            <TextInput
              {...inputProps}
              accessibilityHint={error}
              accessibilityLabel={label}
              accessibilityState={{ disabled: !inputProps.editable }}
              autoCorrect={false}
              className="ml-4 flex-1 py-2 text-base text-white"
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
