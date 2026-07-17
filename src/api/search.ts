import { apiFetch } from "./client";
import type { ApiCommunity, ApiDish } from "./communities";

export type ApiPoi = {
  id: string;
  communityId: string;
  name: string;
  category: string;
  address: string | null;
  hours: string | null;
  yelpId?: string | null;
  rating?: number | null;
  priceLevel?: string | null;
  imageUrl?: string | null;
  yelpUrl?: string | null;
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
