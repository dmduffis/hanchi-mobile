import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  type Region,
} from "react-native-maps";

import {
  getCommunityCountryCode,
  getCommunityFlag,
} from "../data/communityFlags";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import { colors, typography } from "../theme";
import type { Community } from "../types";
import { CircularFlag } from "./CircularFlag";
import { MapFlagPin } from "./MapFlagPin";

export type MapRegion = Region;

export type MapRestaurant = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  ethnicities?: string[];
};

export type CommunityMapHandle = {
  fitToCommunities: (list: Community[]) => void;
  fitToRestaurants: (list: MapRestaurant[]) => void;
  animateToCoordinate: (
    latitude: number,
    longitude: number,
    deltas?: { latitudeDelta?: number; longitudeDelta?: number },
  ) => void;
};

export type MapLayer = "enclaves" | "restaurants";

type CommunityMapProps = {
  layer?: MapLayer;
  communities: Community[];
  restaurants?: MapRestaurant[];
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  onMarkerPress?: (communityId: string) => void;
  onRestaurantPress?: (restaurantId: string) => void;
  /** When filters change, refresh custom marker bitmaps without remounting the map */
  filterKey?: string;
  selectedId?: string | null;
  /** Fires when the user finishes panning/zooming — use to filter carousel to viewport. */
  onRegionChangeComplete?: (region: MapRegion) => void;
};

/** Landing view stays on NYC; other metros are on the map but off-screen until you pan. */
export const NYC_REGION: MapRegion = {
  latitude: 40.72,
  longitude: -73.95,
  latitudeDelta: 0.28,
  longitudeDelta: 0.28,
};

/** True if a lat/lng falls inside the map region (with light padding). */
export function isCoordInRegion(
  latitude: number,
  longitude: number,
  region: MapRegion,
  padFraction = 0.12,
): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  const latPad = region.latitudeDelta * padFraction;
  const lngPad = region.longitudeDelta * padFraction;
  const minLat = region.latitude - region.latitudeDelta / 2 - latPad;
  const maxLat = region.latitude + region.latitudeDelta / 2 + latPad;
  const minLng = region.longitude - region.longitudeDelta / 2 - lngPad;
  const maxLng = region.longitude + region.longitudeDelta / 2 + lngPad;
  return (
    latitude >= minLat &&
    latitude <= maxLat &&
    longitude >= minLng &&
    longitude <= maxLng
  );
}

/** True if a community pin falls inside the map region (with light padding). */
export function isCommunityInRegion(
  community: Community,
  region: MapRegion,
  padFraction = 0.12,
): boolean {
  return isCoordInRegion(
    community.latitude,
    community.longitude,
    region,
    padFraction,
  );
}

/** Approximate search radius (meters) covering the visible map region. */
export function radiusMetersForRegion(region: MapRegion): number {
  const latRad = (region.latitude * Math.PI) / 180;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos(latRad);
  const halfH = (region.latitudeDelta / 2) * metersPerDegLat;
  const halfW = (region.longitudeDelta / 2) * metersPerDegLng;
  const diagonal = Math.sqrt(halfH * halfH + halfW * halfW);
  return Math.min(Math.max(Math.round(diagonal * 1.15), 800), 40_000);
}

/** Max individual restaurant pins when zoomed in. */
const MAX_SOLO_PINS = 30;
/** Below this latitudeDelta, prefer individual pins (still capped). */
const SOLO_LAT_DELTA = 0.05;

type RestaurantMapItem =
  | { kind: "pin"; restaurant: MapRestaurant }
  | {
      kind: "cluster";
      id: string;
      latitude: number;
      longitude: number;
      count: number;
      members: MapRestaurant[];
    };

function distToCenterSq(r: MapRestaurant, region: MapRegion): number {
  const dLat = r.latitude - region.latitude;
  const dLng = r.longitude - region.longitude;
  return dLat * dLat + dLng * dLng;
}

/**
 * Zoom-aware restaurant markers: grid clusters when zoomed out,
 * capped individual flag pins when zoomed in.
 */
