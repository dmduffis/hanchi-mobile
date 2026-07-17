import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { pointToLatLng } from "../api/geo";
import { fetchPoisNear } from "../api/pois";
import type { ApiPoi } from "../api/search";
import { useCommunities } from "../api/useCommunities";
import { Chip, ListRow, SearchBar } from "../components";
import { CircularFlag } from "../components/CircularFlag";
import {
  CommunityMap,
  isCommunityInRegion,
  isCoordInRegion,
  NYC_REGION,
  radiusMetersForRegion,
  type CommunityMapHandle,
  type MapLayer,
  type MapRegion,
  type MapRestaurant,
} from "../components/CommunityMap";
import {
  getCommunityCountryCode,
  getCommunityFlag,
} from "../data/communityFlags";
import {
  CULTURE_FILTERS,
  ethnicitiesForCultureFilter,
  filterCommunities,
  getAffinityLabels,
  poiMatchesQuery,
  type CultureFilterId,
} from "../data/cultureFilters";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";
import type { Community } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_GAP = 12;
const CARD_INSET = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const CAROUSEL_LIMIT = 5;

type BottomMode = "cards" | "list";

function toMapRestaurant(poi: ApiPoi): MapRestaurant | null {
  const coord = pointToLatLng(poi.location);
  if (!coord) return null;
  return {
    id: poi.id,
    name: poi.name,
    latitude: coord.latitude,
    longitude: coord.longitude,
    ethnicities: poi.ethnicities,
  };
}

/** Squared distance for sorting — good enough at city scale. */
function distSq(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return dLat * dLat + dLng * dLng;
}

function poiDistSq(poi: ApiPoi, lat: number, lng: number): number {
  const coord = pointToLatLng(poi.location);
  if (!coord) return Number.POSITIVE_INFINITY;
  return distSq(coord.latitude, coord.longitude, lat, lng);
}

