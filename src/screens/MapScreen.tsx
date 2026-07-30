import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import * as Location from "expo-location";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { pointToLatLng } from "../api/geo";
import { fetchPoisNear } from "../api/pois";
import type { ApiPoi } from "../api/search";
import { useCommunities } from "../api/useCommunities";
import {
  Chip,
  CommunityDetailSheet,
  ListRow,
  MapSheetCard,
  SearchBar,
} from "../components";
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
  getCommunityFlag,
} from "../data/communityFlags";
import {
  availableCultureFiltersForCommunities,
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
import {
  IconList,
  IconLocate,
  IconMap,
  IconToolsKitchen2,
  IconUsers,
  IconX,
} from "../icons";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_GAP = 10;
const CARD_EDGE = 14;

function formatDistanceMeters(meters?: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return "Nearby";
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}
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
  const { communities, loading, error } = useCommunities();
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
  /** Enclave pin tap — opens single-community detail sheet. */
  const [focusedCommunityId, setFocusedCommunityId] = useState<string | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const listRef = useRef<FlatList<ApiPoi>>(null);
  const mapRef = useRef<CommunityMapHandle>(null);
  const regionRef = useRef<MapRegion>(NYC_REGION);
  const pendingScrollIndex = useRef<number | null>(null);
  /** True when activeIndex was set from a map pin — carousel should follow. */
  const scrollFromMarker = useRef(false);
  const selectedIdRef = useRef<string | null>(null);
  const foodFetchGen = useRef(0);

  const filtered = useMemo(
    () => filterCommunities(communities, { culture, query }),
    [communities, culture, query],
  );

  /** Query matches only — used so culture chips stay visible for what's nearby. */
  const queryMatchedCommunities = useMemo(
    () => filterCommunities(communities, { culture: "all", query }),
    [communities, query],
  );

  /** Communities inside the current map viewport (drives pins + carousel). */
  const inViewCommunities = useMemo(
    () => filtered.filter((c) => isCommunityInRegion(c, region)),
    [filtered, region],
  );

  const cultureFilters = useMemo(() => {
    const source =
      mode === "list"
        ? queryMatchedCommunities
        : queryMatchedCommunities.filter((c) => isCommunityInRegion(c, region));
    return availableCultureFiltersForCommunities(source);
  }, [mode, queryMatchedCommunities, region]);

  useEffect(() => {
    if (culture === "all") return;
    if (cultureFilters.some((f) => f.id === culture)) return;
    setCulture("all");
  }, [culture, cultureFilters]);

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
  const carouselItems = carouselFood;
  const filteredKey = useMemo(
    () =>
      layer === "enclaves"
        ? filtered.map((c) => c.id).join("|")
        : filteredFood.map((p) => p.id).join("|"),
    [layer, filtered, filteredFood],
  );

  // Search/filter for communities outside the current view (e.g. "detroit") → fly there.
  // Never fit the unfiltered full list (that zooms out to the whole country).
  useEffect(() => {
    if (layer !== "enclaves") return;
    if (filtered.length === 0) return;
    const hasIntent = query.trim().length > 0 || culture !== "all";
    if (!hasIntent) return;

    const current = regionRef.current;
    const anyVisible = filtered.some((c) => isCommunityInRegion(c, current));
    if (anyVisible) return;

    // Prefer the nearest metro cluster, not every match nationwide.
    const nearest = filtered.reduce(
      (best, c) => {
        const d =
          (c.latitude - current.latitude) ** 2 +
          (c.longitude - current.longitude) ** 2;
        return d < best.d ? { c, d } : best;
      },
      { c: filtered[0]!, d: Number.POSITIVE_INFINITY },
    );

    const METRO_SPAN_DEG = 0.9;
    const localCluster = filtered.filter((c) => {
      const dLat = Math.abs(c.latitude - nearest.c.latitude);
      const dLng = Math.abs(c.longitude - nearest.c.longitude);
      return dLat <= METRO_SPAN_DEG && dLng <= METRO_SPAN_DEG;
    });

    mapRef.current?.fitToCommunities(
      localCluster.length > 0 ? localCluster : [nearest.c],
    );
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
        limit: 100,
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
    setFocusedCommunityId(null);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [culture, query, layer]);

  // Drop focus when the pinned restaurant leaves the viewport.
  useEffect(() => {
    if (!focusRestaurantId) return;
    if (!inViewFood.some((p) => p.id === focusRestaurantId)) {
      setFocusRestaurantId(null);
    }
  }, [inViewFood, focusRestaurantId]);

  // Keep restaurant carousel selection stable when the viewport set changes.
  useEffect(() => {
    if (layer !== "restaurants") return;
    const keepId = selectedIdRef.current;
    if (keepId) {
      const next = carouselItems.findIndex((item) => item.id === keepId);
      if (next >= 0) {
        setActiveIndex(next);
        return;
      }
    }
    setActiveIndex(0);
  }, [carouselItems, layer]);

  useEffect(() => {
    if (layer !== "restaurants") return;
    selectedIdRef.current = carouselItems[activeIndex]?.id ?? null;
  }, [carouselItems, activeIndex, layer]);

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
      setFocusedCommunityId(null);
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

    // Enclave pin → single-community detail sheet (not the multi-card carousel).
    setFocusRestaurantId(null);
    selectedIdRef.current = itemId;
    setFocusedCommunityId(itemId);
    if (mode !== "cards") setMode("cards");
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

  const goToMyLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location needed",
          "Allow location access to jump back to where you are on the map.",
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToCoordinate(
        position.coords.latitude,
        position.coords.longitude,
      );
    } catch {
      Alert.alert(
        "Couldn't find you",
        "Check that location services are on, then try again.",
      );
    } finally {
      setLocating(false);
    }
  };

  const filterLabel =
    culture === "all" && !query.trim()
      ? `${inView.length} in view`
      : `${inView.length} in view · ${layer === "enclaves" ? filtered.length : filteredFood.length} match${(layer === "enclaves" ? filtered.length : filteredFood.length) === 1 ? "" : "es"}`;

  const showCommunityDetail =
    mode === "cards" && layer === "enclaves" && focusedCommunityId != null;
  const showRestaurantCarousel = mode === "cards" && layer === "restaurants";
  const showCultureChips =
    mode === "cards" && !showCommunityDetail && cultureFilters.length > 0;

  const selectedMapId =
    layer === "enclaves"
      ? focusedCommunityId
      : (carouselItems[activeIndex]?.id ?? null);

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
        selectedId={selectedMapId}
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
            onPress={() => {
              setFocusedCommunityId(null);
              setMode((m) => (m === "list" ? "cards" : "list"));
            }}
            hitSlop={4}
          >
            {mode === "list" ? (
              <IconMap size={18} color={colors.white} />
            ) : (
              <IconList size={18} color={colors.forest} />
            )}
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
            <IconUsers
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
            <IconToolsKitchen2
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

        {showCultureChips ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topFilters}
            keyboardShouldPersistTaps="handled"
            style={styles.topFiltersScroll}
          >
            {cultureFilters.map((f) => (
              <Chip
                key={f.id}
                label={f.label}
                size="sm"
                tone="overlay"
                selected={culture === f.id}
                onPress={() => setCulture(f.id)}
              />
            ))}
          </ScrollView>
        ) : null}
      </SafeAreaView>

      <Pressable
        style={[
          styles.locateBtn,
          showCommunityDetail || mode === "list"
            ? { top: insets.top + (showCultureChips ? 168 : 132) }
            : showRestaurantCarousel
              ? { bottom: 250 + Math.max(insets.bottom, 6) }
              : { bottom: 24 + Math.max(insets.bottom, 6) },
        ]}
        onPress={goToMyLocation}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go to my location"
      >
        {locating ? (
          <ActivityIndicator size="small" color={colors.forest} />
        ) : (
          <IconLocate size={20} color={colors.forest} />
        )}
      </Pressable>

      {showCommunityDetail && focusedCommunityId ? (
        <CommunityDetailSheet
          communityId={focusedCommunityId}
          onClose={() => {
            setFocusedCommunityId(null);
            selectedIdRef.current = null;
          }}
          onReadMore={openCommunity}
          onRestaurantPress={openRestaurant}
        />
      ) : null}

      {showRestaurantCarousel ? (
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 6) }]}
          pointerEvents="box-none"
        >
          <View style={styles.sheetGrabber} />
          {foodLoading ? (
            <View style={styles.sheetLoadingRow}>
              <ActivityIndicator size="small" color={colors.forest} />
              <Text style={styles.carouselLabel}>{filterLabel}</Text>
            </View>
          ) : null}
          {inViewFood.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No restaurants in view</Text>
              <Text style={styles.emptySub}>
                Pan the map or try another culture filter
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
          ) : (
            <FlatList
              ref={listRef}
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
                paddingLeft: CARD_EDGE,
                paddingRight: CARD_EDGE,
                gap: CARD_GAP,
              }}
              onMomentumScrollEnd={onCardsScrollEnd}
              renderItem={({ item }) => {
                const rating =
                  item.rating != null && Number.isFinite(item.rating)
                    ? `★ ${item.rating.toFixed(1)}`
                    : null;
                const meta = [item.priceLevel, item.category, rating]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <MapSheetCard
                    width={CARD_WIDTH}
                    title={item.name}
                    meta={meta}
                    detail={formatDistanceMeters(item.distanceMeters)}
                    imageUrl={item.imageUrl}
                    countryCode={primaryEthnicityCountryCode(item.ethnicities)}
                    flag={primaryEthnicityEmoji(item.ethnicities)}
                    onPress={() => openRestaurant(item.id)}
                  />
                );
              }}
            />
          )}
        </View>
      ) : null}

      {mode === "list" ? (
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
              <IconX size={18} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sheetFilters}
            keyboardShouldPersistTaps="handled"
            style={styles.listFiltersScroll}
          >
            {cultureFilters.map((f) => (
              <Chip
                key={f.id}
                label={f.label}
                size="sm"
                tone="overlay"
                selected={culture === f.id}
                onPress={() => setCulture(f.id)}
              />
            ))}
          </ScrollView>
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
      ) : null}
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
  topFiltersScroll: {
    marginTop: 10,
  },
  topFilters: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: "center",
    paddingBottom: 4,
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
  locateBtn: {
    position: "absolute",
    right: 16,
    zIndex: 25,
    elevation: 25,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D6D3CC",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },
  sheetGrabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 22,
  },
  sheetFilters: {
    paddingHorizontal: 14,
    gap: 6,
    paddingBottom: 16,
    alignItems: "center",
  },
  sheetLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  carouselLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
  },
  emptyCard: {
    marginHorizontal: CARD_EDGE,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
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
  listFiltersScroll: {
    marginHorizontal: -20,
    marginBottom: 4,
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
