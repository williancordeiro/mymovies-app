import { type ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { APP_COLORS } from "../../constants/colors";

export function Section({
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
        accessibilityHint={
          expanded ? "Toque para recolher" : "Toque para abrir"
        }
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

export function Feedback({
  error,
  notice,
}: {
  error?: string;
  notice?: string;
}) {
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

export function ActionButton({
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

export function SmallButton({
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

export function FormField<T extends FieldValues>({
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
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-2 text-sm text-red-300"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
