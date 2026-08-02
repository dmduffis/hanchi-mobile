import { Image, StyleSheet, View } from "react-native";

import { IconToolsKitchen2 } from "../icons";
import { colors } from "../theme";
import { CircularFlag } from "./CircularFlag";

type FavoriteThumbProps = {
  kind: "community" | "restaurant" | "dish";
  /** Restaurant / dish photo. */
  imageUrl?: string | null;
  countryCode?: string | null;
  /** Emoji fallback only when no ISO country code exists. */
  flag?: string;
  size?: number;
};

/**
 * Favorites list leading art:
 * - community → CircularFlag (same circle flags as the map)
 * - restaurant / dish → rounded square food image/icon + CircularFlag badge
 */
export function FavoriteThumb({
  kind,
  imageUrl,
  countryCode,
  flag = "🏳️",
  size = 44,
}: FavoriteThumbProps) {
  if (kind === "community") {
    return <CircularFlag countryCode={countryCode} flag={flag} size={size} />;
  }

  const radius = Math.max(8, Math.round(size * 0.22));
  const flagSize = Math.min(18, Math.round(size * 0.32));

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.foodSquare,
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: size, height: size, borderRadius: radius }}
            resizeMode="cover"
          />
        ) : (
          <IconToolsKitchen2
            size={Math.round(size * 0.45)}
            color={colors.forest}
          />
        )}
      </View>
      <View style={styles.flagBadge}>
        <CircularFlag
          countryCode={countryCode}
          flag={flag}
          size={flagSize}
          elevated
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  foodSquare: {
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  flagBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
  },
});
