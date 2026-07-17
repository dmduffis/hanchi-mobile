import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCommunities } from "../api/useCommunities";
import { fetchUserStamps } from "../api/stamps";
import { Stamp } from "../components";
import {
  mockDishStamps,
  mockPassportBadges,
} from "../data/mockPassport";
import { colors, radii, typography } from "../theme";

export function PassportScreen() {
  const { communities, loading: communitiesLoading } = useCommunities();
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loadingStamps, setLoadingStamps] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingStamps(true);
      try {
        const stamps = await fetchUserStamps();
        if (!cancelled) {
          setEarnedIds(new Set(stamps.map((s) => s.communityId)));
        }
      } catch {
        if (!cancelled) setEarnedIds(new Set());
      } finally {
        if (!cancelled) setLoadingStamps(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const passportStamps = useMemo(
    () =>
      communities.map((c) => ({
        id: c.id,
        communityName: c.name,
        emoji: c.emoji,
        earned: earnedIds.has(c.id),
      })),
    [communities, earnedIds],
  );

  const earnedCount = passportStamps.filter((s) => s.earned).length;
  const total = Math.max(passportStamps.length, 1);
  const loading = communitiesLoading || loadingStamps;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Passport</Text>
        {loading ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: 24 }} />
        ) : (
          <>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {earnedCount} of {passportStamps.length} stamped
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(earnedCount / total) * 100}%` },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Enclave stamps</Text>
            <View style={styles.stampGrid}>
              {passportStamps.map((stamp) => (
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
                  style={[
                    styles.badgeIcon,
                    badge.earned && styles.badgeIconEarned,
                  ]}
                >
                  <Text style={styles.badgeIconText}>
                    {badge.earned ? "★" : "○"}
                  </Text>
                </View>
                <View style={styles.badgeContent}>
                  <Text
                    style={[styles.badgeTitle, !badge.earned && styles.muted]}
                  >
                    {badge.title}
                  </Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                </View>
                <Text style={styles.badgeStatus}>
                  {badge.earned ? "Earned" : "Locked"}
                </Text>
              </View>
            ))}
          </>
        )}
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
