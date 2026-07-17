import { apiFetch } from "./client";
import type { ApiCommunity } from "./communities";

export type ApiPoi = {
  id: string;
  communityId: string;
  name: string;
  category: string;
  address: string | null;
  hours: string | null;
};

export type ApiDish = {
  id: string;
  poiId: string;
  name: string;
  description: string | null;
  priceRange: string | null;
  poiName?: string;
};

export type ApiSearchResults = {
  query: string;
  communities: ApiCommunity[];
  pois: ApiPoi[];
  dishes: ApiDish[];
};

export function searchAll(query: string): Promise<ApiSearchResults> {
  const q = encodeURIComponent(query.trim());
  return apiFetch<ApiSearchResults>(`/search?q=${q}`);
}
