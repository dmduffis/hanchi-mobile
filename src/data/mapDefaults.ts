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

/** Curated metros with food-rich enclaves on Hanchi today. */
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
  {
    id: "houston",
    label: "Greater Houston",
    region: {
      latitude: 29.72,
      longitude: -95.5,
      latitudeDelta: 0.55,
      longitudeDelta: 0.55,
    },
  },
  {
    id: "seattle",
    label: "Seattle / Eastside",
    region: {
      latitude: 47.55,
      longitude: -122.25,
      latitudeDelta: 0.45,
      longitudeDelta: 0.45,
    },
  },
  {
    id: "boston",
    label: "Greater Boston",
    region: {
      latitude: 42.35,
      longitude: -71.08,
      latitudeDelta: 0.35,
      longitudeDelta: 0.35,
    },
  },
  {
    id: "dc",
    label: "Washington, D.C.",
    region: {
      latitude: 38.9,
      longitude: -77.08,
      latitudeDelta: 0.4,
      longitudeDelta: 0.4,
    },
  },
  {
    id: "dallas",
    label: "Dallas–Fort Worth",
    region: {
      latitude: 32.9,
      longitude: -96.85,
      latitudeDelta: 0.55,
      longitudeDelta: 0.55,
    },
  },
  {
    id: "connecticut",
    label: "Connecticut",
    region: {
      latitude: 41.35,
      longitude: -72.95,
      latitudeDelta: 0.75,
      longitudeDelta: 0.9,
    },
  },
  {
    id: "miami",
    label: "Greater Miami",
    region: {
      latitude: 26.05,
      longitude: -80.25,
      latitudeDelta: 0.7,
      longitudeDelta: 0.55,
    },
  },
  {
    id: "orlando",
    label: "Greater Orlando",
    region: {
      latitude: 28.48,
      longitude: -81.42,
      latitudeDelta: 0.55,
      longitudeDelta: 0.55,
    },
  },
  {
    id: "tampa",
    label: "Tampa Bay",
    region: {
      latitude: 28.05,
      longitude: -82.55,
      latitudeDelta: 0.55,
      longitudeDelta: 0.55,
    },
  },
  {
    id: "jacksonville",
    label: "Jacksonville",
    region: {
      latitude: 30.22,
      longitude: -81.57,
      latitudeDelta: 0.35,
      longitudeDelta: 0.35,
    },
  },
  {
    id: "minnesota",
    label: "Twin Cities",
    region: {
      latitude: 44.97,
      longitude: -93.2,
      latitudeDelta: 0.35,
      longitudeDelta: 0.4,
    },
  },
];
