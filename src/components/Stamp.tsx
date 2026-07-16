import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "../theme";

type StampProps = {
  emoji: string;
  label: string;
  earned?: boolean;
  size?: "md" | "sm";
};

export function Stamp({
  emoji,
  label,
  earned = false,
  size = "md",
}: StampProps) {
  const isSm = size === "sm";
  return (
    <View style={styles.wrap}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: 72,
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
