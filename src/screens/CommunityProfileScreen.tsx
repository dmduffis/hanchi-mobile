import { Feather } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchCommunity,
  fetchCommunityDishes,
  type ApiCommunityDetail,
  type ApiDish,
} from "../api/communities";
import { createStamp } from "../api/stamps";
import { mapApiCommunity } from "../api/mappers";
import { Badge, Chip, ListRow, PrimaryButton } from "../components";
import { getInsidersForCommunity } from "../data/mockCommunities";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";
import type { CommunityProfileTab } from "../types";

const TABS: CommunityProfileTab[] = ["About", "Food", "Insiders"];

export function CommunityProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CommunityProfile">>();
  const communityId = route.params.communityId;

  const [tab, setTab] = useState<CommunityProfileTab>(
    route.params.initialTab ?? "Food",
  );
  const [detail, setDetail] = useState<ApiCommunityDetail | null>(null);
  const [dishes, setDishes] = useState<ApiDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stamping, setStamping] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [foodFilter, setFoodFilter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [community, communityDishes] = await Promise.all([
          fetchCommunity(communityId),
          fetchCommunityDishes(communityId),
        ]);
        if (cancelled) return;
        setDetail(community);
        setDishes(communityDishes);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const community = detail ? mapApiCommunity(detail) : null;
  const pois = detail?.pois ?? [];
  const insiders = useMemo(
    () => getInsidersForCommunity(communityId),
    [communityId],
  );

  const dishesByPoi = useMemo(() => {
    const map = new Map<string, ApiDish[]>();
    dishes.forEach((d) => {
      const list = map.get(d.poiId) ?? [];
      list.push(d);
      map.set(d.poiId, list);
    });
    return map;
  }, [dishes]);

  const priceOptions = useMemo(() => {
    const tags = new Set<string>();
    dishes.forEach((d) => {
      if (d.priceRange) tags.add(d.priceRange);
    });
    return Array.from(tags);
  }, [dishes]);

  const visiblePois = useMemo(() => {
    if (!foodFilter) return pois;
    return pois.filter((p) =>
      (dishesByPoi.get(p.id) ?? []).some((d) => d.priceRange === foodFilter),
    );
  }, [pois, dishesByPoi, foodFilter]);

  const onStamp = async () => {
    if (!community || stamping || stamped) return;
    setStamping(true);
    try {
      await createStamp(community.id);
      setStamped(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save stamp");
    } finally {
      setStamping(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={["top"]}>
        <ActivityIndicator color={colors.forest} />
      </SafeAreaView>
    );
  }

  if (error || !community || !detail) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={["top"]}>
        <Text style={styles.body}>{error ?? "Community not found"}</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.savePromptText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {community.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{community.emoji}</Text>
        </View>
        <Text style={styles.name}>{community.name}</Text>
        <Text style={styles.neighborhood}>{community.neighborhood}</Text>
        <View style={styles.tags}>
          {community.tags.map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </View>

        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text
                style={[styles.tabLabel, tab === t && styles.tabLabelActive]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "About" && (
          <View style={styles.tabContent}>
            <Text style={styles.body}>{community.description}</Text>
            {pois.length > 0 && (
              <View style={styles.aboutFood}>
                <Text style={styles.sectionTitle}>
                  {pois.length} places nearby
                </Text>
                {pois.slice(0, 3).map((r) => (
                  <ListRow
                    key={r.id}
                    thumbnail="🍽️"
                    title={r.name}
                    subtitle={`${r.category}${r.address ? ` · ${r.address}` : ""}`}
                    onPress={() =>
                      navigation.navigate("RestaurantDetail", {
                        restaurantId: r.id,
                      })
                    }
                  />
                ))}
              </View>
            )}
            <PrimaryButton
              label={stamped ? "Stamped ✓" : "Stamp passport"}
              onPress={onStamp}
              loading={stamping}
              disabled={stamped}
              style={{ marginTop: 8 }}
            />
            <PrimaryButton
              label="See on map"
              onPress={() => navigation.navigate("MainTabs", { screen: "Map" })}
              style={{ marginTop: 8 }}
            />
          </View>
        )}

        {tab === "Food" && (
          <View style={styles.tabContent}>
            <Text style={styles.foodIntro}>
              {pois.length} places · {dishes.length} dishes to try
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <Chip
                label="All"
                selected={foodFilter === null}
                onPress={() => setFoodFilter(null)}
              />
              {priceOptions.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={foodFilter === tag}
                  onPress={() => setFoodFilter(tag === foodFilter ? null : tag)}
                />
              ))}
            </ScrollView>

            {visiblePois.length === 0 ? (
              <Text style={styles.body}>No places match this filter.</Text>
            ) : (
              visiblePois.map((poi) => {
                const poiDishes = (dishesByPoi.get(poi.id) ?? []).filter(
                  (d) => !foodFilter || d.priceRange === foodFilter,
                );
                const rating =
                  poi.rating != null && Number.isFinite(poi.rating)
                    ? `★ ${poi.rating.toFixed(1)}`
                    : null;
                const meta = [poi.category, poi.priceLevel, rating, poi.address]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <View key={poi.id} style={styles.restaurantBlock}>
                    <Pressable
                      onPress={() =>
                        navigation.navigate("RestaurantDetail", {
                          restaurantId: poi.id,
                        })
                      }
                      style={({ pressed }) => [
                        styles.restaurantHeader,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <View style={styles.restaurantEmojiWrap}>
                        <Text style={styles.restaurantEmoji}>🍽️</Text>
                      </View>
                      <View style={styles.restaurantInfo}>
                        <Text style={styles.restaurantName}>{poi.name}</Text>
                        <Text style={styles.restaurantMeta}>{meta}</Text>
                      </View>
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={colors.grayLight}
                      />
                    </Pressable>
                    {poiDishes.map((dish) => (
                      <ListRow
                        key={dish.id}
                        thumbnail="🥢"
                        title={dish.name}
                        subtitle={dish.description ?? undefined}
                        onPress={() =>
                          navigation.navigate("RestaurantDetail", {
                            restaurantId: poi.id,
                          })
                        }
                        rightElement={
                          dish.priceRange ? (
                            <Badge label={dish.priceRange} />
                          ) : undefined
                        }
                      />
                    ))}
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === "Insiders" && (
          <View style={styles.tabContent}>
            {insiders.length === 0 ? (
              <Text style={styles.body}>
                No insider notes yet for this community.
              </Text>
            ) : (
              insiders.map((insider) => (
                <View key={insider.id} style={styles.insiderCard}>
                  <Text style={styles.insiderQuote}>"{insider.quote}"</Text>
                  <Text style={styles.insiderMeta}>
                    {insider.author} · {insider.role}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  hero: {
    height: 160,
    borderRadius: radii.lg,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 64,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 32,
    color: colors.ink,
  },
  neighborhood: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.gray,
    marginTop: 4,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tabBar: {
    flexDirection: "row",
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.forest,
  },
  tabLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.gray,
  },
  tabLabelActive: {
    color: colors.forest,
    fontFamily: typography.bodySemibold,
  },
  tabContent: {
    paddingTop: 20,
  },
  body: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 24,
  },
  quote: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  quoteText: {
    fontFamily: typography.display,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 26,
  },
  quoteAuthor: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 10,
  },
  savePrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  savePromptText: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.forest,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
  },
  chipRow: {
    gap: 8,
    marginBottom: 12,
  },
  foodIntro: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.gray,
    marginBottom: 12,
  },
  aboutFood: {
    marginTop: 24,
  },
  restaurantBlock: {
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  restaurantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  restaurantEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantEmoji: {
    fontSize: 24,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
  },
  restaurantMeta: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.forest,
    marginTop: 2,
  },
  restaurantBlurb: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
    lineHeight: 18,
  },
  insiderCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insiderQuote: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
  },
  insiderMeta: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.gray,
    marginTop: 10,
  },
});
