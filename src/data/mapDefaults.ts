import type { Region } from "react-native-maps";

/** Fallback when location is denied/unavailable — dense, diverse community coverage. */
export const NYC_REGION: Region = {
  latitude: 40.72,
  longitude: -73.95,
  latitudeDelta: 0.28,
  longitudeDelta: 0.28,
};
