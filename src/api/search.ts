import { apiFetch } from "./client";
import type { ApiCommunity, ApiDish } from "./communities";
import type { GeoJsonPoint } from "./geo";

export type ApiPoi = {
  id: string;
  /** Null when the restaurant is not tied to an enclave. */
  communityId: string | null;
  name: string;
  category: string;
  address: string | null;
  hours: string | null;
  yelpId?: string | null;
  rating?: number | null;
  priceLevel?: string | null;
  imageUrl?: string | null;
  yelpUrl?: string | null;
  /** Ethnicity ids for the restaurant (e.g. ["korean"]). Map to flags on client. */
  ethnicities?: string[];
  /** GeoJSON Point [lng, lat] when available. */
  location?: GeoJsonPoint | null;
  distanceMeters?: number;
};

export type ApiSearchResults = {
  query: string;
  communities: ApiCommunity[];
  pois: ApiPoi[];
  dishes: ApiDish[];
};

export type { ApiDish } from "./communities";

export function searchAll(query: string): Promise<ApiSearchResults> {
  const q = encodeURIComponent(query.trim());
  return apiFetch<ApiSearchResults>(`/search?q=${q}`);
}
