import { apiFetch } from "./client";

export type ApiRouteSummary = {
  id: string;
  title: string;
  description: string | null;
  type: "curated" | "ai_generated" | "seasonal";
  createdAt: string;
  stopCount?: number;
};

export type ApiRouteDetail = ApiRouteSummary & {
  stops: {
    id: string;
    routeId: string;
    poiId: string;
    order: number;
    poi?: {
      id: string;
      communityId: string;
      name: string;
      category: string;
    };
  }[];
};

export function fetchRoutes(type?: string): Promise<ApiRouteSummary[]> {
  const qs = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiFetch<ApiRouteSummary[]>(`/routes${qs}`);
}

export function fetchRoute(id: string): Promise<ApiRouteDetail> {
  return apiFetch<ApiRouteDetail>(`/routes/${id}`);
}