function buildRestaurantMapItems(
  restaurants: MapRestaurant[],
  region: MapRegion,
  selectedId: string | null,
): RestaurantMapItem[] {
  if (restaurants.length === 0) return [];

  const selected = selectedId
    ? restaurants.find((r) => r.id === selectedId)
    : undefined;

  const useSolo =
    region.latitudeDelta <= SOLO_LAT_DELTA || restaurants.length <= 10;

  if (useSolo) {
    const sorted = [...restaurants].sort(
      (a, b) => distToCenterSq(a, region) - distToCenterSq(b, region),
    );
    const capped = sorted.slice(0, MAX_SOLO_PINS);
    if (selected && !capped.some((r) => r.id === selected.id)) {
      capped[capped.length - 1] = selected;
    }
    return capped.map((restaurant) => ({ kind: "pin", restaurant }));
  }

  const cols = Math.max(
    4,
    Math.min(7, Math.round(0.32 / Math.max(region.longitudeDelta, 0.04))),
  );
  const rows = Math.max(
    4,
    Math.min(7, Math.round(0.32 / Math.max(region.latitudeDelta, 0.04))),
  );
  const minLat = region.latitude - region.latitudeDelta / 2;
  const minLng = region.longitude - region.longitudeDelta / 2;
  const cellH = region.latitudeDelta / rows;
  const cellW = region.longitudeDelta / cols;

  const cells = new Map<string, MapRestaurant[]>();
  for (const r of restaurants) {
    const row = Math.min(
      rows - 1,
      Math.max(0, Math.floor((r.latitude - minLat) / cellH)),
    );
    const col = Math.min(
      cols - 1,
      Math.max(0, Math.floor((r.longitude - minLng) / cellW)),
    );
    const key = `${row}:${col}`;
    const list = cells.get(key);
    if (list) list.push(r);
    else cells.set(key, [r]);
  }

  const items: RestaurantMapItem[] = [];
  for (const [key, members] of cells) {
    if (members.length === 1) {
      items.push({ kind: "pin", restaurant: members[0]! });
      continue;
    }

    if (selected && members.some((m) => m.id === selected.id)) {
      items.push({ kind: "pin", restaurant: selected });
      const rest = members.filter((m) => m.id !== selected.id);
      if (rest.length === 1) {
        items.push({ kind: "pin", restaurant: rest[0]! });
      } else if (rest.length > 1) {
        items.push(makeCluster(`c-${key}`, rest));
      }
      continue;
    }

    items.push(makeCluster(`c-${key}`, members));
  }
  return items;
}

function makeCluster(
  id: string,
  members: MapRestaurant[],
): Extract<RestaurantMapItem, { kind: "cluster" }> {
  const latitude =
    members.reduce((sum, m) => sum + m.latitude, 0) / members.length;
  const longitude =
    members.reduce((sum, m) => sum + m.longitude, 0) / members.length;
  return {
    kind: "cluster",
    id,
    latitude,
    longitude,
    count: members.length,
    members,
  };
}

/**
 * Shared map surface. MapView must be an in-flow child with flex/size —
 * absoluteFill inside a flex-only parent collapses to height 0.
 */
