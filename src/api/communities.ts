import { apiFetch } from "./client";

export type ApiCommunity = {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  description: string;
  heroEmoji: string | null;
  imageUrl: string | null;
  distanceMeters?: number;
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
