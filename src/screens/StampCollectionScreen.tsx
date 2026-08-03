import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchUserStamps, type ApiStamp } from "../api/stamps";
import { useCommunities } from "../api/useCommunities";
import { Skeleton, Stamp } from "../components";
import { IconArrowLeft } from "../icons";
import {
  sortStampsNewestFirst,
  stampToCard,
  type StampCardModel,
} from "../lib/stampDisplay";
import type { RootStackParamList } from "../navigation/types";
import { colors, typography } from "../theme";

export function StampCollectionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const { communities, loading: communitiesLoading } = useCommunities();
  const [stamps, setStamps] = useState<ApiStamp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserStamps();
      setStamps(sortStampsNewestFirst(data));
    } catch {
      setStamps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const communityById = useMemo(() => {
    return new Map(communities.map((c) => [c.id, c]));
  }, [communities]);

  const cards: StampCardModel[] = useMemo(
    () => stamps.map((s) => stampToCard(s, communityById)),
    [stamps, communityById],
  );

  const pad = 20;
  const gap = 10;
  const cols = width >= 400 ? 2 : 2;
  const cellW = (width - pad * 2 - gap * (cols - 1)) / cols;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <IconArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Stamps</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: pad }]}
        showsVerticalScrollIndicator={false}
      >
        {loading || communitiesLoading ? (
          <View style={styles.grid}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} width={cellW} height={120} radius={12} />
            ))}
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No stamps yet</Text>
            <Text style={styles.emptyBody}>
              Visit a community and stamp the place. Your collection will show
              up here.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.count}>{cards.length} collected</Text>
            <View style={[styles.grid, { gap }]}>
              {cards.map((stamp) => (
                <View key={stamp.stampId} style={{ width: cellW }}>
                  <Stamp
                    communityId={stamp.id}
                    name={stamp.communityName}
                    subtitle={stamp.subtitle}
                    meta={stamp.meta}
                    countryCode={stamp.countryCode}
                    earned
                    size="sm"
                    onPress={() =>
                      navigation.navigate("CommunityProfile", {
                        communityId: stamp.id,
                      })
                    }
                  />
                </View>
              ))}
            </View>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.bodySemibold,
    fontSize: 17,
    color: colors.ink,
  },
  scroll: {
    paddingBottom: 40,
  },
  count: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
  },
  emptyBody: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 22,
  },
});
