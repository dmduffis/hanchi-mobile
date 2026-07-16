import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Stamp } from "../components";
import {
  mockDishStamps,
  mockPassportBadges,
  mockPassportStamps,
  TOTAL_COMMUNITY_STAMPS,
} from "../data/mockPassport";
import { colors, radii, typography } from "../theme";

export function PassportScreen() {
  const earnedCount = mockPassportStamps.filter((s) => s.earned).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Passport</Text>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {earnedCount} of {TOTAL_COMMUNITY_STAMPS} stamped
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(earnedCount / TOTAL_COMMUNITY_STAMPS) * 100}%` },
              ]}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Enclave stamps</Text>
        <View style={styles.stampGrid}>
          {mockPassportStamps.map((stamp) => (
            <Stamp
              key={stamp.id}
              emoji={stamp.emoji}
              label={stamp.communityName}
              earned={stamp.earned}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Dish stamps</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dishRow}
        >
          {mockDishStamps.map((stamp) => (
            <View
              key={stamp.id}
              style={[
                styles.dishPill,
                stamp.earned ? styles.dishPillEarned : styles.dishPillEmpty,
              ]}
            >
              <Text style={styles.dishPillEmoji}>
                {stamp.earned ? stamp.emoji : "·"}
              </Text>
              <Text
                style={[
                  styles.dishPillLabel,
                  !stamp.earned && styles.dishPillLabelEmpty,
                ]}
              >
                {stamp.dishName}
              </Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Badges</Text>
        {mockPassportBadges.map((badge) => (
          <View
            key={badge.id}
            style={[styles.badgeRow, !badge.earned && styles.badgeRowEmpty]}
          >
            <View
              style={[styles.badgeIcon, badge.earned && styles.badgeIconEarned]}
            >
              <Text style={styles.badgeIconText}>
                {badge.earned ? "★" : "○"}
              </Text>
            </View>
            <View style={styles.badgeContent}>
              <Text style={[styles.badgeTitle, !badge.earned && styles.muted]}>
                {badge.title}
              </Text>
              <Text style={styles.badgeDesc}>{badge.description}</Text>
            </View>
            <Text style={styles.badgeStatus}>
              {badge.earned ? "Earned" : "Locked"}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.ink,
    marginTop: 8,
    marginBottom: 16,
  },
  progressHeader: {
    marginBottom: 28,
  },
  progressText: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.forest,
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.gold,
    borderRadius: radii.full,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 14,
    marginTop: 8,
  },
  stampGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 28,
    justifyContent: "flex-start",
  },
  dishRow: {
    gap: 10,
    marginBottom: 28,
    paddingRight: 8,
  },
  dishPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.full,
    gap: 8,
    borderWidth: 1,
  },
  dishPillEarned: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  dishPillEmpty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  dishPillEmoji: {
    fontSize: 16,
  },
  dishPillLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.white,
  },
  dishPillLabelEmpty: {
    color: colors.grayLight,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  badgeRowEmpty: {
    opacity: 0.65,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIconEarned: {
    backgroundColor: colors.gold,
  },
  badgeIconText: {
    fontSize: 16,
    color: colors.goldText,
  },
  badgeContent: {
    flex: 1,
  },
  badgeTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
  },
  badgeDesc: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  badgeStatus: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.gray,
  },
  muted: {
    color: colors.gray,
  },
});
