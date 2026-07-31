import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { FavoriteType } from "../api/favorites";
import { IconImage } from "../icons";
import { colors, typography } from "../theme";
import { CircularFlag } from "./CircularFlag";
import { FavoriteHeart } from "./FavoriteHeart";

/** Shared right-edge inset so flag badge and heart share one vertical axis. */
const EDGE = 10;
/** Slot size for flag + heart so their right edges line up. */
const TRAILING_SLOT = 22;

type MapSheetCardProps = {
  width: number;
  title: string;
  meta: string;
  detail?: string;
  imageUrl?: string | null;
  countryCode?: string | null;
  flag?: string;
  onPress?: () => void;
  favoriteType?: FavoriteType;
  favoriteId?: string;
};

/**
 * Compact map carousel card: photo (flag only) + title/meta with heart on the right.
 */
export function MapSheetCard({
  width,
  title,
  meta,
  detail,
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
            <IconImage size={28} color={colors.grayLight} />
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
          {meta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
          {detail ? (
            <Text style={styles.detail} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
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
              size={18}
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
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D6D3CC",
  },
  pressed: {
    opacity: 0.96,
  },
  imageWrap: {
    width: "100%",
    height: 100,
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
    paddingTop: 7,
    paddingBottom: 8,
    gap: 8,
  },
  bodyText: {
    flex: 1,
    gap: 1,
    minWidth: 0,
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
    fontSize: 13,
    color: colors.ink,
  },
  meta: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.gray,
  },
  detail: {
    fontFamily: typography.bodyMedium,
    fontSize: 11,
    color: colors.ink,
    marginTop: 1,
  },
});
