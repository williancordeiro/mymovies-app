import { Text, View } from "react-native";

type ProfileEditFeedbackProps = {
  error: string | null;
  notice: string | null;
};

export default function ProfileEditFeedback({
  error,
  notice,
}: ProfileEditFeedbackProps) {
  if (!error && !notice) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      className={`mt-5 rounded-xl border px-4 py-3 ${error ? "border-red-500/60 bg-red-950/50" : "border-primary/60 bg-[#1c1c1e]"}`}
    >
      <Text
        className={error ? "text-sm text-red-200" : "text-sm text-[#d4d4d4]"}
      >
        {error ?? notice}
      </Text>
    </View>
  );
}
