import CircleCountryFlag, {
  COUNTRY_CODES,
  type CountryCode,
} from "react-native-circle-flags/country";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

const VALID_CODES = new Set<string>(COUNTRY_CODES);

type CircularFlagProps = {
  /** ISO / circle-flags country code (e.g. "kr", "cn"). */
  countryCode?: CountryCode | string | null;
  /** Emoji fallback when no country code is available. */
  flag?: string;
  size?: number;
  selected?: boolean;
  /** Slightly stronger border for map pins sitting on busy basemap */
  elevated?: boolean;
  /**
   * Flag disk only (no white ring / shadow).
   * Used inside MapFlagPin so the pin owns chrome.
   */
  bare?: boolean;
};

export function CircularFlag({
  countryCode,
  flag = "🏳️",
  size = 40,
  selected = false,
  elevated = false,
  bare = false,
}: CircularFlagProps) {
  const code = countryCode?.toLowerCase();
  const resolvedCode =
    code && VALID_CODES.has(code) ? (code as CountryCode) : null;
  const fontSize = Math.round(size * 0.55);

  const emoji = flag?.trim() ?? "";
  const showEmoji = !resolvedCode && emoji.length > 0;

  if (bare) {
    return (
      <View
        style={[
          styles.clip,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor:
              resolvedCode || showEmoji ? undefined : colors.forest,
          },
        ]}
      >
        {resolvedCode ? (
          <CircleCountryFlag code={resolvedCode} size={size} />
        ) : showEmoji ? (
          <Text style={[styles.flag, { fontSize, lineHeight: fontSize + 4 }]}>
            {emoji}
          </Text>
        ) : null}
      </View>
    );
  }

  const border = selected ? 3 : elevated ? 2 : 1.5;
  const inner = Math.max(size - border * 2, 8);
  const innerFont = Math.round(inner * 0.55);

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
            backgroundColor:
              resolvedCode || showEmoji ? undefined : colors.forest,
          },
        ]}
      >
        {resolvedCode ? (
          <CircleCountryFlag code={resolvedCode} size={inner} />
        ) : showEmoji ? (
          <Text
            style={[
              styles.flag,
              { fontSize: innerFont, lineHeight: innerFont + 4 },
            ]}
          >
            {emoji}
          </Text>
        ) : null}
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
