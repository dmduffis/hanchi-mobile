import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { pointToLatLng } from "../api/geo";
import { mapApiCommunity } from "../api/mappers";
import {
  Badge,
  Chip,
  EnclaveDetailMap,
  EthnicityFlags,
  FavoriteHeart,
  FavoriteThumb,
  ListRow,
  PassportStampButton,
} from "../components";
import { getInsidersForCommunity } from "../data/mockCommunities";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import { IconArrowLeft, IconArrowsMaximize, IconChevronRight } from "../icons";
import { displayDescription, displayNeighborhood } from "../lib/communityCopy";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";
import type { CommunityProfileTab } from "../types";

const TABS: CommunityProfileTab[] = ["About", "Food", "Insiders"];

function ethnicityLabel(id: string): string {
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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
  const [ethnicityFilter, setEthnicityFilter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setEthnicityFilter(null);
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

  const ethnicityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    pois.forEach((p) => {
      (p.ethnicities ?? []).forEach((id) => {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([id]) => id);
  }, [pois]);

  const visiblePois = useMemo(() => {
    if (!ethnicityFilter) return pois;
    return pois.filter((p) => (p.ethnicities ?? []).includes(ethnicityFilter));
  }, [pois, ethnicityFilter]);

  const mapCentroid = useMemo(() => {
    if (!community) return null;
    if (
      !Number.isFinite(community.latitude) ||
      !Number.isFinite(community.longitude)
    ) {
      return null;
    }
    return {
      latitude: community.latitude,
      longitude: community.longitude,
    };
  }, [community?.latitude, community?.longitude]);

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
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <IconArrowLeft size={24} color={colors.ink} />
        </Pressable>
        <View style={styles.navActions}>
          <FavoriteHeart type="community" targetId={community.id} size={20} />
          <PassportStampButton communityId={community.id} size={20} compact />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {community.imageUrl ? (
          <View style={styles.hero}>
            <Image
              source={{ uri: community.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
        ) : null}
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{community.name}</Text>
          {displayNeighborhood(
            community.name,
            community.neighborhood,
            community.heritage,
          ) ? (
            <Text style={styles.neighborhood}>
              {displayNeighborhood(
                community.name,
                community.neighborhood,
                community.heritage,
              )}
            </Text>
          ) : null}
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
            {displayDescription(community.description) ? (
              <Text style={styles.body}>
                {displayDescription(community.description)}
              </Text>
            ) : community.heritage ? (
              <Text style={styles.body}>{community.heritage}</Text>
            ) : null}
          </View>
        )}

        {tab === "Food" && (
          <View style={styles.tabContent}>
            {visiblePois.some((p) => pointToLatLng(p.location)) ||
            mapCentroid ? (
              <View style={styles.mapWrap}>
                <EnclaveDetailMap
                  key={`${community.id}|${visiblePois.map((p) => p.id).join(",")}`}
                  centroid={mapCentroid}
                  pois={visiblePois}
                  onPoiPress={(restaurantId) =>
                    navigation.navigate("RestaurantDetail", { restaurantId })
                  }
                  height={160}
                />
                <Pressable
                  style={styles.expandBtn}
                  onPress={() => {
                    const restaurantCoords = visiblePois
                      .map((p) => pointToLatLng(p.location))
                      .filter(
                        (c): c is { latitude: number; longitude: number } =>
                          c != null,
                      );
                    const center = mapCentroid ??
                      restaurantCoords[0] ?? {
                        latitude: community.latitude,
                        longitude: community.longitude,
                      };
                    if (
                      !Number.isFinite(center.latitude) ||
                      !Number.isFinite(center.longitude)
                    ) {
                      return;
                    }
                    navigation.navigate("MainTabs", {
                      screen: "Map",
                      params: {
                        expandRestaurants: {
                          communityId: community.id,
                          communityName: community.name,
                          latitude: center.latitude,
                          longitude: center.longitude,
                          restaurantCoords,
                        },
                      },
                    });
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Show restaurants on map"
                >
                  <IconArrowsMaximize size={16} color={colors.forest} />
                </Pressable>
              </View>
            ) : null}
            <Text style={styles.sectionTitle}>
              {pois.length > 0
                ? `${visiblePois.length}${
                    ethnicityFilter ? ` of ${pois.length}` : ""
                  } restaurant${visiblePois.length === 1 ? "" : "s"}`
                : "Restaurants"}
            </Text>
            {dishes.length > 0 ? (
              <Text style={styles.foodIntro}>
                {dishes.length} dish{dishes.length === 1 ? "" : "es"} to try
              </Text>
            ) : null}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <Chip
                label="All"
                selected={ethnicityFilter === null}
                onPress={() => setEthnicityFilter(null)}
              />
              {ethnicityOptions.map((id) => (
                <Chip
                  key={id}
                  label={ethnicityLabel(id)}
                  selected={ethnicityFilter === id}
                  onPress={() =>
                    setEthnicityFilter(id === ethnicityFilter ? null : id)
                  }
                />
              ))}
            </ScrollView>

            {visiblePois.length === 0 ? (
              <Text style={styles.body}>No places match this filter.</Text>
            ) : (
              visiblePois.map((poi) => {
                const poiDishes = dishesByPoi.get(poi.id) ?? [];
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
                        {poi.ethnicities?.length ? (
                          <View style={styles.restaurantFlagBadge}>
                            <EthnicityFlags
                              ethnicities={poi.ethnicities.slice(0, 1)}
                              size={20}
                            />
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.restaurantInfo}>
                        <Text style={styles.restaurantName}>{poi.name}</Text>
                        <Text style={styles.restaurantMeta}>{meta}</Text>
                      </View>
                      <View
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={(e) => e.stopPropagation()}
                      >
                        <FavoriteHeart
                          type="restaurant"
                          targetId={poi.id}
                          size={18}
                        />
                      </View>
                      <IconChevronRight size={18} color={colors.grayLight} />
                    </Pressable>
                    {poiDishes.map((dish) => (
                      <ListRow
                        key={dish.id}
                        leading={
                          <FavoriteThumb
                            kind="dish"
                            imageUrl={dish.imageUrl}
                            countryCode={primaryEthnicityCountryCode(
                              dish.ethnicities?.length
                                ? dish.ethnicities
                                : poi.ethnicities,
                            )}
                            flag={primaryEthnicityEmoji(
                              dish.ethnicities?.length
                                ? dish.ethnicities
                                : poi.ethnicities,
                            )}
                            size={44}
                          />
                        }
                        title={dish.name}
                        subtitle={dish.description ?? undefined}
                        onPress={() =>
                          navigation.navigate("RestaurantDetail", {
                            restaurantId: poi.id,
                          })
                        }
                        rightElement={
                          <View style={styles.dishActions}>
                            {dish.priceRange ? (
                              <Badge label={dish.priceRange} />
                            ) : null}
                            <FavoriteHeart
                              type="dish"
                              targetId={dish.id}
                              size={18}
                            />
                          </View>
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
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
    minHeight: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  hero: {
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
    marginBottom: 16,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  titleBlock: {
    marginBottom: 20,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
  },
  neighborhood: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: "row",
    marginTop: 4,
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
  mapWrap: {
    marginBottom: 18,
  },
  expandBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 6,
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
  restaurantFlagBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
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
  dishActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
