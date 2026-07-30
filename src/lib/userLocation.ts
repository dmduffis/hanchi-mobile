import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import type { Region } from "react-native-maps";

import { NYC_REGION } from "../data/mapDefaults";

const LAST_REGION_KEY = "sinta.lastMapRegion";

export type MapBootRegion = Region;

/** City-scale zoom when centering on the user. */
const USER_DELTAS = {
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
} as const;

export function regionFromCoordinate(
  latitude: number,
  longitude: number,
  deltas: { latitudeDelta?: number; longitudeDelta?: number } = USER_DELTAS,
): MapBootRegion {
  return {
    latitude,
    longitude,
    latitudeDelta: deltas.latitudeDelta ?? USER_DELTAS.latitudeDelta,
    longitudeDelta: deltas.longitudeDelta ?? USER_DELTAS.longitudeDelta,
  };
}

/** Haversine distance in meters (good enough for metro framing). */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** ~50 miles — wide enough to keep Anaheim OC in frame with LA proper. */
export const METRO_FIT_RADIUS_METERS = 80_000;

export async function getSavedMapRegion(): Promise<MapBootRegion | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_REGION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MapBootRegion>;
    if (
      !Number.isFinite(parsed.latitude) ||
      !Number.isFinite(parsed.longitude) ||
      !Number.isFinite(parsed.latitudeDelta) ||
      !Number.isFinite(parsed.longitudeDelta)
    ) {
      return null;
    }
    return {
      latitude: parsed.latitude as number,
      longitude: parsed.longitude as number,
      latitudeDelta: parsed.latitudeDelta as number,
      longitudeDelta: parsed.longitudeDelta as number,
    };
  } catch {
    return null;
  }
}

export async function saveMapRegion(region: MapBootRegion): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_REGION_KEY, JSON.stringify(region));
  } catch {
    // ignore storage failures
  }
}

/**
 * Resolve where the map should open.
 * Uses GPS when permission is granted; falls back to NYC for diversity of communities.
 */
export async function resolveMapRegion(opts?: {
  /** When true, prompt the system permission dialog if not yet decided. */
  requestPermission?: boolean;
}): Promise<{ region: MapBootRegion; granted: boolean }> {
  let granted = false;
  try {
    const permission = opts?.requestPermission
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();

    granted = permission.status === "granted";
    if (!granted) {
      const saved = await getSavedMapRegion();
      return { region: saved ?? NYC_REGION, granted: false };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const region = regionFromCoordinate(
      position.coords.latitude,
      position.coords.longitude,
    );
    await saveMapRegion(region);
    return { region, granted: true };
  } catch {
    const saved = await getSavedMapRegion();
    return { region: saved ?? NYC_REGION, granted };
  }
}
