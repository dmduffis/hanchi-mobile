import type { Region } from "react-native-maps";

/** Fallback when location is denied/unavailable — dense, diverse community coverage. */
export const NYC_REGION: Region = {
  latitude: 40.72,
  longitude: -73.95,
  latitudeDelta: 0.28,
  longitudeDelta: 0.28,
};

export type MetroPreset = {
  id: string;
  label: string;
  region: Region;
};

/** Curated metros with food-rich enclaves on Sinta today. */
export const METRO_PRESETS: MetroPreset[] = [
  {
    id: "nyc",
    label: "New York",
    region: NYC_REGION,
  },
  {
    id: "la",
    label: "Los Angeles / OC",
    region: {
      latitude: 34.02,
      longitude: -118.2,
      latitudeDelta: 0.55,
      longitudeDelta: 0.55,
    },
  },
  {
    id: "sf",
    label: "San Francisco",
    region: {
      latitude: 37.77,
      longitude: -122.42,
      latitudeDelta: 0.22,
      longitudeDelta: 0.22,
    },
  },
  {
    id: "detroit",
    label: "Metro Detroit",
    region: {
      latitude: 42.35,
      longitude: -83.1,
      latitudeDelta: 0.35,
      longitudeDelta: 0.35,
    },
  },
  {
    id: "chicago",
    label: "Greater Chicago",
    region: {
      latitude: 41.85,
      longitude: -87.75,
      latitudeDelta: 0.55,
      longitudeDelta: 0.55,
    },
  },
];
