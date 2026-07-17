/** GeoJSON shapes returned by the Sinta API (WGS84). */

export type GeoJsonPoint = {
  type: "Point";
  /** [longitude, latitude] */
  coordinates: [number, number];
};

export type GeoJsonPolygon = {
  type: "Polygon";
  /** Outer ring first: [lng, lat][] */
  coordinates: number[][][];
};

export type LatLng = {
  latitude: number;
  longitude: number;
};

/** Convert a GeoJSON polygon outer ring to react-native-maps coordinates. */
export function polygonToLatLngs(
  boundary: GeoJsonPolygon | null | undefined,
): LatLng[] {
  const ring = boundary?.coordinates?.[0];
  if (!ring?.length) return [];

  return ring
    .map(([lng, lat]) => ({
      latitude: Number(lat),
      longitude: Number(lng),
    }))
    .filter(
      (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude),
    );
}

/** Convert a GeoJSON point to react-native-maps coordinates. */
export function pointToLatLng(
  location: GeoJsonPoint | null | undefined,
): LatLng | null {
  if (!location?.coordinates || location.coordinates.length < 2) return null;
  const [lng, lat] = location.coordinates;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}
