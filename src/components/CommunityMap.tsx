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

    // Parent passes in-view restaurants; render them all (keep selection if off-edge).
    const restaurantMarkers = useMemo(() => {
      if (!selectedId) return restaurants;
      if (restaurants.some((r) => r.id === selectedId)) return restaurants;
      const selected = restaurants.find((r) => r.id === selectedId);
      return selected ? [...restaurants, selected] : restaurants;
    }, [restaurants, selectedId]);

    const handleRegionChangeComplete = (next: MapRegion) => {
      setRegion(next);
      onRegionChangeComplete?.(next);
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
          : restaurantMarkers.map((r) => (
              <RestaurantFlagMarker
                key={r.id}
                restaurant={r}
                selected={r.id === selectedId}
                refreshToken={filterKey}
                onPress={onRestaurantPress}
              />
            ))}
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
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={(e) => {
        e.stopPropagation?.();
        onPress?.(community.id);
      }}
    >
      <View style={styles.markerWrap} collapsable={false} pointerEvents="none">
        <CircularFlag
          countryCode={countryCode}
          flag={flag}
          size={selected ? 40 : 34}
          selected={selected}
          elevated
        />
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
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={(e) => {
        e.stopPropagation?.();
        onPress?.(restaurant.id);
      }}
    >
      <View style={styles.markerWrap} collapsable={false} pointerEvents="none">
        <CircularFlag
          countryCode={countryCode}
          flag={flag}
          size={selected ? 24 : 20}
          selected={selected}
          elevated
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
