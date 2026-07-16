import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type CircularFlagProps = {
  flag: string;
  size?: number;
  selected?: boolean;
  /** Slightly stronger border for map pins sitting on busy basemap */
  elevated?: boolean;
};

export function CircularFlag({
  flag,
  size = 40,
  selected = false,
  elevated = false,
}: CircularFlagProps) {
  const border = selected ? 3 : elevated ? 2 : 1.5;
  const inner = size - border * 2;
  const fontSize = Math.round(size * 0.55);

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
          borderColor: selected ? colors.gold : colors.white,
        },
        elevated && styles.elevated,
        selected && styles.selectedShadow,
      ]}
    >
      <View
        style={[
          styles.clip,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
          },
        ]}
      >
        <Text style={[styles.flag, { fontSize, lineHeight: fontSize + 4 }]}>
          {flag}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  elevated: {
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  selectedShadow: {
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  clip: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  flag: {
    textAlign: "center",
  },
});
