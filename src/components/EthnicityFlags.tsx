import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { ethnicityFlagsFor, type EthnicityFlag } from "../data/ethnicityFlags";
import { CircularFlag } from "./CircularFlag";

type EthnicityFlagsProps = {
  ethnicities?: string[] | null;
  /** Precomputed flags — skips ethnicityFlagsFor when provided. */
  flags?: EthnicityFlag[];
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Renders up to 2 circular country flags from restaurant ethnicities. */
export function EthnicityFlags({
  ethnicities,
  flags: flagsProp,
  size = 22,
  style,
}: EthnicityFlagsProps) {
  const flags = flagsProp ?? ethnicityFlagsFor(ethnicities);
  if (flags.length === 0) return null;

  return (
    <View style={[styles.row, style]}>
      {flags.map((f) => (
        <CircularFlag
          key={f.ethnicity}
          countryCode={f.countryCode}
          flag={f.emoji}
          size={size}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
