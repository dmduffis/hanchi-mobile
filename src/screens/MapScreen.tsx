import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type {
  CompositeNavigationProp,
  RouteProp,
} from "@react-navigation/native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
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
import { searchAll } from "../api/search";
import { useCommunities } from "../api/useCommunities";
import {
  Chip,
  CircularFlag,
  CommunityDetailSheet,
  FavoriteHeart,
  FavoriteThumb,
  ListRow,
  MapSheetCard,
  SearchBar,
  SearchResultsPanel,
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
  getCommunityCountryCode,
  getCommunityFlag,
} from "../data/communityFlags";
import {
  availableCultureFiltersForCommunities,
  availableCultureFiltersForEthnicities,
  CULTURE_FILTERS,
  ethnicitiesForCultureFilter,
  filterCommunities,
  getAffinityLabels,
  poiMatchesQuery,
  scoreCommunityQuery,
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
  IconMinus,
  IconPlus,
  IconToolsKitchen2,
  IconUsers,
  IconX,
} from "../icons";
import {
  mapSearchResults,
  type SearchKindFilter,
  type SearchResult,
} from "../lib/searchResults";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import {
  distanceMeters,
  getMapLocationMode,
  getSavedLocationInfo,
  METRO_FIT_RADIUS_METERS,
  resolveMapRegion,
} from "../lib/userLocation";
import { colors, radii, typography } from "../theme";
import type { Community } from "../types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_GAP = 10;
const CARD_EDGE = 14;
const RESTAURANT_SHEET_EXPANDED_TOP = Math.round(SCREEN_HEIGHT * 0.28);
const SEARCH_PANEL_MAX_HEIGHT = Math.round(SCREEN_HEIGHT * 0.42);

function communitiesNear(
  list: Community[],
  lat: number,
  lng: number,
  radiusMeters = METRO_FIT_RADIUS_METERS,
): Community[] {
  return list.filter(
    (c) =>
      Number.isFinite(c.latitude) &&
      Number.isFinite(c.longitude) &&
      distanceMeters(lat, lng, c.latitude, c.longitude) <= radiusMeters,
  );
}

