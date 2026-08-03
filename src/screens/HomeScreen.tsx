import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import {
  CircularFlag,
  EthnicityFlags,
  ListRow,
  SearchBar,
  SearchResultsPanel,
  SkeletonHome,
  SkeletonListRows,
} from "../components";
import { CommunityMap, NYC_REGION } from "../components/CommunityMap";
import {
  getCommunityCountryCode,
  getCommunityFlag,
} from "../data/communityFlags";
import { IconArrowsMaximize, IconBell } from "../icons";
import {
  mapSearchResults,
  type SearchKindFilter,
  type SearchResult,
} from "../lib/searchResults";
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
  const [searchKind, setSearchKind] = useState<SearchKindFilter>("all");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dishes, setDishes] = useState<ApiDish[]>([]);
  const [peekRegion, setPeekRegion] = useState(NYC_REGION);
  const [nearby, setNearby] = useState<Community[]>([]);
  const [nearbyRaw, setNearbyRaw] = useState<ApiCommunity[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setNearbyLoading(true);
        try {
          const { region } = await resolveMapRegion({
            requestPermission: false,
          });
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
    }, []),
  );

  const isSearching = query.trim().length > 0;

  useEffect(() => {
    if (!query.trim()) setSearchKind("all");
  }, [query]);

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
        if (!cancelled) setSearchResults(mapSearchResults(data));
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

  const handleSearchResultPress = (item: SearchResult) => {
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
    // Keep Home query; open Map on that enclave with the same search ready.
    navigation.navigate("Map", {
      focusCommunityId: item.communityId,
      query: query.trim() || item.title,
      showResults: false,
    });
  };

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
          <SkeletonHome />
        ) : error ? (
          <Text style={styles.emptySearch}>{error}</Text>
        ) : isSearching ? (
          <View style={styles.searchSection}>
            <SearchResultsPanel
              results={searchResults}
              loading={searchLoading}
              searchKind={searchKind}
              onChangeKind={setSearchKind}
              onPressResult={handleSearchResultPress}
            />
          </View>
        ) : (
          <>
            <View style={styles.mapPeek}>
              <CommunityMap
                communities={
                  nearby.length > 0
                    ? nearby
                    : communities.filter(
                        (c) =>
                          Number.isFinite(c.latitude) &&
                          Number.isFinite(c.longitude) &&
                          Math.abs(c.latitude - peekRegion.latitude) < 0.6 &&
                          Math.abs(c.longitude - peekRegion.longitude) < 0.6,
                      )
                }
                interactive={false}
                initialRegion={peekRegion}
              />
              <Pressable
                style={styles.mapHitArea}
                onPress={() =>
                  navigation.navigate("Map", {
                    openAt: {
                      latitude: peekRegion.latitude,
                      longitude: peekRegion.longitude,
                      latitudeDelta: peekRegion.latitudeDelta,
                      longitudeDelta: peekRegion.longitudeDelta,
                      token: Date.now(),
                    },
                  })
                }
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
                          />
                        ) : (
                          <Text style={styles.dishEmoji}>🥢</Text>
                        )}
                        {dish.ethnicities?.length ? (
                          <View style={styles.dishFlagBadge}>
                            <EthnicityFlags
                              ethnicities={dish.ethnicities}
                              size={22}
                            />
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.dishName} numberOfLines={2}>
                        {dish.name}
                      </Text>
                      <Text style={styles.dishCommunity} numberOfLines={1}>
                        {dish.poiName ?? "Nearby"}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nearby communities</Text>
              {nearbyLoading ? (
                <SkeletonListRows count={4} />
              ) : nearby.length === 0 ? (
                <Text style={styles.emptySearch}>
                  No communities near you yet.
                </Text>
              ) : (
                nearby.map((c) => (
                  <ListRow
                    key={c.id}
                    thumbnail={
                      <CircularFlag
                        countryCode={getCommunityCountryCode(c.id)}
                        emoji={getCommunityFlag(c.id, c.emoji)}
                        size={40}
                      />
                    }
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
    lineHeight: 34,
    color: colors.ink,
  },
  subGreeting: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 18,
    color: colors.gray,
    marginTop: 0,
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
  searchSection: {
    marginTop: 16,
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
    ...StyleSheet.absoluteFill,
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
    lineHeight: 18,
    color: colors.ink,
  },
  dishCommunity: {
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray,
    marginTop: 2,
  },
});
