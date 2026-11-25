import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

import { logout } from "../../../src/api/auth";
import ConfirmPassword from "../../../src/components/ConfirmPassword/ConfirmPassword";
import { APP_COLORS } from "../../../src/constants/colors";
import {
  useAuthSession,
  useChangeEmail,
  useChangePassword,
  useDeleteAccount,
} from "../../../src/hooks/auth";
import { clearSession } from "../../../src/session/authSession";
import { isSensitiveAccountError } from "../../../src/utils/auth";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu novo e-mail.")
    .email("Informe um e-mail válido.")
    .max(64, "Use no máximo 64 caracteres."),
});
const passwordSchema = z.object({
  newPassword: z.string().min(1, "Informe sua nova senha."),
});
type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;
type ConfirmationAction = "email" | "password" | "delete";

export default function ConfigScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { session, isRestored } = useAuthSession();
  const changeEmail = useChangeEmail();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{
    error?: string;
    notice?: string;
  }>({});
  const [passwordFeedback, setPasswordFeedback] = useState<{
    error?: string;
    notice?: string;
  }>({});
  const [webConfirmVisible, setWebConfirmVisible] = useState(false);
  const [confirmationAction, setConfirmationAction] =
    useState<ConfirmationAction>();
  const [confirmationError, setConfirmationError] = useState<string>();
  const [isSuccessAwaitingConfirmation, setIsSuccessAwaitingConfirmation] =
    useState(false);
  const [isEmailSectionExpanded, setIsEmailSectionExpanded] = useState(false);
  const [isPasswordSectionExpanded, setIsPasswordSectionExpanded] =
    useState(false);
  const emailLock = useRef(false);
  const passwordLock = useRef(false);
  const deleteLock = useRef(false);
  const sessionTokenRef = useRef(session?.token);
  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "" },
  });

  useEffect(() => {
    if (isRestored && !session) router.replace("/auth/login");
  }, [isRestored, session]);
  useEffect(() => {
    if (sessionTokenRef.current !== session?.token) {
      sessionTokenRef.current = session?.token;
      setConfirmationAction(undefined);
      setConfirmationError(undefined);
    }
  }, [session?.token]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      try {
        await logout();
      } catch {
        /* Local cleanup still ends the session. */
      }
      await clearSession();
      queryClient.clear();
      router.replace("/home");
    } catch (error) {
      queryClient.clear();
      Alert.alert(
        "Não foi possível sair",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function submitEmail(values: EmailValues, password: string) {
    if (emailLock.current || changeEmail.isPending) return "retry" as const;
    emailLock.current = true;
    setEmailFeedback({});
    try {
      await changeEmail.mutateAsync({
        email: values.email.trim(),
        password,
      });
      setEmailFeedback({ notice: "E-mail atualizado com sucesso." });
      return "success" as const;
    } catch (error) {
      applyFieldErrors(error, emailForm, ["email"]);
      const passwordError = getPasswordError(error);
      const hasEmailError = Boolean(
        isSensitiveAccountError(error) && error.fieldErrors.email,
      );
      if (passwordError) {
        setConfirmationError(passwordError);
      } else if (hasEmailError) {
        setIsEmailSectionExpanded(true);
      } else {
        setConfirmationError(
          safeMessage(error, "Não foi possível atualizar seu e-mail. Tente novamente."),
        );
      }
      if (!hasEmailError) {
        setEmailFeedback({
          error: safeMessage(
            error,
            "Não foi possível atualizar seu e-mail. Tente novamente.",
          ),
        });
      }
      return hasEmailError && !passwordError
        ? ("edit" as const)
        : ("retry" as const);
    } finally {
      emailLock.current = false;
    }
  }

  async function submitPassword(values: PasswordValues, currentPassword: string) {
    if (passwordLock.current || changePassword.isPending) return "retry" as const;
    passwordLock.current = true;
    setPasswordFeedback({});
    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword: values.newPassword,
      });
      setPasswordFeedback({ notice: "Senha atualizada com sucesso." });
      return "success" as const;
    } catch (error) {
      applyFieldErrors(error, passwordForm, ["newPassword"]);
      const passwordError = getPasswordError(error);
      const hasNewPasswordError = Boolean(
        isSensitiveAccountError(error) && error.fieldErrors.newPassword,
      );
      if (passwordError) {
        setConfirmationError(passwordError);
      } else if (hasNewPasswordError) {
        setIsPasswordSectionExpanded(true);
      } else {
        setConfirmationError(
          safeMessage(error, "Não foi possível atualizar sua senha. Tente novamente."),
        );
      }
      if (!hasNewPasswordError) {
        setPasswordFeedback({
          error: safeMessage(
            error,
            "Não foi possível atualizar sua senha. Tente novamente.",
          ),
        });
      }
      return hasNewPasswordError && !passwordError
        ? ("edit" as const)
        : ("retry" as const);
    } finally {
      passwordForm.reset();
      passwordLock.current = false;
    }
  }

  async function submitDelete(password: string) {
    if (deleteLock.current || deleteAccount.isPending) return "retry" as const;
    deleteLock.current = true;
    try {
      await deleteAccount.mutateAsync({ password });
      router.replace("/home");
      return "success" as const;
    } catch (error) {
      setConfirmationError(
        safeMessage(
          error,
          "Não foi possível deletar sua conta. Tente novamente.",
        ),
      );
      return "retry" as const;
    } finally {
      deleteLock.current = false;
    }
  }

  function requestDeletion() {
    if (deleteAccount.isPending) return;
    if (Platform.OS === "web") {
      setWebConfirmVisible(true);
      return;
    }
    Alert.alert(
      "Deletar conta?",
      "Esta ação é definitiva e removerá sua conta e seus dados associados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => openConfirmation("delete"),
        },
      ],
      { cancelable: true },
    );
  }

  function openConfirmation(action: ConfirmationAction) {
    setConfirmationError(undefined);
    setConfirmationAction(action);
  }

  function closeConfirmation() {
    if (changeEmail.isPending || changePassword.isPending || deleteAccount.isPending) {
      return;
    }
    setConfirmationAction(undefined);
    setConfirmationError(undefined);
  }

  function finishSensitiveUpdate(action: "email" | "password") {
    emailForm.reset({ email: "" });
    passwordForm.reset({ newPassword: "" });
    setConfirmationAction(undefined);
    setConfirmationError(undefined);
    setIsSuccessAwaitingConfirmation(true);

    const title = action === "email" ? "E-mail atualizado" : "Senha atualizada";
    const message =
      action === "email"
        ? "Seu e-mail foi atualizado com sucesso."
        : "Sua senha foi atualizada com sucesso.";
    const navigateToProfile = () => {
      setIsSuccessAwaitingConfirmation(false);
      router.replace("/profile");
    };

    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      navigateToProfile();
      return;
    }

    Alert.alert(title, message, [{ text: "OK", onPress: navigateToProfile }], {
      cancelable: false,
    });
  }

  async function confirmCurrentPassword(password: string) {
    setConfirmationError(undefined);
    if (confirmationAction === "email") {
      const result = await submitEmail(emailForm.getValues(), password);
      if (result === "success") {
        finishSensitiveUpdate("email");
      } else if (result === "edit") {
        setConfirmationAction(undefined);
      }
      return;
    }
    if (confirmationAction === "password") {
      const result = await submitPassword(passwordForm.getValues(), password);
      if (result === "success") {
        finishSensitiveUpdate("password");
      } else if (result === "edit") {
        setConfirmationAction(undefined);
      }
      return;
    }
    if (confirmationAction === "delete") {
      await submitDelete(password);
    }
  }

  if (!isRestored || !session)
    return (
      <LoadingState
        label={
          isRestored
            ? "Redirecionando para entrar..."
            : "Carregando configurações..."
        }
      />
    );
  const emailPending = changeEmail.isPending;
  const passwordPending = changePassword.isPending;
  const deletePending = deleteAccount.isPending;
  const confirmationPending =
    confirmationAction === "email"
      ? emailPending
      : confirmationAction === "password"
        ? passwordPending
        : deletePending;

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full self-center" style={{ maxWidth: 480 }}>
            <Text className="text-3xl font-bold text-white">Configurações</Text>
            <Text className="mt-2 text-base leading-6 text-[#a3a3a3]">
              Proteja e atualize os dados da sua conta.
            </Text>
            <Section
              title="Alterar e-mail"
              description="Atualize o e-mail usado para acessar sua conta."
              expanded={isEmailSectionExpanded}
              onToggle={() => setIsEmailSectionExpanded((expanded) => !expanded)}
            >
              <ReadOnlyField label="E-mail atual" value={session.user.email} />
              <FormField
                control={emailForm.control}
                error={emailForm.formState.errors.email?.message}
                label="Novo e-mail"
                name="email"
                editable={!emailPending}
                autoComplete="email"
                keyboardType="email-address"
                placeholder="novo@email.com"
                onFocus={() => {
                  emailForm.clearErrors("email");
                  setEmailFeedback({});
                }}
              />
              <Feedback {...emailFeedback} />
              <ActionButton
                label="Atualizar e-mail"
                pendingLabel="Atualizando..."
                pending={emailPending || isSuccessAwaitingConfirmation}
                compact
                onPress={() => {
                  void emailForm.handleSubmit(() => openConfirmation("email"))();
                }}
              />
            </Section>
            <Section
              title="Alterar senha"
              description="Defina uma nova senha para sua conta."
              expanded={isPasswordSectionExpanded}
              onToggle={() =>
                setIsPasswordSectionExpanded((expanded) => !expanded)
              }
            >
              <FormField
                control={passwordForm.control}
                error={passwordForm.formState.errors.newPassword?.message}
                label="Nova senha"
                name="newPassword"
                editable={!passwordPending}
                autoComplete="new-password"
                secureTextEntry
                onFocus={() => {
                  passwordForm.clearErrors("newPassword");
                  setPasswordFeedback({});
                }}
              />
              <Feedback {...passwordFeedback} />
              <ActionButton
                label="Atualizar senha"
                pendingLabel="Atualizando..."
                pending={passwordPending || isSuccessAwaitingConfirmation}
                compact
                onPress={() => {
                  void passwordForm.handleSubmit(() => openConfirmation("password"))();
                }}
              />
            </Section>
            {webConfirmVisible && (
              <View
                accessibilityLiveRegion="polite"
                className="mt-5 rounded-xl border border-red-500/70 bg-red-950/50 p-4"
              >
                <Text className="text-base font-bold text-red-100">
                  Excluir sua conta definitivamente?
                </Text>
                <Text className="mt-2 text-sm leading-5 text-red-100">
                  Esta ação é irreversível e removerá sua conta e seus dados
                  associados.
                </Text>
                <View className="mt-4 flex-row gap-3">
                  <SmallButton
                    label="Cancelar"
                    onPress={() => setWebConfirmVisible(false)}
                  />
                  <SmallButton
                    label="Continuar"
                    destructive
                    onPress={() => {
                      setWebConfirmVisible(false);
                      openConfirmation("delete");
                    }}
                  />
                </View>
              </View>
            )}
            {confirmationAction !== undefined && (
              <ConfirmPassword
                confirmLabel={
                  confirmationAction === "delete" ? "Deletar conta" : "Confirmar"
                }
                destructive={confirmationAction === "delete"}
                description={
                  confirmationAction === "delete"
                    ? "Informe sua senha atual para concluir a exclusão definitiva."
                    : "Informe sua senha atual para confirmar esta alteração."
                }
                error={confirmationError}
                isPending={confirmationPending}
                title={
                  confirmationAction === "delete"
                    ? "Confirmar exclusão"
                    : "Confirme sua senha"
                }
                visible
                onCancel={closeConfirmation}
                onConfirm={confirmCurrentPassword}
              />
            )}
          </View>
        </ScrollView>
        <View
          className="border-t border-[#292929] bg-black px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="w-full self-center gap-3" style={{ maxWidth: 480 }}>
            <ActionButton
              label="Sair"
              pendingLabel="Saindo..."
              pending={isLoggingOut}
              destructive
              onPress={() => void handleLogout()}
            />
            <Pressable
              accessibilityLabel="Deletar conta"
              accessibilityRole="button"
              accessibilityState={{
                disabled: deletePending,
                busy: deletePending,
              }}
              className="min-h-[60px] items-center justify-center rounded-[14px] border border-red-500 px-6"
              disabled={deletePending}
              hitSlop={8}
              onPress={requestDeletion}
              style={({ pressed }) => ({
                opacity: deletePending ? 0.5 : pressed ? 0.72 : 1,
              })}
            >
              <Text className="text-lg font-bold text-red-300">
                Deletar Conta
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function safeMessage(error: unknown, fallback: string) {
  return isSensitiveAccountError(error) ? error.message : fallback;
}
function getPasswordError(error: unknown) {
  if (!isSensitiveAccountError(error)) return undefined;
  return error.kind === "invalidCredentials"
    ? error.message
    : error.fieldErrors.password ?? error.fieldErrors.currentPassword;
}
function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
  fields: Path<T>[],
) {
  if (!isSensitiveAccountError(error)) return;
  for (const field of fields) {
    const message = error.fieldErrors[field];
    if (message) form.setError(field, { type: "server", message });
  }
}
function LoadingState({ label }: { label: string }) {
  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 items-center justify-center bg-black"
    >
      <ActivityIndicator color={APP_COLORS.primary} size="large" />
      <Text className="mt-4 text-[#a3a3a3]">{label}</Text>
    </SafeAreaView>
  );
}
function Section({
  title,
  description,
  children,
  expanded,
  onToggle,
}: {
  title: string;
  description: string;
  children: ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="mt-8">
      <Pressable
        accessibilityHint={expanded ? "Toque para recolher" : "Toque para abrir"}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="min-h-12 flex-row items-center justify-between"
        hitSlop={8}
        onPress={onToggle}
        style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
      >
        <View className="flex-1 pr-4">
          <Text className="text-xl font-bold text-white">{title}</Text>
          <Text className="mt-1 text-sm leading-5 text-[#a3a3a3]">
            {description}
          </Text>
        </View>
        <Text accessible={false} className="text-2xl text-primary">
          {expanded ? "⌃" : "⌄"}
        </Text>
      </Pressable>
      <View
        className="mt-5 gap-4"
        pointerEvents={expanded ? "auto" : "none"}
        style={{ display: expanded ? "flex" : "none" }}
      >
        {children}
      </View>
    </View>
  );
}
function Feedback({ error, notice }: { error?: string; notice?: string }) {
  const content = error ?? notice;
  return content ? (
    <View
      accessibilityLiveRegion="polite"
      className={`rounded-xl border px-4 py-3 ${error ? "border-red-500/60 bg-red-950/50" : "border-primary/60 bg-[#292929]"}`}
    >
      <Text
        className={
          error
            ? "text-sm leading-5 text-red-200"
            : "text-sm leading-5 text-[#d4d4d4]"
        }
      >
        {content}
      </Text>
    </View>
  ) : null;
}
function ActionButton({
  label,
  pendingLabel,
  pending,
  destructive = false,
  compact = false,
  onPress,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
  destructive?: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: pending, busy: pending }}
      className={`${compact ? "min-h-11 self-end px-5" : "min-h-[60px] px-6"} items-center justify-center rounded-[14px] ${destructive ? "bg-red-600" : "bg-primary"}`}
      disabled={pending}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pending ? 0.5 : pressed ? 0.72 : 1 })}
    >
      {pending ? (
        <View className="flex-row items-center gap-3">
          <ActivityIndicator color="#fff" />
          <Text className="font-semibold text-white">{pendingLabel}</Text>
        </View>
      ) : (
        <Text className="text-lg font-bold text-white">{label}</Text>
      )}
    </Pressable>
  );
}
function SmallButton({
  label,
  destructive = false,
  disabled = false,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`flex-1 items-center rounded-lg px-3 py-3 ${destructive ? "bg-red-600" : "bg-[#292929]"}`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
function FormField<T extends FieldValues>({
  control,
  error,
  label,
  name,
  editable,
  autoComplete,
  keyboardType,
  secureTextEntry,
  placeholder,
  onFocus,
}: {
  control: Control<T>;
  error?: string;
  label: string;
  name: Path<T>;
  editable: boolean;
  autoComplete: "email" | "current-password" | "new-password";
  keyboardType?: "email-address";
  secureTextEntry?: boolean;
  placeholder?: string;
  onFocus: () => void;
}) {
  return (
    <View>
      <Text className="mb-2 text-base font-bold text-white">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <View
            className="min-h-[52px] justify-center rounded-[14px] border-2 bg-[#292929] px-4"
            style={{ borderColor: error ? "#ef4444" : APP_COLORS.primary }}
          >
            <TextInput
              accessibilityHint={error}
              accessibilityLabel={label}
              accessibilityState={{ disabled: !editable }}
              autoCapitalize="none"
              autoComplete={autoComplete}
              autoCorrect={false}
              className="text-base leading-5 text-white"
              editable={editable}
              keyboardType={keyboardType}
              onBlur={onBlur}
              onChangeText={onChange}
              onFocus={onFocus}
              placeholder={placeholder}
              placeholderTextColor="#8A8A8F"
              secureTextEntry={secureTextEntry}
              selectionColor={APP_COLORS.primary}
              style={{ paddingVertical: 0, textAlignVertical: "center" }}
              underlineColorAndroid="transparent"
              value={value as string}
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="mb-2 text-base font-bold text-white">{label}</Text>
      <View className="min-h-[52px] justify-center rounded-[14px] border border-[#4a4a4c] bg-[#1c1c1e] px-4 opacity-80">
        <TextInput
          accessibilityLabel={label}
          accessibilityState={{ disabled: true }}
          className="text-base leading-5 text-[#d4d4d4]"
          editable={false}
          selectTextOnFocus={false}
          style={{ paddingVertical: 0, textAlignVertical: "center" }}
          value={value}
        />
      </View>
    </View>
  );
}