/** Stable key so boot / focus / locate agree (avoids false “location changed” refits). */
function mapLocationKey(
  mode: string,
  latitude: number,
  longitude: number,
): string {
  return `${mode}:${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

function formatDistanceMeters(meters?: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return "Nearby";
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

function ethnicityChipLabel(id: string): string {
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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

type MapNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Map">,
  NativeStackNavigationProp<RootStackParamList>
>;

export function MapScreen() {
  const navigation = useNavigation<MapNav>();
  const route = useRoute<RouteProp<MainTabParamList, "Map">>();
  const insets = useSafeAreaInsets();
  const { communities, loading, error } = useCommunities();
  const [layer, setLayer] = useState<MapLayer>("enclaves");
  const [mode, setMode] = useState<BottomMode>("cards");
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [culture, setCulture] = useState<CultureFilterId>("all");
  const [globalResults, setGlobalResults] = useState<SearchResult[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [searchKind, setSearchKind] = useState<SearchKindFilter>("all");
  const [resultsOpen, setResultsOpen] = useState(false);
  const [searchAutoFocus, setSearchAutoFocus] = useState(false);
  /** Bump to remount SearchBar so autoFocus works when Map is already mounted. */
  const [searchFocusKey, setSearchFocusKey] = useState(0);
  const appliedFocusKey = useRef<string | null>(null);
  /** Skip one search fly-to after Home deep-link aims the camera. */
  const skipSearchFlyTo = useRef(false);
  /** Last query/culture we already flew to — don't re-fly while the user pans. */
  const lastSearchFlyIntent = useRef("");
  /** Ignore the next region-change callback from our own animate/fit. */
  const ignoreNextRegionCommit = useRef(false);
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
  /** Restaurants layer scoped to one community (from sheet expand). */
  const [foodCommunityFilter, setFoodCommunityFilter] = useState<{
    id: string;
    name: string;
  } | null>(null);
  /** Specific ethnicity within a community-scoped restaurant set. */
  const [foodEthnicityFilter, setFoodEthnicityFilter] = useState<string | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  /** Restaurant card sheet pulled up → Favorites-style list. */
  const [restaurantSheetExpanded, setRestaurantSheetExpanded] = useState(false);
  const [bootRegion, setBootRegion] = useState<MapRegion | null>(null);
  const listRef = useRef<FlatList<ApiPoi>>(null);
  const mapRef = useRef<CommunityMapHandle>(null);
  const regionRef = useRef<MapRegion>(NYC_REGION);
  const pendingScrollIndex = useRef<number | null>(null);
  /** True when activeIndex was set from a map pin — carousel should follow. */
  const scrollFromMarker = useRef(false);
  const selectedIdRef = useRef<string | null>(null);
  const foodFetchGen = useRef(0);
  const didBootLocation = useRef(false);
  const appliedLocationKey = useRef<string | null>(null);
  const fittedLocationKey = useRef<string | null>(null);
  /**
   * After Home/Map search moves the camera, keep that place — don't yank
   * back to the profile/GPS metro on tab focus or catalog load.
   * Cleared only by the locate button.
   */
  const suppressAutoLocationFit = useRef(false);

  const moveCamera = useCallback((action: () => void) => {
    ignoreNextRegionCommit.current = true;
    action();
  }, []);

  useEffect(() => {
    if (didBootLocation.current) return;
    didBootLocation.current = true;
    let cancelled = false;

    (async () => {
      // Prefer live GPS when already allowed; else saved coords; else NYC.
      const [{ region }, mode] = await Promise.all([
        resolveMapRegion({ requestPermission: false }),
        getMapLocationMode(),
      ]);
      if (cancelled) return;
      regionRef.current = region;
      setRegion(region);
      setBootRegion(region);
      appliedLocationKey.current = mapLocationKey(
        mode,
        region.latitude,
        region.longitude,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Re-frame only when Profile changes the saved map location.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const info = await getSavedLocationInfo();
        if (cancelled) return;
        const key = mapLocationKey(
          info.mode,
          info.region.latitude,
          info.region.longitude,
        );

        // Search deep-link / user exploration owns the camera.
        if (suppressAutoLocationFit.current) {
          appliedLocationKey.current = key;
          fittedLocationKey.current = key;
          return;
        }

        if (appliedLocationKey.current === key) return;
        appliedLocationKey.current = key;
        fittedLocationKey.current = key;
        regionRef.current = info.region;
        setRegion(info.region);
        setBootRegion(info.region);
        const metro = communitiesNear(
          communities,
          info.region.latitude,
          info.region.longitude,
        );
        if (metro.length > 0) {
          moveCamera(() => mapRef.current?.fitToCommunities(metro));
        } else {
          moveCamera(() =>
            mapRef.current?.animateToCoordinate(
              info.region.latitude,
              info.region.longitude,
              {
                latitudeDelta: info.region.latitudeDelta,
                longitudeDelta: info.region.longitudeDelta,
              },
            ),
          );
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [communities, moveCamera]),
  );

  // After location + community catalog load, frame the whole metro so OC
  // enclaves (e.g. Little Arabia) aren't clipped when opened near LA proper.
  useEffect(() => {
    if (!bootRegion || loading || communities.length === 0) {
      return;
    }
    if (suppressAutoLocationFit.current) return;
    // Deep-link focus from Home search owns the camera instead.
    if (route.params?.focusCommunityId || route.params?.query) return;
    const key = appliedLocationKey.current;
    if (!key || fittedLocationKey.current === key) return;
    const metro = communitiesNear(
      communities,
      bootRegion.latitude,
      bootRegion.longitude,
    );
    if (metro.length === 0) return;
    fittedLocationKey.current = key;
    const handle = requestAnimationFrame(() => {
      moveCamera(() => mapRef.current?.fitToCommunities(metro));
    });
    return () => cancelAnimationFrame(handle);
  }, [
    bootRegion,
    communities,
    loading,
    route.params?.focusCommunityId,
    route.params?.query,
    moveCamera,
  ]);

  // Home portal / deep-link → Map search or a specific community.
  useEffect(() => {
    const focusId = route.params?.focusCommunityId;
    const incomingQuery = route.params?.query?.trim();
    const showResults = route.params?.showResults === true;
    const focusSearch = route.params?.focusSearch === true;
    if (!focusId && !incomingQuery && !showResults && !focusSearch) return;
    if (loading || !bootRegion) return;
    if ((focusId || incomingQuery) && communities.length === 0) return;

    const key = `${focusId ?? ""}|${incomingQuery ?? ""}|${showResults}|${focusSearch}`;
    if (appliedFocusKey.current === key) return;
    appliedFocusKey.current = key;

    suppressAutoLocationFit.current = true;

    if (focusSearch) {
      setSearchFocusKey((k) => k + 1);
      setSearchAutoFocus(true);
      setResultsOpen(true);
      setLayer("enclaves");
    }

    if (incomingQuery) {
      skipSearchFlyTo.current = true;
      lastSearchFlyIntent.current = `all|${incomingQuery.toLowerCase()}`;
      setQuery(incomingQuery);
      setLayer("enclaves");
      setCulture("all");
      // Keep query in the bar; only open dropdown when explicitly requested.
      setResultsOpen(showResults && !focusId);
    } else if (showResults && !focusId) {
      setResultsOpen(true);
    }

    const target = focusId
      ? communities.find((c) => c.id === focusId)
      : undefined;
    if (target) {
      skipSearchFlyTo.current = true;
      lastSearchFlyIntent.current = `all|${(incomingQuery ?? target.name).toLowerCase()}`;
      setFocusedCommunityId(target.id);
      setLayer("enclaves");
      setResultsOpen(false);
      fittedLocationKey.current = appliedLocationKey.current;
      requestAnimationFrame(() => {
        moveCamera(() =>
          mapRef.current?.animateToCoordinate(
            target.latitude,
            target.longitude,
            { latitudeDelta: 0.06, longitudeDelta: 0.06 },
          ),
        );
      });
    }

    navigation.setParams({
      focusCommunityId: undefined,
      query: undefined,
      showResults: undefined,
      focusSearch: undefined,
    });
  }, [
    route.params?.focusCommunityId,
    route.params?.query,
    route.params?.showResults,
    route.params?.focusSearch,
    communities,
    loading,
    bootRegion,
    navigation,
    moveCamera,
  ]);

  // Prefetch global search results for the query. Do not auto-open the
  // dropdown here — that would reopen it after a community tap from Home.
  useEffect(() => {
    let cancelled = false;
    const q = query.trim();
    if (!q) {
      setGlobalResults([]);
      setGlobalSearchLoading(false);
      setSearchKind("all");
      return;
    }

    const handle = setTimeout(async () => {
      setGlobalSearchLoading(true);
      try {
        const data = await searchAll(q);
        if (!cancelled) setGlobalResults(mapSearchResults(data));
      } catch {
        if (!cancelled) setGlobalResults([]);
      } finally {
        if (!cancelled) setGlobalSearchLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

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
    // Restaurants layer: chips from POIs on the map — community centroids
    // often sit outside a tight restaurant zoom after clearing a community scope.
    if (layer === "restaurants" && !foodCommunityFilter) {
      const sourcePois =
        mode === "list"
          ? foodPois
          : foodPois.filter((p) => {
              const coord = pointToLatLng(p.location);
              if (!coord) return false;
              return isCoordInRegion(coord.latitude, coord.longitude, region);
            });
      const ethnicities: string[] = [];
      for (const p of sourcePois) {
        for (const e of p.ethnicities ?? []) ethnicities.push(e);
      }
      const available = availableCultureFiltersForEthnicities(ethnicities);
      if (culture !== "all" && !available.some((f) => f.id === culture)) {
        const selected = CULTURE_FILTERS.find((f) => f.id === culture);
        if (selected) return [...available, selected];
      }
      return available;
    }

    const source =
      mode === "list"
        ? queryMatchedCommunities
        : queryMatchedCommunities.filter((c) => isCommunityInRegion(c, region));
    const available = availableCultureFiltersForCommunities(source);
    // Keep the active chip visible when switching map ↔ list even if
    // matching communities are briefly outside the current viewport.
    if (culture !== "all" && !available.some((f) => f.id === culture)) {
      const selected = CULTURE_FILTERS.find((f) => f.id === culture);
      if (selected) return [...available, selected];
    }
    return available;
  }, [
    layer,
    foodCommunityFilter,
    mode,
    foodPois,
    queryMatchedCommunities,
    region,
    culture,
  ]);

  /** Specific ethnicity chips for restaurants in the scoped community. */
  const communityEthnicityOptions = useMemo(() => {
    if (!foodCommunityFilter) return [];
    const counts = new Map<string, number>();
    for (const p of foodPois) {
      for (const id of p.ethnicities ?? []) {
        const key = id.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([id]) => id);
  }, [foodCommunityFilter, foodPois]);

  useEffect(() => {
    setFoodEthnicityFilter(null);
  }, [foodCommunityFilter?.id]);

  // Drop culture only when it's invalid for the active layer's catalog —
  // not merely missing from a tight map viewport.
  useEffect(() => {
    if (culture === "all") return;
    if (foodCommunityFilter) return;
    if (layer === "restaurants") {
      if (foodPois.length === 0) return;
      const stillValid = availableCultureFiltersForEthnicities(
        foodPois.flatMap((p) => p.ethnicities ?? []),
      ).some((f) => f.id === culture);
      if (!stillValid) setCulture("all");
      return;
    }
    const stillValid = availableCultureFiltersForCommunities(
      queryMatchedCommunities,
    ).some((f) => f.id === culture);
    if (!stillValid) setCulture("all");
  }, [culture, queryMatchedCommunities, foodCommunityFilter, layer, foodPois]);

  useEffect(() => {
    if (!foodEthnicityFilter) return;
    if (communityEthnicityOptions.includes(foodEthnicityFilter)) return;
    setFoodEthnicityFilter(null);
  }, [foodEthnicityFilter, communityEthnicityOptions]);

  const filteredFood = useMemo(() => {
    let list = foodPois.filter((p) => poiMatchesQuery(p, query));
    // Community-scoped: filter by specific ethnicity present in this area.
    if (foodCommunityFilter && foodEthnicityFilter) {
      const want = foodEthnicityFilter.toLowerCase();
      list = list.filter((p) =>
        (p.ethnicities ?? []).some((e) => e.toLowerCase() === want),
      );
    } else if (!foodCommunityFilter && culture !== "all") {
      // Keep the full POI fetch unfiltered so culture chips stay visible;
      // apply the selected culture here.
      const want = ethnicitiesForCultureFilter(culture);
      if (want?.length) {
        const set = new Set(want.map((e) => e.toLowerCase()));
        list = list.filter((p) =>
          (p.ethnicities ?? []).some((e) => set.has(e.toLowerCase())),
        );
      }
    }
    return list;
  }, [foodPois, query, foodCommunityFilter, foodEthnicityFilter, culture]);

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

  const restaurantListFood = useMemo(() => {
    const focus = focusRestaurantId
      ? inViewFood.find((p) => p.id === focusRestaurantId)
      : null;
    const focusCoord = focus ? pointToLatLng(focus.location) : null;
    const anchorLat = focusCoord?.latitude ?? region.latitude;
    const anchorLng = focusCoord?.longitude ?? region.longitude;
    return [...inViewFood].sort(
      (a, b) =>
        poiDistSq(a, anchorLat, anchorLng) - poiDistSq(b, anchorLat, anchorLng),
    );
  }, [inViewFood, focusRestaurantId, region.latitude, region.longitude]);

  const carouselItems = carouselFood;

  useEffect(() => {
    if (layer !== "restaurants" || mode !== "cards") {
      setRestaurantSheetExpanded(false);
    }
  }, [layer, mode]);

  const restaurantSheetPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dy < -36 || g.vy < -0.6) {
          setRestaurantSheetExpanded(true);
        } else if (g.dy > 36 || g.vy > 0.6) {
          setRestaurantSheetExpanded(false);
        }
      },
    }),
  ).current;
  const filteredKey = useMemo(
    () =>
      layer === "enclaves"
        ? filtered.map((c) => c.id).join("|")
        : filteredFood.map((p) => p.id).join("|"),
    [layer, filtered, filteredFood],
  );

  // Search/filter → fly once to the best match, then leave the camera alone
  // so pan/zoom/pin taps stay on this same map place.
  useEffect(() => {
    if (layer !== "enclaves") return;
    // While the results dropdown is open, wait for a tap — don't fly under it.
    if (resultsOpen) return;
    const q = query.trim();
    const hasIntent = q.length > 0 || culture !== "all";
    if (!hasIntent) {
      lastSearchFlyIntent.current = "";
      return;
    }
    if (filtered.length === 0) return;

    const intent = `${culture}|${q.toLowerCase()}`;
    // Same search — user is exploring; do not re-fly on pan or catalog churn.
    if (lastSearchFlyIntent.current === intent) return;

    if (skipSearchFlyTo.current) {
      skipSearchFlyTo.current = false;
      lastSearchFlyIntent.current = intent;
      return;
    }

    lastSearchFlyIntent.current = intent;
    suppressAutoLocationFit.current = true;
    const current = regionRef.current;

    if (q.length > 0) {
      const ranked = [...filtered].sort((a, b) => {
        const sa = scoreCommunityQuery(a, q);
        const sb = scoreCommunityQuery(b, q);
        if (sb !== sa) return sb - sa;
        const da =
          (a.latitude - current.latitude) ** 2 +
          (a.longitude - current.longitude) ** 2;
        const db =
          (b.latitude - current.latitude) ** 2 +
          (b.longitude - current.longitude) ** 2;
        return da - db;
      });
      const best = ranked[0]!;
      const bestScore = scoreCommunityQuery(best, q);
      if (isCommunityInRegion(best, current) && current.latitudeDelta <= 0.35) {
        setFocusedCommunityId(best.id);
        return;
      }

      const METRO_SPAN_DEG = 0.45;
      const minScore = Math.max(bestScore - 150, 200);
      const localCluster = ranked.filter((c) => {
        const dLat = Math.abs(c.latitude - best.latitude);
        const dLng = Math.abs(c.longitude - best.longitude);
        return (
          dLat <= METRO_SPAN_DEG &&
          dLng <= METRO_SPAN_DEG &&
          scoreCommunityQuery(c, q) >= minScore
        );
      });
      const target = localCluster.length > 0 ? localCluster : [best];
      moveCamera(() => mapRef.current?.fitToCommunities(target));
      setFocusedCommunityId(best.id);
      return;
    }

    // Culture-only: fly only when nothing matching is in view.
    const anyVisible = filtered.some((c) => isCommunityInRegion(c, current));
    if (anyVisible) return;

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

    moveCamera(() =>
      mapRef.current?.fitToCommunities(
        localCluster.length > 0 ? localCluster : [nearest.c],
      ),
    );
  }, [filteredKey, query, culture, filtered, layer, moveCamera, resultsOpen]);

  // Restaurants layer: fetch for viewport, or one community when expanded.
  // Always fetch the unfiltered set and filter culture/ethnicity client-side
  // so the chip row keeps every option while one is selected.
  useEffect(() => {
    if (layer !== "restaurants") return;
    const gen = ++foodFetchGen.current;
    const handle = setTimeout(() => {
      const current = regionRef.current;
      const communityId = foodCommunityFilter?.id;
      const radiusMeters = communityId
        ? Math.max(radiusMetersForRegion(current), 8000)
        : radiusMetersForRegion(current);
      setFoodLoading(true);
      fetchPoisNear({
        near: { lat: current.latitude, lng: current.longitude },
        radiusMeters,
        communityId,
        limit: communityId ? 200 : 100,
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
  }, [layer, region, foodCommunityFilter?.id]);

  useEffect(() => {
    setActiveIndex(0);
    selectedIdRef.current = null;
    setFocusRestaurantId(null);
    // Leave community focus while typing — the search fly-to effect sets the best match.
    if (!query.trim() || layer !== "enclaves") {
      setFocusedCommunityId(null);
    }
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
      const { region, granted } = await resolveMapRegion({
        requestPermission: true,
        forceGps: true,
      });
      if (!granted) {
        Alert.alert(
          "Location needed",
          "Allow location access to jump back to where you are on the map.",
        );
        return;
      }
      // Explicit locate — resume auto-fit for future profile location changes.
      suppressAutoLocationFit.current = false;
      lastSearchFlyIntent.current = "";
      const key = mapLocationKey("gps", region.latitude, region.longitude);
      appliedLocationKey.current = key;
      fittedLocationKey.current = key;
      regionRef.current = region;
      setRegion(region);
      const metro = communitiesNear(
        communities,
        region.latitude,
        region.longitude,
      );
      if (metro.length > 0) {
        moveCamera(() => mapRef.current?.fitToCommunities(metro));
      } else {
        moveCamera(() =>
          mapRef.current?.animateToCoordinate(
            region.latitude,
            region.longitude,
            {
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            },
          ),
        );
      }
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

  // Same global API results as Home — don't limit to cards mode (list was
  // client-filtering only and missed culture matches like Somerville × brazil).
  const showSearchPanel = resultsOpen && query.trim().length > 0;
  const showCommunityDetail =
    mode === "cards" &&
    layer === "enclaves" &&
    focusedCommunityId != null &&
    !showSearchPanel;
  const showRestaurantCarousel =
    mode === "cards" && layer === "restaurants" && !showSearchPanel;
  // Same header chip on map cards and list — scoped restaurant filter.
  const showFoodCommunityFilter =
    layer === "restaurants" && foodCommunityFilter != null && !showSearchPanel;
  // Same header chips on map and list so the active filter stays visible.
  // Community scope uses ethnicity chips instead of culture groups.
  const showCultureChips =
    !showCommunityDetail &&
    !showSearchPanel &&
    !foodCommunityFilter &&
    cultureFilters.some((f) => f.id !== "all");
  const showCommunityEthnicityChips =
    !!foodCommunityFilter &&
    communityEthnicityOptions.length > 0 &&
    !showSearchPanel;

  const handleSearchResultPress = (item: SearchResult) => {
    Keyboard.dismiss();
    if (
      (item.kind === "restaurant" || item.kind === "dish") &&
      item.restaurantId
    ) {
      setResultsOpen(false);
      navigation.navigate("RestaurantDetail", {
        restaurantId: item.restaurantId,
      });
      return;
    }
    if (!item.communityId) return;
    const target = communities.find((c) => c.id === item.communityId);
    suppressAutoLocationFit.current = true;
    setResultsOpen(false);
    setFocusedCommunityId(item.communityId);
    setLayer("enclaves");
    if (target) {
      skipSearchFlyTo.current = true;
      lastSearchFlyIntent.current = `all|${query.trim().toLowerCase()}`;
      moveCamera(() =>
        mapRef.current?.animateToCoordinate(target.latitude, target.longitude, {
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }),
      );
    }
  };

  const selectedMapId =
    layer === "enclaves"
      ? focusedCommunityId
      : (carouselItems[activeIndex]?.id ?? null);

  const showMapControls =
    !showCommunityDetail && mode !== "list" && !showSearchPanel;
  const topFilterRows =
    (showFoodCommunityFilter ? 1 : 0) +
    (showCommunityEthnicityChips || showCultureChips ? 1 : 0);
  // Sit the list sheet under search / layer / filter chips (no overlap).
  const listSheetTop =
    insets.top + (topFilterRows > 0 ? 132 + topFilterRows * 44 : 132);
  const locateOffset = restaurantSheetExpanded
    ? { top: listSheetTop }
    : showRestaurantCarousel
      ? { bottom: 250 + Math.max(insets.bottom, 6) }
      : { bottom: 24 + Math.max(insets.bottom, 6) };

  const zoomOffset =
    "bottom" in locateOffset
      ? { bottom: (locateOffset.bottom as number) + 56 }
      : { top: (locateOffset.top as number) + 56 };

  const zoomIn = () => mapRef.current?.zoomBy(0.55);
  const zoomOut = () => mapRef.current?.zoomBy(1.8);

  if (loading || !bootRegion) {
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
        initialRegion={bootRegion}
        filterKey={`${layer}|${culture}|${query.trim().toLowerCase()}`}
        selectedId={selectedMapId}
        onMarkerPress={scrollToItem}
        onRestaurantPress={scrollToItem}
        onRegionChangeComplete={(next) => {
          regionRef.current = next;
          setRegion(next);
          // User pan/zoom — keep this place; don't snap back to GPS later.
          if (ignoreNextRegionCommit.current) {
            ignoreNextRegionCommit.current = false;
            return;
          }
          suppressAutoLocationFit.current = true;
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
              key={`map-search-${searchFocusKey}`}
              value={query}
              autoFocus={searchAutoFocus}
              placeholder="Search communities, dishes…"
              onFocus={() => {
                if (query.trim()) setResultsOpen(true);
              }}
              onChangeText={(text) => {
                if (searchAutoFocus) setSearchAutoFocus(false);
                setQuery(text);
                if (text.trim()) setResultsOpen(true);
                else setResultsOpen(false);
              }}
            />
          </View>
        </View>

        {showSearchPanel ? (
          <View style={styles.searchPanelWrap}>
            <SearchResultsPanel
              results={globalResults}
              loading={globalSearchLoading}
              searchKind={searchKind}
              onChangeKind={setSearchKind}
              onPressResult={handleSearchResultPress}
              maxHeight={SEARCH_PANEL_MAX_HEIGHT}
            />
          </View>
        ) : null}

        {!showSearchPanel ? (
          <View style={styles.layerRow}>
            <View style={styles.layerToggle}>
              <Pressable
                style={[
                  styles.layerBtn,
                  layer === "enclaves" && styles.layerBtnActive,
                ]}
                onPress={() => {
                  setFoodCommunityFilter(null);
                  setFoodEthnicityFilter(null);
                  setLayer("enclaves");
                }}
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
                onPress={() => {
                  setFoodCommunityFilter(null);
                  setFoodEthnicityFilter(null);
                  setLayer("restaurants");
                }}
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
            <Pressable
              style={[
                styles.modeCircle,
                mode === "list" && styles.modeCircleActive,
              ]}
              onPress={() => {
                setFocusedCommunityId(null);
                setResultsOpen(false);
                setMode((m) => (m === "list" ? "cards" : "list"));
              }}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={mode === "list" ? "Show map" : "Show list"}
            >
              {mode === "list" ? (
                <IconMap size={18} color={colors.white} />
              ) : (
                <IconList size={18} color={colors.forest} />
              )}
            </Pressable>
          </View>
        ) : null}

        {showFoodCommunityFilter && foodCommunityFilter ? (
          <View style={styles.communityFilterRow}>
            <Pressable
              style={styles.communityFilterChip}
              onPress={() => {
                setFoodCommunityFilter(null);
                setFoodEthnicityFilter(null);
                setCulture("all");
              }}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${foodCommunityFilter.name} restaurant filter`}
            >
              <Text style={styles.communityFilterText} numberOfLines={1}>
                {foodCommunityFilter.name}
              </Text>
              <IconX size={14} color={colors.forest} />
            </Pressable>
          </View>
        ) : null}

        {showCommunityEthnicityChips ? (
          <View style={styles.topFiltersRow}>
            <View style={styles.topFiltersPinned}>
              <Chip
                label="All"
                size="sm"
                tone="overlay"
                selected={foodEthnicityFilter == null}
                onPress={() => setFoodEthnicityFilter(null)}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topFilters}
              keyboardShouldPersistTaps="handled"
              style={styles.topFiltersScroll}
            >
              {communityEthnicityOptions.map((id) => (
                <Chip
                  key={id}
                  label={ethnicityChipLabel(id)}
                  size="sm"
                  tone="overlay"
                  selected={foodEthnicityFilter === id}
                  onPress={() => setFoodEthnicityFilter(id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {showCultureChips ? (
          <View style={styles.topFiltersRow}>
            <View style={styles.topFiltersPinned}>
              <Chip
                label="All"
                size="sm"
                tone="overlay"
                selected={culture === "all"}
                onPress={() => setCulture("all")}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topFilters}
              keyboardShouldPersistTaps="handled"
              style={styles.topFiltersScroll}
            >
              {cultureFilters
                .filter((f) => f.id !== "all")
                .map((f) => (
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
          </View>
        ) : null}
      </SafeAreaView>

      {showMapControls ? (
        <>
          <View
            style={[styles.sideControls, zoomOffset]}
            pointerEvents="box-none"
          >
            <View style={styles.zoomStack}>
              <Pressable
                style={styles.zoomBtn}
                onPress={zoomIn}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Zoom in"
              >
                <IconPlus size={18} color={colors.forest} />
              </Pressable>
              <View style={styles.zoomDivider} />
              <Pressable
                style={styles.zoomBtn}
                onPress={zoomOut}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Zoom out"
              >
                <IconMinus size={18} color={colors.forest} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.locateBtn, locateOffset]}
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
        </>
      ) : null}

      {showCommunityDetail && focusedCommunityId ? (
        <CommunityDetailSheet
          communityId={focusedCommunityId}
          onClose={() => {
            // Leave exploration open: drop the search filter so nearby
            // communities aren't hidden behind the query that opened this sheet.
            setFocusedCommunityId(null);
            selectedIdRef.current = null;
            setQuery("");
            setResultsOpen(false);
            setGlobalResults([]);
            setSearchKind("all");
          }}
          onReadMore={openCommunity}
          onRestaurantPress={openRestaurant}
          onExpandRestaurants={({
            communityId,
            communityName,
            centroid,
            restaurantCoords,
          }) => {
            setFocusedCommunityId(null);
            selectedIdRef.current = null;
            setQuery("");
            setResultsOpen(false);
            setGlobalResults([]);
            setSearchKind("all");
            setCulture("all");
            setFoodEthnicityFilter(null);
            setFoodCommunityFilter({ id: communityId, name: communityName });
            setMode("cards");
            setLayer("restaurants");
            // Zoom into this enclave's restaurants (same frame as the mini-map).
            suppressAutoLocationFit.current = true;
            skipSearchFlyTo.current = true;
            moveCamera(() => {
              if (restaurantCoords.length > 0) {
                mapRef.current?.fitToRestaurants(
                  restaurantCoords.map((c, i) => ({
                    id: `expand-${i}`,
                    name: "",
                    latitude: c.latitude,
                    longitude: c.longitude,
                  })),
                );
                return;
              }
              mapRef.current?.animateToCoordinate(
                centroid.latitude,
                centroid.longitude,
                { latitudeDelta: 0.018, longitudeDelta: 0.018 },
              );
            });
          }}
        />
      ) : null}

      {showRestaurantCarousel ? (
        <View
          style={[
            styles.sheet,
            restaurantSheetExpanded && styles.sheetExpanded,
            restaurantSheetExpanded && {
              top: RESTAURANT_SHEET_EXPANDED_TOP,
            },
            { paddingBottom: Math.max(insets.bottom, 6) },
          ]}
          pointerEvents="box-none"
        >
          <View
            {...restaurantSheetPan.panHandlers}
            style={styles.sheetDragZone}
          >
            <Pressable
              onPress={() => setRestaurantSheetExpanded((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                restaurantSheetExpanded
                  ? "Collapse restaurant list"
                  : "Expand restaurant list"
              }
            >
              <View style={styles.sheetGrabber} />
            </Pressable>
            {restaurantSheetExpanded ? (
              <View style={styles.sheetHeaderCompact}>
                <View>
                  <Text style={styles.sheetTitle}>Restaurants nearby</Text>
                  <Text style={styles.sheetSub}>{filterLabel}</Text>
                </View>
                <Pressable
                  style={styles.closeListBtn}
                  onPress={() => setRestaurantSheetExpanded(false)}
                  hitSlop={8}
                >
                  <IconX size={18} color={colors.ink} />
                </Pressable>
              </View>
            ) : null}
          </View>
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
          ) : restaurantSheetExpanded ? (
            <FlatList
              data={restaurantListFood}
              keyExtractor={(item) => item.id}
              style={styles.listFlex}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.restaurantListContent}
              renderItem={({ item }) => {
                const rating =
                  item.rating != null && Number.isFinite(item.rating)
                    ? `★ ${item.rating.toFixed(1)}`
                    : null;
                const subtitle = [
                  item.category,
                  item.priceLevel,
                  rating,
                  formatDistanceMeters(item.distanceMeters),
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <ListRow
                    leading={
                      <FavoriteThumb
                        kind="restaurant"
                        imageUrl={item.imageUrl}
                        countryCode={primaryEthnicityCountryCode(
                          item.ethnicities,
                        )}
                        flag={primaryEthnicityEmoji(item.ethnicities)}
                      />
                    }
                    title={item.name}
                    subtitle={subtitle}
                    onPress={() => openRestaurant(item.id)}
                    rightElement={
                      <FavoriteHeart
                        type="restaurant"
                        targetId={item.id}
                        size={18}
                      />
                    }
                  />
                );
              }}
            />
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
                    favoriteType="restaurant"
                    favoriteId={item.id}
                    onPress={() => openRestaurant(item.id)}
                  />
                );
              }}
            />
          )}
        </View>
      ) : null}

      {mode === "list" && !showSearchPanel ? (
        <View style={[styles.listSheet, { top: listSheetTop }]}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>
                {layer === "enclaves"
                  ? "Communities on the map"
                  : foodCommunityFilter
                    ? foodCommunityFilter.name
                    : "Restaurants nearby"}
              </Text>
              <Text style={styles.sheetSub}>
                {layer === "restaurants" && foodCommunityFilter
                  ? `${filteredFood.length} restaurant${filteredFood.length === 1 ? "" : "s"} in this community`
                  : filterLabel}
              </Text>
            </View>
            <Pressable
              style={styles.closeListBtn}
              onPress={() => setMode("cards")}
              hitSlop={8}
            >
              <IconX size={18} color={colors.ink} />
            </Pressable>
          </View>
          <View style={styles.listBody}>
            {layer === "enclaves" ? (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                style={styles.listFlex}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptySub}>
                    No communities match these filters.
                  </Text>
                }
                renderItem={({ item }) => (
                  <ListRow
                    leading={
                      <CircularFlag
                        countryCode={getCommunityCountryCode(item.id)}
                        flag={getCommunityFlag(item.id, item.emoji)}
                        size={40}
                      />
                    }
                    title={item.name}
                    subtitle={`${item.neighborhood} · ${getAffinityLabels(item).join(" · ") || item.heritage}`}
                    onPress={() => openCommunity(item.id)}
                    rightElement={
                      <FavoriteHeart
                        type="community"
                        targetId={item.id}
                        size={18}
                      />
                    }
                  />
                )}
              />
            ) : (
              <FlatList
                data={filteredFood}
                keyExtractor={(item) => item.id}
                style={styles.listFlex}
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
                    leading={
                      <FavoriteThumb
                        kind="restaurant"
                        imageUrl={item.imageUrl}
                        countryCode={primaryEthnicityCountryCode(
                          item.ethnicities,
                        )}
                        flag={primaryEthnicityEmoji(item.ethnicities)}
                      />
                    }
                    title={item.name}
                    subtitle={[item.category, item.priceLevel]
                      .filter(Boolean)
                      .join(" · ")}
                    onPress={() => openRestaurant(item.id)}
                    rightElement={
                      <FavoriteHeart
                        type="restaurant"
                        targetId={item.id}
                        size={18}
                      />
                    }
                  />
                )}
              />
            )}
          </View>
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
    backgroundColor: "rgba(248, 247, 244, 0.98)",
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
  layerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  layerToggle: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 2,
  },
  modeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeCircleActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
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
  communityFilterRow: {
    marginTop: 10,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  communityFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.forest,
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 10,
  },
  communityFilterText: {
    flexShrink: 1,
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    color: colors.forest,
  },
  topFiltersRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
  topFiltersPinned: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  topFiltersScroll: {
    flex: 1,
  },
  topFilters: {
    paddingRight: 16,
    gap: 6,
    alignItems: "center",
  },
  searchPanelWrap: {
    marginTop: 10,
    marginHorizontal: 16,
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
  sideControls: {
    position: "absolute",
    right: 16,
    zIndex: 25,
    elevation: 25,
    alignItems: "center",
    gap: 10,
  },
  zoomStack: {
    width: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D6D3CC",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D6D3CC",
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
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },
  sheetExpanded: {
    zIndex: 30,
    elevation: 30,
    paddingHorizontal: 20,
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  sheetDragZone: {
    paddingTop: 6,
    paddingBottom: 8,
  },
  sheetGrabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  sheetHeaderCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  restaurantListContent: {
    paddingBottom: 16,
  },
  sheetFilters: {
    paddingHorizontal: 20,
    gap: 6,
    paddingVertical: 4,
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
    zIndex: 15,
    elevation: 15,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    overflow: "hidden",
  },
  listBody: {
    flex: 1,
    minHeight: 0,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  listFiltersScroll: {
    marginHorizontal: -20,
    marginBottom: 8,
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 40,
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
    paddingBottom: 32,
    flexGrow: 1,
  },
  listFlex: {
    flex: 1,
  },
});
