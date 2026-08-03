import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  IconAward,
  IconBolt,
  IconBook2,
  IconBuilding,
  IconCheck,
  IconCompass,
  IconFire,
  IconMapPin,
  IconMoon,
  IconStar,
  IconToolsKitchen2,
  IconUsers,
  type Icon,
} from "../icons";
import type { AchievementBadge } from "../types";
import { colors, typography } from "../theme";

type AchievementBadgeTileProps = {
  badge: AchievementBadge;
  /** Slightly smaller for horizontal previews. */
  compact?: boolean;
  onPress?: () => void;
};

const BADGE_ICONS: Record<AchievementBadge["icon"], Icon> = {
  award: IconAward,
  star: IconStar,
  mapPin: IconMapPin,
  fire: IconFire,
  building: IconBuilding,
  book: IconBook2,
  users: IconUsers,
  moon: IconMoon,
  compass: IconCompass,
  bolt: IconBolt,
  kitchen: IconToolsKitchen2,
  check: IconCheck,
};

function progressLabel(badge: AchievementBadge): string {
  if (badge.earned || badge.progressCurrent >= badge.progressTarget) {
    return "Complete";
  }
  return `${badge.progressCurrent} of ${badge.progressTarget}`;
}

export function AchievementBadgeTile({
  badge,
  compact = false,
  onPress,
}: AchievementBadgeTileProps) {
  const muted = !badge.earned;
  const size = compact ? 64 : 76;
  const Glyph = BADGE_ICONS[badge.icon] ?? IconAward;
  const iconSize = compact ? 26 : 30;
  const iconColor = muted ? colors.grayLight : colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.wrap,
        compact && styles.wrapCompact,
        pressed && onPress && styles.pressed,
      ]}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${badge.title}, ${progressLabel(badge)}${
        badge.earned ? ", earned" : ", in progress"
      }`}
    >
      <View style={styles.iconWrap}>
        {badge.isNew && badge.earned ? (
          <View style={styles.newTag}>
            <Text style={styles.newTagText}>NEW</Text>
          </View>
        ) : null}
        <View
          style={[
            styles.iconCircle,
            { width: size, height: size, borderRadius: size / 2 },
            muted ? styles.iconCircleMuted : styles.iconCircleEarned,
          ]}
        >
          <Glyph size={iconSize} color={iconColor} />
        </View>
      </View>
      <Text
        style={[styles.title, muted && styles.titleMuted]}
        numberOfLines={2}
      >
        {badge.title}
      </Text>
      <Text style={[styles.progress, muted && styles.progressMuted]}>
        {progressLabel(badge)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 100,
    alignItems: "center",
    gap: 8,
  },
  wrapCompact: {
    width: 92,
  },
  pressed: {
    opacity: 0.75,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
  },
  newTag: {
    position: "absolute",
    top: 0,
    right: -4,
    zIndex: 2,
    backgroundColor: colors.ink,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newTagText: {
    fontFamily: typography.bodySemibold,
    fontSize: 8,
    color: colors.white,
    letterSpacing: 0.5,
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleEarned: {
    backgroundColor: colors.forest,
  },
  iconCircleMuted: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    color: colors.ink,
    textAlign: "center",
    lineHeight: 15,
  },
  titleMuted: {
    color: colors.gray,
  },
  progress: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.gray,
    textAlign: "center",
  },
  progressMuted: {
    color: colors.grayLight,
  },
});
