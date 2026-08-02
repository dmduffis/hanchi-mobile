import { StyleSheet, Text, View } from "react-native";

import { colors, radii, typography } from "../theme";

type BadgeProps = {
  label: string;
  variant?: "default" | "gold" | "forest";
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  default: {
    backgroundColor: colors.surface,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  forest: {
    backgroundColor: colors.forest,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 11,
  },
  defaultLabel: {
    color: colors.gray,
  },
  goldLabel: {
    color: colors.goldText,
  },
  forestLabel: {
    color: colors.white,
  },
});
