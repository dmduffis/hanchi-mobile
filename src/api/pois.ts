import { apiFetch } from "./client";
import type { ApiDish } from "./communities";
import type { ApiPoi } from "./search";

export type ApiPoiDetail = ApiPoi & {
  dishes: ApiDish[];
};

export type ListPoisParams = {
  near: { lat: number; lng: number };
  radiusMeters?: number;
  ethnicity?: string[];
  communityId?: string;
  unassignedOnly?: boolean;
  limit?: number;
};

export type ListPoisResponse = {
  near: { lat: number; lng: number };
  radiusMeters: number;
  count: number;
  pois: ApiPoi[];
};

export function fetchPoi(id: string): Promise<ApiPoiDetail> {
  return apiFetch<ApiPoiDetail>(`/pois/${id}`);
}

export function fetchPoisNear(params: ListPoisParams): Promise<ListPoisResponse> {
  const qs = new URLSearchParams();
  qs.set("near", `${params.near.lat},${params.near.lng}`);
  if (params.radiusMeters != null) {
    qs.set("radius", String(Math.round(params.radiusMeters)));
  }
  if (params.ethnicity?.length) {
    qs.set("ethnicity", params.ethnicity.join(","));
  }
  if (params.communityId) qs.set("communityId", params.communityId);
  if (params.unassignedOnly) qs.set("unassignedOnly", "true");
  if (params.limit != null) qs.set("limit", String(params.limit));
  return apiFetch<ListPoisResponse>(`/pois?${qs.toString()}`);
}
