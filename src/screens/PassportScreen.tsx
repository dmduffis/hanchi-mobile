import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCommunities } from "../api/useCommunities";
import { fetchUserStamps, type ApiStamp } from "../api/stamps";
import { Stamp } from "../components";
import { getCommunityFlag } from "../data/communityFlags";
import { mockDishStamps, mockPassportBadges } from "../data/mockPassport";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";

export function PassportScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { communities, loading: communitiesLoading } = useCommunities();
  const [stamps, setStamps] = useState<ApiStamp[]>([]);
  const [loadingStamps, setLoadingStamps] = useState(true);

  const loadStamps = useCallback(async () => {
    setLoadingStamps(true);
    try {
      const data = await fetchUserStamps();
      // Newest first
      setStamps(
        [...data].sort(
          (a, b) =>
            new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime(),
        ),
      );
    } catch {
      setStamps([]);
    } finally {
      setLoadingStamps(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStamps();
    }, [loadStamps]),
  );

  const communityById = useMemo(() => {
    const map = new Map(communities.map((c) => [c.id, c]));
    return map;
  }, [communities]);

  const collected = useMemo(() => {
    return stamps
      .map((stamp) => {
        const community = communityById.get(stamp.communityId);
        const name =
          stamp.community?.name ?? community?.name ?? "Unknown place";
        const emoji =
          community?.emoji ??
          getCommunityFlag(
            stamp.communityId,
            stamp.community?.heroEmoji ?? "📍",
          );
        return {
          id: stamp.communityId,
          stampId: stamp.id,
          communityName: name,
          emoji,
        };
      })
      .filter((s) => s.id);
  }, [stamps, communityById]);

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
        ) : collected.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No stamps yet</Text>
            <Text style={styles.empty}>
              Visit a community and stamp your passport there. Your collected
              places will show up here.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {collected.length} place
                {collected.length === 1 ? "" : "s"} stamped
              </Text>
              <Text style={styles.hint}>Tap a stamp to revisit</Text>
            </View>

            <Text style={styles.sectionTitle}>Stamped places</Text>
            <View style={styles.stampGrid}>
              {collected.map((stamp) => (
                <Stamp
                  key={stamp.stampId}
                  emoji={stamp.emoji}
                  label={stamp.communityName}
                  earned
                  onPress={() =>
                    navigation.navigate("CommunityProfile", {
                      communityId: stamp.id,
                    })
                  }
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Dish stamps</Text>
            <Text style={styles.comingSoon}>Coming soon</Text>
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
    marginBottom: 4,
  },
  hint: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 14,
    marginTop: 8,
  },
  comingSoon: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.grayLight,
    marginTop: -8,
    marginBottom: 10,
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
  emptyWrap: {
    alignItems: "center",
    marginTop: 40,
    gap: 10,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
    textAlign: "center",
  },
  empty: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 22,
  },
});
