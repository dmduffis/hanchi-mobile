import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { FavoriteType } from "../api/favorites";
import { IconImage } from "../icons";
import { colors, typography } from "../theme";
import { CircularFlag } from "./CircularFlag";
import { FavoriteHeart } from "./FavoriteHeart";
import { PriceRatingRow } from "./PriceRatingRow";

/** Shared right-edge inset so flag badge and heart share one vertical axis. */
const EDGE = 8;
/** Slot size for flag + heart so their right edges line up. */
const TRAILING_SLOT = 20;

type MapSheetCardProps = {
  width: number;
  title: string;
  priceLevel?: string | null;
  rating?: number | null;
  imageUrl?: string | null;
  countryCode?: string | null;
  flag?: string;
  onPress?: () => void;
  favoriteType?: FavoriteType;
  favoriteId?: string;
};

/**
 * Compact map carousel card: photo (flag only) + title + rating/price.
 */
export function MapSheetCard({
  width,
  title,
  priceLevel,
  rating,
  imageUrl,
  countryCode,
  flag,
  onPress,
  favoriteType,
  favoriteId,
}: MapSheetCardProps) {
  const showFlag = Boolean(countryCode || flag);
  const showFavorite = Boolean(favoriteType && favoriteId);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imageFallback}>
            <IconImage size={22} color={colors.grayLight} />
          </View>
        )}
        {showFlag ? (
          <View style={styles.flagBadge}>
            <CircularFlag
              countryCode={countryCode}
              flag={flag}
              size={TRAILING_SLOT}
              elevated
            />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.bodyText}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <PriceRatingRow priceLevel={priceLevel} rating={rating} compact />
        </View>
        {showFavorite ? (
          <View
            style={styles.heartWrap}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <FavoriteHeart
              type={favoriteType!}
              targetId={favoriteId!}
              size={16}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D6D3CC",
  },
  pressed: {
    opacity: 0.96,
  },
  imageWrap: {
    width: "100%",
    height: 80,
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8E6E1",
  },
  flagBadge: {
    position: "absolute",
    right: EDGE,
    bottom: EDGE,
    width: TRAILING_SLOT,
    height: TRAILING_SLOT,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: EDGE,
    paddingRight: EDGE,
    paddingTop: 9,
    paddingBottom: 6,
    gap: 6,
  },
  bodyText: {
    flex: 1,
    minWidth: 0,
    gap: 0,
  },
  heartWrap: {
    width: TRAILING_SLOT,
    height: TRAILING_SLOT,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 17,
    marginBottom: 0,
  },
});
