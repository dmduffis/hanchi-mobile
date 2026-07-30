import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchCommunities,
  fetchCommunityDishes,
  type ApiCommunity,
  type ApiDish,
} from "../api/communities";
import { mapApiCommunity } from "../api/mappers";
import { searchAll } from "../api/search";
import { useCommunities } from "../api/useCommunities";
import { ListRow, SearchBar, EthnicityFlags } from "../components";
import { CommunityMap, NYC_REGION } from "../components/CommunityMap";
import { getCommunityFlag } from "../data/communityFlags";
import { IconArrowsMaximize, IconBell } from "../icons";
import { resolveMapRegion } from "../lib/userLocation";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";
import type { Community } from "../types";

const DISH_CARD_WIDTH = 148;
/** Metro-scale radius so "nearby" means the city, not the same block. */
const NEARBY_RADIUS_METERS = 50_000;
const NEARBY_LIMIT = 5;

function formatNearbyDistance(miles: number): string {
  if (miles < 0.1) return "Nearby";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  communityId: string;
  restaurantId?: string;
  kind: "community" | "restaurant" | "dish";
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const { communities, loading, error } = useCommunities();
  const [query, setQuery] = useState("");
  const [dishes, setDishes] = useState<ApiDish[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [peekRegion, setPeekRegion] = useState(NYC_REGION);
  const [nearby, setNearby] = useState<Community[]>([]);
  const [nearbyRaw, setNearbyRaw] = useState<ApiCommunity[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setNearbyLoading(true);
      try {
        const { region } = await resolveMapRegion({ requestPermission: false });
        if (cancelled) return;
        setPeekRegion(region);

        let data = await fetchCommunities({
          near: { lat: region.latitude, lng: region.longitude },
          radiusMeters: NEARBY_RADIUS_METERS,
        });

        // Sparse area or cold start: fall back to NYC metro density.
        if (data.length === 0) {
          data = await fetchCommunities({
            near: {
              lat: NYC_REGION.latitude,
              lng: NYC_REGION.longitude,
            },
            radiusMeters: NEARBY_RADIUS_METERS,
          });
        }

        if (cancelled) return;
        setNearbyRaw(data);
        setNearby(data.slice(0, NEARBY_LIMIT).map(mapApiCommunity));
      } catch {
        if (!cancelled) {
          setNearbyRaw([]);
          setNearby([]);
        }
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSearching = query.trim().length > 0;
  const poiCountById = useMemo(() => {
    const map = new Map<string, number>();
    nearbyRaw.forEach((c) => map.set(c.id, c.poiCount ?? 0));
    return map;
  }, [nearbyRaw]);

  const nearbyIds = useMemo(
    () =>
      nearbyRaw
        .slice(0, 24)
        .map((c) => c.id)
        .join(","),
    [nearbyRaw],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!nearbyIds) {
        setDishes((prev) => (prev.length === 0 ? prev : []));
        return;
      }
      try {
        const ids = nearbyIds.split(",");
        const batches = await Promise.all(
          ids.map((id) => fetchCommunityDishes(id).catch(() => [])),
        );
        if (!cancelled) {
          // Prefer variety across communities.
          const seen = new Set<string>();
          const picked: ApiDish[] = [];
          for (const dish of batches.flat()) {
            const key = dish.communityId ?? dish.poiId;
            const countForKey = picked.filter(
              (d) => (d.communityId ?? d.poiId) === key,
            ).length;
            if (countForKey >= 2) continue;
            if (seen.has(dish.id)) continue;
            seen.add(dish.id);
            picked.push(dish);
            if (picked.length >= 16) break;
          }
          setDishes(picked);
        }
      } catch {
        if (!cancelled) setDishes((prev) => (prev.length === 0 ? prev : []));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nearbyIds]);

  useEffect(() => {
    let cancelled = false;
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await searchAll(q);
        if (cancelled) return;
        const poiCommunity = new Map(
          data.pois.map((p) => [p.id, p.communityId]),
        );
        const fallback = data.communities[0]?.id ?? "";
        setSearchResults([
          ...data.communities.map((c) => ({
            id: `c-${c.id}`,
            title: c.name,
            subtitle: `${c.neighborhood} · ${c.city}`,
            thumbnail: c.heroEmoji ?? "📍",
            communityId: c.id,
            kind: "community" as const,
          })),
          ...data.pois.map((p) => ({
            id: `r-${p.id}`,
            title: p.name,
            subtitle: `${p.category} · Place`,
            thumbnail: "🍽️",
            communityId: p.communityId,
            restaurantId: p.id,
            kind: "restaurant" as const,
          })),
          ...data.dishes.map((d) => ({
            id: `d-${d.id}`,
            title: d.name,
            subtitle: d.poiName ? `${d.poiName} · Dish` : "Dish",
            thumbnail: "🥢",
            communityId: poiCommunity.get(d.poiId) ?? fallback,
            restaurantId: d.poiId,
            kind: "dish" as const,
          })),
        ]);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subGreeting}>Ready to explore nearby?</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate("Notifications")}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <IconBell size={22} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("Profile")}
              style={styles.avatar}
              hitSlop={8}
            >
              <Text style={styles.avatarText}>A</Text>
            </Pressable>
          </View>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search communities, dishes…"
        />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : error ? (
          <Text style={styles.emptySearch}>{error}</Text>
        ) : isSearching ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {searchLoading
                ? "Searching…"
                : searchResults.length === 0
                  ? "No matches"
                  : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`}
            </Text>
            {searchResults.length === 0 && !searchLoading ? (
              <Text style={styles.emptySearch}>
                Try an enclave, restaurant, or dish name.
              </Text>
            ) : (
              searchResults.map((item) => (
                <ListRow
                  key={item.id}
                  thumbnail={item.thumbnail}
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={() => {
                    Keyboard.dismiss();
                    if (
                      (item.kind === "restaurant" || item.kind === "dish") &&
                      item.restaurantId
                    ) {
                      navigation.navigate("RestaurantDetail", {
                        restaurantId: item.restaurantId,
                      });
                      return;
                    }
                    if (!item.communityId) return;
                    navigation.navigate("CommunityProfile", {
                      communityId: item.communityId,
                    });
                  }}
                />
              ))
            )}
          </View>
        ) : (
          <>
            <View style={styles.mapPeek}>
              <CommunityMap
                communities={communities}
                interactive={false}
                initialRegion={peekRegion}
              />
              <Pressable
                style={styles.mapHitArea}
                onPress={() => navigation.navigate("Map")}
              >
                <View style={styles.mapCta}>
                  <IconArrowsMaximize size={14} color={colors.forest} />
                  <Text style={styles.mapCtaText}>Open map</Text>
                </View>
              </Pressable>
            </View>

            {dishes.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dishes to try</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={DISH_CARD_WIDTH + 12}
                  snapToAlignment="start"
                  disableIntervalMomentum
                  contentContainerStyle={styles.dishRow}
                >
                  {dishes.map((dish) => (
                    <Pressable
                      key={dish.id}
                      style={styles.dishCard}
                      onPress={() =>
                        navigation.navigate("RestaurantDetail", {
                          restaurantId: dish.poiId,
                        })
                      }
                    >
                      <View style={styles.dishImage}>
                        {dish.imageUrl ? (
                          <Image
                            source={{ uri: dish.imageUrl }}
                            style={styles.dishPhoto}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.dishEmoji}>🥢</Text>
                        )}
                        {dish.ethnicities?.length ? (
                          <View style={styles.dishFlagBadge}>
                            <EthnicityFlags
                              ethnicities={dish.ethnicities.slice(0, 1)}
                              size={22}
                            />
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.dishName} numberOfLines={2}>
                        {dish.name}
                      </Text>
                      <Text style={styles.dishCommunity} numberOfLines={1}>
                        {dish.poiName ?? "Local spot"}
                      </Text>
                      {dish.priceRange ? (
                        <Text style={styles.dishPrice} numberOfLines={1}>
                          {dish.priceRange}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nearby communities</Text>
              {nearbyLoading ? (
                <ActivityIndicator color={colors.forest} />
              ) : nearby.length === 0 ? (
                <Text style={styles.emptySearch}>
                  No communities with restaurants near you yet. Open the map to
                  explore.
                </Text>
              ) : (
                nearby.map((c) => (
                  <ListRow
                    key={c.id}
                    thumbnail={getCommunityFlag(c.id, c.emoji)}
                    title={c.name}
                    subtitle={`${c.neighborhood} · ${poiCountById.get(c.id) ?? 0} places · ${formatNearbyDistance(c.distanceMiles)}`}
                    onPress={() =>
                      navigation.navigate("CommunityProfile", {
                        communityId: c.id,
                      })
                    }
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  greeting: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.ink,
  },
  subGreeting: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: typography.bodySemibold,
    color: colors.white,
    fontSize: 14,
  },
  mapPeek: {
    height: 200,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mapHitArea: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 12,
  },
  mapCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapCtaText: {
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    color: colors.forest,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 12,
  },
  emptySearch: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
  },
  dishRow: {
    gap: 12,
    paddingRight: 4,
  },
  dishCard: {
    width: DISH_CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  dishImage: {
    width: "100%",
    height: 110,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  dishPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  dishFlagBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
  },
  dishEmoji: {
    fontSize: 40,
  },
  dishName: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.ink,
    minHeight: 36,
  },
  dishCommunity: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  dishPrice: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.forest,
    marginTop: 4,
  },
});
