import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radii, typography } from "../theme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: "default" | "overlay";
};

export function Chip({
  label,
  selected = false,
  onPress,
  tone = "default",
}: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        tone === "overlay" && styles.overlay,
        selected && styles.selected,
      ]}
      disabled={!onPress}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
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
  overlay: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
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
  labelSelected: {
    color: colors.white,
  },
});
