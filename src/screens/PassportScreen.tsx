import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCommunities } from "../api/useCommunities";
import { fetchUserStamps, type ApiStamp } from "../api/stamps";
import { SkeletonPassport, Stamp } from "../components";
import { getCommunityCountryCode } from "../data/communityFlags";
import { mockPassportBadges } from "../data/mockPassport";
import type { RootStackParamList } from "../navigation/types";
import { colors, typography } from "../theme";

function formatStampMonth(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

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
        const neighborhood =
          stamp.community?.neighborhood ?? community?.neighborhood ?? "";
        const city = stamp.community?.city ?? "";
        const subtitle = [neighborhood, city].filter(Boolean).join(", ");
        return {
          id: stamp.communityId,
          stampId: stamp.id,
          communityName: name,
          subtitle: subtitle || name,
          meta: formatStampMonth(stamp.earnedAt),
          countryCode: getCommunityCountryCode(stamp.communityId),
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
        <View style={styles.header}>
          <Text style={styles.title}>Passport</Text>
          <Text style={styles.subtitle}>
            A record of flavors, streets, and the places that stayed with you
          </Text>
        </View>
        {loading ? (
          <SkeletonPassport />
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
            <View style={[styles.sectionHeader, styles.placesHeader]}>
              <Text style={styles.sectionTitle}>Where I&apos;ve been</Text>
              <View style={styles.countCircle}>
                <Text style={styles.countText}>{collected.length}</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stampRow}
              style={styles.stampScroll}
              decelerationRate="fast"
            >
              {collected.map((stamp) => (
                <Stamp
                  key={stamp.stampId}
                  communityId={stamp.id}
                  name={stamp.communityName}
                  subtitle={stamp.subtitle}
                  meta={stamp.meta}
                  countryCode={stamp.countryCode}
                  earned
                  onPress={() =>
                    navigation.navigate("CommunityProfile", {
                      communityId: stamp.id,
                    })
                  }
                />
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Badges</Text>
              <View style={styles.countCircle}>
                <Text style={styles.countText}>
                  {mockPassportBadges.filter((b) => b.earned).length}
                </Text>
              </View>
            </View>
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
                  <Text
                    style={[
                      styles.badgeIconText,
                      badge.earned && styles.badgeIconTextEarned,
                    ]}
                  >
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
  },
  header: {
    marginTop: 8,
    marginBottom: 28,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    marginTop: 6,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    marginTop: 8,
  },
  placesHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
  },
  countCircle: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    color: colors.white,
  },
  stampScroll: {
    overflow: "visible",
  },
  stampRow: {
    gap: 10,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 12,
    marginBottom: 16,
    overflow: "visible",
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
    backgroundColor: colors.forest,
  },
  badgeIconText: {
    fontSize: 16,
    color: colors.grayLight,
  },
  badgeIconTextEarned: {
    color: colors.white,
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
