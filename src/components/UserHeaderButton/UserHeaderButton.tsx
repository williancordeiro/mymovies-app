import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";

type UserHeaderButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};

export default function UserHeaderButton({
  disabled = false,
  onPress,
}: UserHeaderButtonProps) {
  const isDisabled = disabled || !onPress;

  return (
    <Pressable
      accessibilityLabel="Abrir conta"
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      className="mr-3 h-11 w-11 items-center justify-center rounded-full"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: isDisabled ? 0.45 : pressed ? 0.65 : 1,
      })}
    >
      <Ionicons
        name="person-circle-outline"
        size={40}
        color="#FFFFFF"
        accessible={false}
      />
    </Pressable>
  );
}