export const CommunityMap = forwardRef<CommunityMapHandle, CommunityMapProps>(
  function CommunityMap(
    {
      layer = "enclaves",
      communities,
      restaurants = [],
      style,
      interactive = true,
      onMarkerPress,
      onRestaurantPress,
      filterKey = "all",
      selectedId = null,
      onRegionChangeComplete,
    },
    ref,
  ) {
    const mapRef = useRef<MapView>(null);
    const [region, setRegion] = useState<MapRegion>(NYC_REGION);

    useImperativeHandle(ref, () => ({
      fitToCommunities: (list: Community[]) => {
        const coords = list
          .filter(
            (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude),
          )
          .map((c) => ({
            latitude: c.latitude,
            longitude: c.longitude,
          }));
        if (coords.length === 0) return;
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 56, bottom: 220, left: 56 },
          animated: true,
        });
      },
      fitToRestaurants: (list: MapRestaurant[]) => {
        const coords = list
          .filter(
            (r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude),
          )
          .map((r) => ({
            latitude: r.latitude,
            longitude: r.longitude,
          }));
        if (coords.length === 0) return;
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 56, bottom: 220, left: 56 },
          animated: true,
        });
      },
      animateToCoordinate: (latitude, longitude, deltas) => {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: deltas?.latitudeDelta ?? 0.05,
            longitudeDelta: deltas?.longitudeDelta ?? 0.05,
          },
          450,
        );
      },
    }));

    const visibleCommunities = useMemo(
      () => communities.filter((c) => isCommunityInRegion(c, region)),
      [communities, region],
    );

    const communityMarkers = useMemo(() => {
      if (!selectedId) return visibleCommunities;
      if (visibleCommunities.some((c) => c.id === selectedId)) {
        return visibleCommunities;
      }
      const selected = communities.find((c) => c.id === selectedId);
      return selected ? [...visibleCommunities, selected] : visibleCommunities;
    }, [visibleCommunities, selectedId, communities]);

    // Parent passes in-view restaurants; cluster when zoomed out.
    const restaurantMapItems = useMemo(() => {
      const base = restaurants;
      if (!selectedId) {
        return buildRestaurantMapItems(base, region, null);
      }
      if (base.some((r) => r.id === selectedId)) {
        return buildRestaurantMapItems(base, region, selectedId);
      }
      const selected = restaurants.find((r) => r.id === selectedId);
      const withSelected = selected ? [...base, selected] : base;
      return buildRestaurantMapItems(withSelected, region, selectedId);
    }, [restaurants, selectedId, region]);

    const handleRegionChangeComplete = (next: MapRegion) => {
      setRegion(next);
      onRegionChangeComplete?.(next);
    };

    const zoomToCluster = (members: MapRestaurant[]) => {
      const coords = members.map((m) => ({
        latitude: m.latitude,
        longitude: m.longitude,
      }));
      if (coords.length === 0) return;
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 120, right: 56, bottom: 240, left: 56 },
        animated: true,
      });
    };

    if (Platform.OS === "web") {
      return (
        <MapFallback
          layer={layer}
          communities={communities}
          restaurants={restaurants}
          style={style}
        />
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={[styles.map, style]}
        provider={PROVIDER_DEFAULT}
        initialRegion={NYC_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        toolbarEnabled={false}
        loadingEnabled={false}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {layer === "enclaves"
          ? communityMarkers.map((c) => (
              <FlagMarker
                key={c.id}
                community={c}
                selected={c.id === selectedId}
                refreshToken={filterKey}
                onPress={onMarkerPress}
              />
            ))
          : restaurantMapItems.map((item) =>
              item.kind === "cluster" ? (
                <ClusterMarker
                  key={item.id}
                  cluster={item}
                  refreshToken={filterKey}
                  onPress={() => zoomToCluster(item.members)}
                />
              ) : (
                <RestaurantFlagMarker
                  key={item.restaurant.id}
                  restaurant={item.restaurant}
                  selected={item.restaurant.id === selectedId}
                  refreshToken={filterKey}
                  onPress={onRestaurantPress}
                />
              ),
            )}
      </MapView>
    );
  },
);

