import { apiFetch } from "./client";
import type { GeoJsonPolygon } from "./geo";
import type { ApiPoi } from "./search";

export type ApiCommunity = {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  description: string;
  heroEmoji: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  poiCount: number;
  distanceMeters?: number;
};

export type ApiCommunityDetail = ApiCommunity & {
  boundary?: GeoJsonPolygon | null;
  pois: ApiPoi[];
};

export type ApiDish = {
  id: string;
  poiId: string;
  name: string;
  description: string | null;
  priceRange: string | null;
  imageUrl?: string | null;
  poiName?: string;
  communityId?: string | null;
  /** Inherited from the parent restaurant for flags. */
  ethnicities?: string[];
};

export function fetchCommunities(params?: {
  near?: { lat: number; lng: number };
  radiusMeters?: number;
}): Promise<ApiCommunity[]> {
  const search = new URLSearchParams();
  if (params?.near) {
    search.set("near", `${params.near.lat},${params.near.lng}`);
  }
  if (params?.radiusMeters != null) {
    search.set("radius", String(params.radiusMeters));
  }
  const qs = search.toString();
  return apiFetch<ApiCommunity[]>(`/communities${qs ? `?${qs}` : ""}`);
}

export function fetchCommunity(id: string): Promise<ApiCommunityDetail> {
  return apiFetch<ApiCommunityDetail>(`/communities/${id}`);
}

export function fetchCommunityDishes(id: string): Promise<ApiDish[]> {
  return apiFetch<ApiDish[]>(`/communities/${id}/dishes`);
}
