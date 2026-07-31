import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import type { Region } from "react-native-maps";

import { METRO_PRESETS, NYC_REGION } from "../data/mapDefaults";

const LAST_REGION_KEY = "sinta.lastMapRegion";
const LOCATION_MODE_KEY = "sinta.mapLocationMode";
const LOCATION_LABEL_KEY = "sinta.mapLocationLabel";

export type MapBootRegion = Region;
export type MapLocationMode = "gps" | "manual";

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

export async function getMapLocationMode(): Promise<MapLocationMode> {
  try {
    const value = await AsyncStorage.getItem(LOCATION_MODE_KEY);
    return value === "manual" ? "manual" : "gps";
  } catch {
    return "gps";
  }
}

async function setMapLocationMode(mode: MapLocationMode): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

export async function getMapLocationLabel(): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(LOCATION_LABEL_KEY)) ?? null;
  } catch {
    return null;
  }
}

async function setMapLocationLabel(label: string | null): Promise<void> {
  try {
    if (label) await AsyncStorage.setItem(LOCATION_LABEL_KEY, label);
    else await AsyncStorage.removeItem(LOCATION_LABEL_KEY);
  } catch {
    // ignore
  }
}

function nearestMetroLabel(region: MapBootRegion): string | null {
  let best: { label: string; meters: number } | null = null;
  for (const metro of METRO_PRESETS) {
    const meters = distanceMeters(
      region.latitude,
      region.longitude,
      metro.region.latitude,
      metro.region.longitude,
    );
    if (!best || meters < best.meters) {
      best = { label: metro.label, meters };
    }
  }
  // Within ~40 mi of a curated metro → use that name.
  if (best && best.meters <= 65_000) return best.label;
  return null;
}

async function labelForRegion(region: MapBootRegion): Promise<string> {
  const metro = nearestMetroLabel(region);
  if (metro) return metro;
  try {
    const places = await Location.reverseGeocodeAsync({
      latitude: region.latitude,
      longitude: region.longitude,
    });
    const place = places[0];
    if (place) {
      const city =
        place.city || place.subregion || place.district || place.region;
      if (city) return city;
    }
  } catch {
    // ignore reverse-geocode failures
  }
  return "Custom location";
}

export type SavedLocationInfo = {
  region: MapBootRegion;
  mode: MapLocationMode;
  label: string;
};

/** Current profile/map location for display. */
export async function getSavedLocationInfo(): Promise<SavedLocationInfo> {
  const mode = await getMapLocationMode();
  const saved = await getSavedMapRegion();
  const region = saved ?? NYC_REGION;
  const storedLabel = await getMapLocationLabel();
  const label =
    storedLabel ??
    (saved ? await labelForRegion(saved) : "New York") ??
    "New York";
  return { region, mode, label };
}

/** Pin the map to a curated metro (manual override). */
export async function setManualMapRegion(
  region: MapBootRegion,
  label: string,
): Promise<SavedLocationInfo> {
  await saveMapRegion(region);
  await setMapLocationMode("manual");
  await setMapLocationLabel(label);
  return { region, mode: "manual", label };
}

/**
 * Resolve where the map should open.
 * Manual profile picks win until the user chooses GPS again.
 */
export async function resolveMapRegion(opts?: {
  /** When true, prompt the system permission dialog if not yet decided. */
  requestPermission?: boolean;
  /** Force GPS and clear any manual metro override. */
  forceGps?: boolean;
}): Promise<{ region: MapBootRegion; granted: boolean; label?: string }> {
  if (!opts?.forceGps) {
    const mode = await getMapLocationMode();
    if (mode === "manual") {
      const saved = await getSavedMapRegion();
      if (saved) {
        const label =
          (await getMapLocationLabel()) ?? (await labelForRegion(saved));
        return { region: saved, granted: false, label };
      }
    }
  }

  let granted = false;
  try {
    const permission = opts?.requestPermission || opts?.forceGps
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();

    granted = permission.status === "granted";
    if (!granted) {
      const saved = await getSavedMapRegion();
      return {
        region: saved ?? NYC_REGION,
        granted: false,
        label: (await getMapLocationLabel()) ?? undefined,
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const region = regionFromCoordinate(
      position.coords.latitude,
      position.coords.longitude,
    );
    await saveMapRegion(region);
    await setMapLocationMode("gps");
    const label = await labelForRegion(region);
    await setMapLocationLabel(label);
    return { region, granted: true, label };
  } catch {
    const saved = await getSavedMapRegion();
    return {
      region: saved ?? NYC_REGION,
      granted,
      label: (await getMapLocationLabel()) ?? undefined,
    };
  }
}
