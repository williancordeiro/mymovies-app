import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Text, TextInput, View } from "react-native";

import { APP_COLORS } from "../../constants/colors";

export type ProfileIdentityFieldsValues = {
  username: string;
  handle: string;
};

type ProfileIdentityFieldsProps = {
  control: Control<ProfileIdentityFieldsValues>;
  errors: FieldErrors<ProfileIdentityFieldsValues>;
  disabled: boolean;
  onFieldFocus: (field: keyof ProfileIdentityFieldsValues) => void;
};

type FieldProps = {
  control: Control<ProfileIdentityFieldsValues>;
  error?: string;
  label: string;
  name: keyof ProfileIdentityFieldsValues;
  autoCapitalize: "none" | "words";
  disabled: boolean;
  onFocus: () => void;
  prefix?: string;
};

function ProfileIdentityField({
  control,
  error,
  label,
  name,
  autoCapitalize,
  disabled,
  onFocus,
  prefix,
}: FieldProps) {
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
            {prefix ? (
              <View className="mr-1 self-stretch justify-center">
                <Text className="text-base leading-5 text-[#a3a3a3]">
                  {prefix}
                </Text>
              </View>
            ) : null}
            <TextInput
              accessibilityHint={error}
              accessibilityLabel={label}
              accessibilityState={{ disabled }}
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
              className="flex-1 self-stretch text-base leading-5 text-white"
              editable={!disabled}
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

export default function ProfileIdentityFields({
  control,
  errors,
  disabled,
  onFieldFocus,
}: ProfileIdentityFieldsProps) {
  return (
    <View className="mt-8 gap-5">
      <ProfileIdentityField
        control={control}
        disabled={disabled}
        error={errors.username?.message}
        label="Nome de usuário"
        name="username"
        autoCapitalize="words"
        onFocus={() => onFieldFocus("username")}
      />
      <ProfileIdentityField
        control={control}
        disabled={disabled}
        error={errors.handle?.message}
        label="Identificador"
        name="handle"
        autoCapitalize="none"
        prefix="@"
        onFocus={() => onFieldFocus("handle")}
      />
    </View>
  );
}