function FlagMarker({
  community,
  selected,
  refreshToken,
  onPress,
}: {
  community: Community;
  selected: boolean;
  refreshToken: string;
  onPress?: (communityId: string) => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const flag = getCommunityFlag(community.id, community.emoji);
  const countryCode = getCommunityCountryCode(community.id);

  useEffect(() => {
    setTracksViewChanges(true);
    const id = setTimeout(() => setTracksViewChanges(false), 900);
    return () => clearTimeout(id);
  }, [flag, countryCode, selected, refreshToken]);

  return (
    <Marker
      identifier={community.id}
      coordinate={{
        latitude: community.latitude,
        longitude: community.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      onPress={(e) => {
        e.stopPropagation?.();
        onPress?.(community.id);
      }}
    >
      <View style={styles.markerWrap} collapsable={false} pointerEvents="none">
        <MapFlagPin
          countryCode={countryCode}
          flag={flag}
          size={selected ? 40 : 34}
          selected={selected}
        />
      </View>
    </Marker>
  );
}

function ClusterMarker({
  cluster,
  refreshToken,
  onPress,
}: {
  cluster: Extract<RestaurantMapItem, { kind: "cluster" }>;
  refreshToken: string;
  onPress?: () => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const size = cluster.count >= 40 ? 44 : cluster.count >= 15 ? 38 : 32;

  useEffect(() => {
    setTracksViewChanges(true);
    const id = setTimeout(() => setTracksViewChanges(false), 700);
    return () => clearTimeout(id);
  }, [cluster.count, refreshToken, size]);

  return (
    <Marker
      identifier={cluster.id}
      coordinate={{
        latitude: cluster.latitude,
        longitude: cluster.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={(e) => {
        e.stopPropagation?.();
        onPress?.();
      }}
    >
      <View
        style={[
          styles.cluster,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        collapsable={false}
        pointerEvents="none"
      >
        <Text style={styles.clusterText}>{cluster.count}</Text>
      </View>
    </Marker>
  );
}

function RestaurantFlagMarker({
  restaurant,
  selected,
  refreshToken,
  onPress,
}: {
  restaurant: MapRestaurant;
  selected: boolean;
  refreshToken: string;
  onPress?: (restaurantId: string) => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const flag = primaryEthnicityEmoji(restaurant.ethnicities);
  const countryCode = primaryEthnicityCountryCode(restaurant.ethnicities);

  useEffect(() => {
    setTracksViewChanges(true);
    const id = setTimeout(() => setTracksViewChanges(false), 900);
    return () => clearTimeout(id);
  }, [flag, countryCode, selected, refreshToken]);

  return (
    <Marker
      identifier={restaurant.id}
      coordinate={{
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      onPress={(e) => {
        e.stopPropagation?.();
        onPress?.(restaurant.id);
      }}
    >
      <View style={styles.markerWrap} collapsable={false} pointerEvents="none">
        <MapFlagPin
          countryCode={countryCode}
          flag={flag}
          size={selected ? 24 : 20}
          selected={selected}
        />
      </View>
    </Marker>
  );
}

function MapFallback({
  layer,
  communities,
  restaurants,
  style,
}: {
  layer: MapLayer;
  communities: Community[];
  restaurants: MapRestaurant[];
  style?: StyleProp<ViewStyle>;
}) {
  const count = layer === "enclaves" ? communities.length : restaurants.length;
  const label = layer === "enclaves" ? "communities" : "restaurants";
  return (
    <View style={[styles.fallback, style]}>
      <Text style={styles.fallbackLabel}>Map preview</Text>
      <Text style={styles.fallbackSub}>
        {count} {label} around NYC
      </Text>
      <View style={styles.pinRow}>
        {layer === "enclaves"
          ? communities
              .slice(0, 6)
              .map((c) => (
                <CircularFlag
                  key={c.id}
                  countryCode={getCommunityCountryCode(c.id)}
                  flag={getCommunityFlag(c.id, c.emoji)}
                  size={32}
                  elevated
                />
              ))
          : restaurants
              .slice(0, 6)
              .map((r) => (
                <CircularFlag
                  key={r.id}
                  countryCode={primaryEthnicityCountryCode(r.ethnicities)}
                  flag={primaryEthnicityEmoji(r.ethnicities)}
                  size={32}
                  elevated
                />
              ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  cluster: {
    backgroundColor: colors.forest,
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  clusterText: {
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    color: colors.white,
  },
  fallback: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  fallbackLabel: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.white,
  },
  fallbackSub: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.grayLight,
    marginTop: 6,
  },
  pinRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
  },
});