export function MapScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { communities, raw, loading, error } = useCommunities();
  const [layer, setLayer] = useState<MapLayer>("enclaves");
  const [mode, setMode] = useState<BottomMode>("cards");
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [culture, setCulture] = useState<CultureFilterId>("all");
  const [region, setRegion] = useState<MapRegion>(NYC_REGION);
  const [foodPois, setFoodPois] = useState<ApiPoi[]>([]);
  const [foodLoading, setFoodLoading] = useState(false);
  /** Pin tap focus — carousel shows the 10 closest to this restaurant. */
  const [focusRestaurantId, setFocusRestaurantId] = useState<string | null>(
    null,
  );
  const listRef = useRef<FlatList<Community | ApiPoi>>(null);
  const mapRef = useRef<CommunityMapHandle>(null);
  const regionRef = useRef<MapRegion>(NYC_REGION);
  const pendingScrollIndex = useRef<number | null>(null);
  /** True when activeIndex was set from a map pin — carousel should follow. */
  const scrollFromMarker = useRef(false);
  const selectedIdRef = useRef<string | null>(null);
  const foodFetchGen = useRef(0);

  const poiCountById = useMemo(() => {
    const map = new Map<string, number>();
    raw.forEach((c) => map.set(c.id, c.poiCount ?? 0));
    return map;
  }, [raw]);

  const filtered = useMemo(
    () => filterCommunities(communities, { culture, query }),
    [communities, culture, query],
  );

  /** Communities inside the current map viewport (drives pins + carousel). */
  const inViewCommunities = useMemo(
    () => filtered.filter((c) => isCommunityInRegion(c, region)),
    [filtered, region],
  );

  const filteredFood = useMemo(
    () => foodPois.filter((p) => poiMatchesQuery(p, query)),
    [foodPois, query],
  );

  const inViewFood = useMemo(
    () =>
      filteredFood.filter((p) => {
        const coord = pointToLatLng(p.location);
        if (!coord) return false;
        return isCoordInRegion(coord.latitude, coord.longitude, region);
      }),
    [filteredFood, region],
  );

  const mapRestaurants = useMemo(() => {
    const out: MapRestaurant[] = [];
    for (const p of inViewFood) {
      const r = toMapRestaurant(p);
      if (r) out.push(r);
    }
    return out;
  }, [inViewFood]);

  const inView = layer === "enclaves" ? inViewCommunities : inViewFood;
  const carouselCommunities = useMemo(
    () => inViewCommunities.slice(0, CAROUSEL_LIMIT),
    [inViewCommunities],
  );
  const carouselFood = useMemo(() => {
    const focus = focusRestaurantId
      ? inViewFood.find((p) => p.id === focusRestaurantId)
      : null;
    const focusCoord = focus ? pointToLatLng(focus.location) : null;
    const anchorLat = focusCoord?.latitude ?? region.latitude;
    const anchorLng = focusCoord?.longitude ?? region.longitude;
    return [...inViewFood]
      .sort(
        (a, b) =>
          poiDistSq(a, anchorLat, anchorLng) -
          poiDistSq(b, anchorLat, anchorLng),
      )
      .slice(0, CAROUSEL_LIMIT);
  }, [inViewFood, focusRestaurantId, region.latitude, region.longitude]);
  const carouselItems =
    layer === "enclaves" ? carouselCommunities : carouselFood;
  const filteredKey = useMemo(
    () =>
      layer === "enclaves"
        ? filtered.map((c) => c.id).join("|")
        : filteredFood.map((p) => p.id).join("|"),
    [layer, filtered, filteredFood],
  );

  // Search/filter for communities outside the current view (e.g. "detroit") → fly there.
  useEffect(() => {
    if (layer !== "enclaves") return;
    if (filtered.length === 0) return;
    const current = regionRef.current;
    const anyVisible = filtered.some((c) => isCommunityInRegion(c, current));
    if (anyVisible) return;
    mapRef.current?.fitToCommunities(filtered);
  }, [filteredKey, query, culture, filtered, layer]);

  // Restaurants layer: fetch cultural restaurants for the viewport.
  useEffect(() => {
    if (layer !== "restaurants") return;
    const gen = ++foodFetchGen.current;
    const handle = setTimeout(() => {
      const current = regionRef.current;
      const ethnicities = ethnicitiesForCultureFilter(culture) ?? undefined;
      setFoodLoading(true);
      fetchPoisNear({
        near: { lat: current.latitude, lng: current.longitude },
        radiusMeters: radiusMetersForRegion(current),
        ethnicity: ethnicities ?? undefined,
        limit: 200,
      })
        .then((res) => {
          if (foodFetchGen.current !== gen) return;
          setFoodPois(res.pois);
        })
        .catch(() => {
          if (foodFetchGen.current !== gen) return;
          setFoodPois([]);
        })
        .finally(() => {
          if (foodFetchGen.current !== gen) return;
          setFoodLoading(false);
        });
    }, 350);
    return () => clearTimeout(handle);
  }, [layer, region, culture]);

  useEffect(() => {
    setActiveIndex(0);
    selectedIdRef.current = null;
    setFocusRestaurantId(null);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [culture, query, layer]);

  // Drop focus when the pinned restaurant leaves the viewport.
  useEffect(() => {
    if (!focusRestaurantId) return;
    if (!inViewFood.some((p) => p.id === focusRestaurantId)) {
      setFocusRestaurantId(null);
    }
  }, [inViewFood, focusRestaurantId]);

  // Keep selection stable when the viewport set changes (pan/zoom).
  useEffect(() => {
    const keepId = selectedIdRef.current;
    if (keepId) {
      const next = carouselItems.findIndex((item) => item.id === keepId);
      if (next >= 0) {
        setActiveIndex(next);
        return;
      }
    }
    setActiveIndex(0);
  }, [carouselItems]);

  useEffect(() => {
    selectedIdRef.current = carouselItems[activeIndex]?.id ?? null;
  }, [carouselItems, activeIndex]);

  const openCommunity = (communityId: string) => {
    navigation.navigate("CommunityProfile", { communityId });
  };

  const openRestaurant = (restaurantId: string) => {
    navigation.navigate("RestaurantDetail", { restaurantId });
  };

  const scrollCarouselToIndex = (index: number, animated = true) => {
    if (!listRef.current || index < 0) return;
    try {
      listRef.current.scrollToIndex({
        index,
        animated,
        viewPosition: 0,
      });
    } catch {
      listRef.current.scrollToOffset({
        offset: index * (CARD_WIDTH + CARD_GAP),
        animated,
      });
    }
  };

  const scrollToItem = (itemId: string) => {
    if (layer === "restaurants") {
      // Re-anchor carousel to this pin — nearest 10 will recompute with it first.
      setFocusRestaurantId(itemId);
      scrollFromMarker.current = true;
      selectedIdRef.current = itemId;
      setActiveIndex(0);
      if (mode !== "cards") {
        pendingScrollIndex.current = 0;
        setMode("cards");
      }
      return;
    }

    const index = carouselItems.findIndex((item) => item.id === itemId);
    if (index < 0) {
      openCommunity(itemId);
      return;
    }

    scrollFromMarker.current = true;
    selectedIdRef.current = itemId;

    if (mode !== "cards") {
      pendingScrollIndex.current = index;
      setActiveIndex(index);
      setMode("cards");
      return;
    }

    if (index === activeIndex) {
      scrollCarouselToIndex(index);
      scrollFromMarker.current = false;
      return;
    }

    setActiveIndex(index);
  };

  // After pin selects a card, scroll once layout/selection re-render settles.
  useEffect(() => {
    if (!scrollFromMarker.current || mode !== "cards") return;
    const index = activeIndex;
    const id = requestAnimationFrame(() => {
      scrollCarouselToIndex(index);
      setTimeout(() => {
        scrollFromMarker.current = false;
      }, 350);
    });
    return () => cancelAnimationFrame(id);
  }, [activeIndex, mode]);

  useEffect(() => {
    if (mode !== "cards" || pendingScrollIndex.current === null) return;
    const index = pendingScrollIndex.current;
    pendingScrollIndex.current = null;
    scrollFromMarker.current = true;
    const id = requestAnimationFrame(() => {
      setActiveIndex(index);
      scrollCarouselToIndex(index);
      setTimeout(() => {
        scrollFromMarker.current = false;
      }, 350);
    });
    return () => cancelAnimationFrame(id);
  }, [mode]);

  const onCardsScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (scrollFromMarker.current) return;
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + CARD_GAP));
    setActiveIndex(
      Math.max(0, Math.min(index, Math.max(carouselItems.length - 1, 0))),
    );
  };

  const filterLabel =
    culture === "all" && !query.trim()
      ? `${inView.length} in view`
      : `${inView.length} in view · ${layer === "enclaves" ? filtered.length : filteredFood.length} match${(layer === "enclaves" ? filtered.length : filteredFood.length) === 1 ? "" : "es"}`;

  if (loading) {
    return (
      <View style={[styles.root, styles.loadingWrap]}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, styles.loadingWrap]}>
        <Text style={styles.emptySub}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CommunityMap
        ref={mapRef}
        layer={layer}
        communities={filtered}
        restaurants={mapRestaurants}
        filterKey={`${layer}|${culture}|${query.trim().toLowerCase()}`}
        selectedId={carouselItems[activeIndex]?.id ?? null}
        onMarkerPress={scrollToItem}
        onRestaurantPress={scrollToItem}
        onRegionChangeComplete={(next) => {
          regionRef.current = next;
          setRegion(next);
        }}
      />

      <SafeAreaView
        style={styles.topOverlay}
        edges={["top"]}
        pointerEvents="box-none"
      >
        <View style={styles.searchRow}>
          <View style={styles.searchFlex}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={
                layer === "enclaves"
                  ? "Search communities, cities…"
                  : "Search Korean, Thai, phở…"
              }
            />
          </View>
          <Pressable
            style={[styles.modeBtn, mode === "list" && styles.modeBtnActive]}
            onPress={() => setMode((m) => (m === "list" ? "cards" : "list"))}
            hitSlop={4}
          >
            <Feather
              name={mode === "list" ? "map" : "list"}
              size={18}
              color={mode === "list" ? colors.white : colors.forest}
            />
          </Pressable>
        </View>

        <View style={styles.layerToggle}>
          <Pressable
            style={[
              styles.layerBtn,
              layer === "enclaves" && styles.layerBtnActive,
            ]}
            onPress={() => setLayer("enclaves")}
          >
            <Feather
              name="users"
              size={15}
              color={layer === "enclaves" ? colors.white : colors.forest}
            />
            <Text
              style={[
                styles.layerBtnText,
                layer === "enclaves" && styles.layerBtnTextActive,
              ]}
            >
              Communities
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.layerBtn,
              layer === "restaurants" && styles.layerBtnActive,
            ]}
            onPress={() => setLayer("restaurants")}
          >
            <MaterialIcons
              name="restaurant"
              size={16}
              color={layer === "restaurants" ? colors.white : colors.forest}
            />
            <Text
              style={[
                styles.layerBtnText,
                layer === "restaurants" && styles.layerBtnTextActive,
              ]}
            >
              Restaurants
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
          keyboardShouldPersistTaps="handled"
        >
          {CULTURE_FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              tone="overlay"
              selected={culture === f.id}
              onPress={() => setCulture(f.id)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {mode === "cards" ? (
        <View
          style={[
            styles.carouselWrap,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.carouselLabelRow}>
            <Text style={styles.carouselLabel}>{filterLabel}</Text>
            {layer === "restaurants" && foodLoading ? (
              <ActivityIndicator size="small" color={colors.forest} />
            ) : null}
          </View>
          {inView.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {layer === "enclaves"
                  ? "No communities in view"
                  : "No restaurants in view"}
              </Text>
              <Text style={styles.emptySub}>
                {layer === "enclaves"
                  ? "Pan the map or clear filters to find communities"
                  : "Pan the map or try another culture filter"}
              </Text>
              <Pressable
                onPress={() => {
                  setCulture("all");
                  setQuery("");
                }}
              >
                <Text style={styles.emptyAction}>Clear filters</Text>
              </Pressable>
            </View>
          ) : layer === "enclaves" ? (
            <FlatList
              ref={listRef as React.RefObject<FlatList<Community>>}
              data={carouselCommunities}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + CARD_GAP}
              snapToAlignment="start"
              disableIntervalMomentum
              getItemLayout={(_, index) => ({
                length: CARD_WIDTH + CARD_GAP,
                offset: index * (CARD_WIDTH + CARD_GAP),
                index,
              })}
              onScrollToIndexFailed={({ index }) => {
                setTimeout(() => scrollCarouselToIndex(index, false), 50);
              }}
              contentContainerStyle={{
                paddingHorizontal: CARD_INSET,
                gap: CARD_GAP,
              }}
              onMomentumScrollEnd={onCardsScrollEnd}
              renderItem={({ item, index }) => {
                const groups = getAffinityLabels(item);
                return (
                  <Pressable
                    style={[
                      styles.card,
                      index === activeIndex && styles.cardActive,
                      { width: CARD_WIDTH },
                    ]}
                    onPress={() => openCommunity(item.id)}
                  >
                    <CircularFlag
                      countryCode={getCommunityCountryCode(item.id)}
                      flag={getCommunityFlag(item.id, item.emoji)}
                      size={52}
                      selected={index === activeIndex}
                    />
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {item.neighborhood} · {item.heritage}
                      </Text>
                      {groups.length > 0 ? (
                        <View style={styles.cardChips}>
                          {groups.map((label) => (
                            <View key={label} style={styles.cardChip}>
                              <Text style={styles.cardChipText}>{label}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.cardDistance}>
                          {item.station
                            ? `${item.subwayLines?.slice(0, 3).join(" · ") || "Transit"} · ${item.station}`
                            : `${poiCountById.get(item.id) ?? 0} spots · ${item.distanceMiles} mi`}
                        </Text>
                      )}
                    </View>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.grayLight}
                    />
                  </Pressable>
                );
              }}
            />
          ) : (
            <FlatList
              ref={listRef as React.RefObject<FlatList<ApiPoi>>}
              data={carouselFood}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + CARD_GAP}
              snapToAlignment="start"
              disableIntervalMomentum
              getItemLayout={(_, index) => ({
                length: CARD_WIDTH + CARD_GAP,
                offset: index * (CARD_WIDTH + CARD_GAP),
                index,
              })}
              onScrollToIndexFailed={({ index }) => {
                setTimeout(() => scrollCarouselToIndex(index, false), 50);
              }}
              contentContainerStyle={{
                paddingHorizontal: CARD_INSET,
                gap: CARD_GAP,
              }}
              onMomentumScrollEnd={onCardsScrollEnd}
              renderItem={({ item, index }) => {
                const rating =
                  item.rating != null && Number.isFinite(item.rating)
                    ? item.rating.toFixed(1)
                    : null;
                return (
                  <Pressable
                    style={[
                      styles.card,
                      index === activeIndex && styles.cardActive,
                      { width: CARD_WIDTH },
                    ]}
                    onPress={() => openRestaurant(item.id)}
                  >
                    <CircularFlag
                      countryCode={primaryEthnicityCountryCode(
                        item.ethnicities,
                      )}
                      flag={primaryEthnicityEmoji(item.ethnicities)}
                      size={52}
                      selected={index === activeIndex}
                    />
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {[
                          item.category,
                          item.priceLevel,
                          rating ? `★ ${rating}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                      <Text style={styles.cardDistance} numberOfLines={1}>
                        {item.communityId
                          ? "Part of a community"
                          : (item.address ?? "Nearby")}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.grayLight}
                    />
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      ) : (
        <View
          style={[
            styles.listSheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>
                {layer === "enclaves"
                  ? "Communities on the map"
                  : "Restaurants nearby"}
              </Text>
              <Text style={styles.sheetSub}>{filterLabel}</Text>
            </View>
            <Pressable
              style={styles.closeListBtn}
              onPress={() => setMode("cards")}
              hitSlop={8}
            >
              <Feather name="x" size={18} color={colors.ink} />
            </Pressable>
          </View>
          {layer === "enclaves" ? (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptySub}>
                  No communities match these filters.
                </Text>
              }
              renderItem={({ item }) => (
                <ListRow
                  thumbnail={getCommunityFlag(item.id, item.emoji)}
                  title={item.name}
                  subtitle={`${item.neighborhood} · ${getAffinityLabels(item).join(" · ") || item.heritage}`}
                  onPress={() => openCommunity(item.id)}
                />
              )}
            />
          ) : (
            <FlatList
              data={filteredFood}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptySub}>
                  {foodLoading
                    ? "Loading restaurants…"
                    : "No restaurants match these filters."}
                </Text>
              }
              renderItem={({ item }) => (
                <ListRow
                  thumbnail={primaryEthnicityEmoji(item.ethnicities)}
                  title={item.name}
                  subtitle={[item.category, item.priceLevel]
                    .filter(Boolean)
                    .join(" · ")}
                  onPress={() => openRestaurant(item.id)}
                />
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  searchFlex: {
    flex: 1,
  },
  layerToggle: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 2,
  },
  layerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  layerBtnActive: {
    backgroundColor: colors.forest,
  },
  layerBtnText: {
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    color: colors.forest,
  },
  layerBtnTextActive: {
    color: colors.white,
  },
  pills: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  modeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modeBtnActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  carouselWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  carouselLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginLeft: CARD_INSET,
  },
  carouselLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.ink,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  emptyCard: {
    marginHorizontal: CARD_INSET,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
  },
  emptySub: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    textAlign: "center",
  },
  emptyAction: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.forest,
    marginTop: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardActive: {
    borderColor: colors.gold,
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    fontFamily: typography.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  cardMeta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  cardChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  cardChip: {
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardChipText: {
    fontFamily: typography.bodyMedium,
    fontSize: 11,
    color: colors.forest,
  },
  cardDistance: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.forest,
    marginTop: 4,
  },
  listSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "32%",
    zIndex: 30,
    elevation: 30,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
  },
  sheetSub: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  closeListBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 16,
  },
});
