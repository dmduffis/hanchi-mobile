import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { colors, radii, typography } from "../theme";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  variant?: "primary" | "ghost";
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
  variant = "primary",
}: PrimaryButtonProps) {
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isGhost && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.forest : colors.white} />
      ) : (
        <Text style={[styles.label, isGhost && styles.ghostLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.forest,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.white,
  },
  ghostLabel: {
    color: colors.forest,
    fontFamily: typography.bodyMedium,
  },
});
