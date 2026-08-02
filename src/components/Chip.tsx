import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radii, typography } from "../theme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: "default" | "overlay";
  size?: "md" | "sm";
};

export function Chip({
  label,
  selected = false,
  onPress,
  tone = "default",
  size = "md",
}: ChipProps) {
  const compact = size === "sm";
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        compact && styles.chipSm,
        tone === "overlay" && styles.overlay,
        selected && styles.selected,
      ]}
      disabled={!onPress}
    >
      <Text
        style={[
          styles.label,
          compact && styles.labelSm,
          selected && styles.labelSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 30,
    justifyContent: "center",
  },
  overlay: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  selected: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  labelSm: {
    fontSize: 12,
    lineHeight: 15,
  },
  labelSelected: {
    color: colors.white,
  },
});
