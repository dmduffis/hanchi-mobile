import { apiFetch } from "./client";
import type { ApiDish } from "./communities";
import type { ApiPoi } from "./search";

export type ApiPoiDetail = ApiPoi & {
  dishes: ApiDish[];
};

export function fetchPoi(id: string): Promise<ApiPoiDetail> {
  return apiFetch<ApiPoiDetail>(`/pois/${id}`);
}
