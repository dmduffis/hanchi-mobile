import { StyleSheet, Text, Pressable, View } from "react-native";

import { colors, typography } from "../theme";

type StampProps = {
  emoji: string;
  label: string;
  earned?: boolean;
  size?: "md" | "sm";
  onPress?: () => void;
  disabled?: boolean;
};

export function Stamp({
  emoji,
  label,
  earned = false,
  size = "md",
  onPress,
  disabled = false,
}: StampProps) {
  const isSm = size === "sm";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.wrap,
        pressed && onPress && !disabled && styles.pressed,
      ]}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={
        earned ? `${label}, stamped` : `Stamp ${label} in your passport`
      }
    >
      <View
        style={[
          styles.circle,
          isSm && styles.circleSm,
          earned ? styles.earned : styles.empty,
        ]}
      >
        <Text
          style={[
            styles.emoji,
            isSm && styles.emojiSm,
            !earned && styles.emojiEmpty,
          ]}
        >
          {earned ? emoji : "·"}
        </Text>
      </View>
      <Text
        style={[styles.label, !earned && styles.labelEmpty]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: 72,
  },
  pressed: {
    opacity: 0.75,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  circleSm: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  earned: {
    backgroundColor: colors.forest,
    borderColor: colors.gold,
  },
  empty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emoji: {
    fontSize: 26,
  },
  emojiSm: {
    fontSize: 20,
  },
  emojiEmpty: {
    color: colors.grayLight,
    fontSize: 22,
  },
  label: {
    marginTop: 6,
    fontFamily: typography.bodyMedium,
    fontSize: 11,
    color: colors.ink,
    textAlign: "center",
  },
  labelEmpty: {
    color: colors.grayLight,
  },
});
