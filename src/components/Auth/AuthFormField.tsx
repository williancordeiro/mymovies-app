import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { APP_COLORS } from "../../constants/colors";

type Props<T extends FieldValues> = {
  control: Control<T>;
  error?: string;
  label: string;
  name: Path<T>;
  placeholder: string;
  icon: "person" | "at" | "lock-closed";
  editable: boolean;
  onFocus: () => void;
} & Pick<
  TextInputProps,
  | "autoCapitalize"
  | "autoComplete"
  | "keyboardType"
  | "onSubmitEditing"
  | "returnKeyType"
  | "secureTextEntry"
>;

export default function AuthFormField<T extends FieldValues>({
  control,
  error,
  label,
  name,
  placeholder,
  icon,
  editable,
  onFocus,
  ...inputProps
}: Props<T>) {
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
            <Ionicons
              accessible={false}
              color={APP_COLORS.primary}
              name={icon}
              size={23}
            />
            <TextInput
              {...inputProps}
              accessibilityHint={error}
              accessibilityLabel={label}
              accessibilityState={{ disabled: !editable }}
              autoCorrect={false}
              className="ml-4 flex-1 text-base text-white"
              editable={editable}
              onBlur={onBlur}
              onChangeText={onChange}
              onFocus={onFocus}
              placeholder={placeholder}
              placeholderTextColor="#8A8A8F"
              selectionColor={APP_COLORS.primary}
              style={{
                height: 54,
                fontSize: 16,
                lineHeight: 20,
                paddingVertical: 0,
                textAlignVertical: "center",
                includeFontPadding: false,
              }}
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
