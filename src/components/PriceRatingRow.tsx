import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "../theme";
import { Badge } from "./Badge";

const MAX_STARS = 5;
const STAR_SIZE = 14;

type PriceRatingRowProps = {
  priceLevel?: string | null;
  rating?: number | null;
};

/** Exact 0–1 fill for star at index (0-based), from raw rating — no rounding. */
function starPortion(rating: number, index: number): number {
  return Math.min(1, Math.max(0, rating - index));
}

function FractionalStar({ portion }: { portion: number }) {
  const fillWidth = STAR_SIZE * portion;
  return (
    <View style={styles.starSlot}>
      <Ionicons
        name="star"
        size={STAR_SIZE}
        color={colors.border}
        style={styles.starBase}
      />
      {portion > 0 ? (
        <View style={[styles.starClip, { width: fillWidth }]}>
          <Ionicons name="star" size={STAR_SIZE} color={colors.gold} />
        </View>
      ) : null}
    </View>
  );
}

export function PriceRatingRow({ priceLevel, rating }: PriceRatingRowProps) {
  const hasRating = rating != null && Number.isFinite(rating);
  const clamped = hasRating ? Math.min(MAX_STARS, Math.max(0, rating)) : 0;
  const ratingLabel = hasRating ? rating.toFixed(1) : null;
  if (!priceLevel && !hasRating) return null;

  return (
    <View style={styles.row}>
      {hasRating ? (
        <View
          style={styles.rating}
          accessibilityLabel={`${ratingLabel} out of ${MAX_STARS} stars`}
        >
          <View style={styles.stars} accessible={false}>
            {Array.from({ length: MAX_STARS }, (_, i) => (
              <FractionalStar key={i} portion={starPortion(clamped, i)} />
            ))}
          </View>
          <Text style={styles.ratingNumber}>{ratingLabel}</Text>
        </View>
      ) : null}
      {priceLevel ? <Badge label={priceLevel} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  starSlot: {
    width: STAR_SIZE,
    height: STAR_SIZE,
  },
  starBase: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  starClip: {
    height: STAR_SIZE,
    overflow: "hidden",
  },
  ratingNumber: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.gray,
  },
});
