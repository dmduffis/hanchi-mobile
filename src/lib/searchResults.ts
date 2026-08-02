import type { ApiSearchResults } from "../api/search";

export type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  communityId: string | null;
  restaurantId?: string;
  kind: "community" | "restaurant" | "dish";
};

export type SearchKindFilter = "all" | SearchResult["kind"];

export const SEARCH_KIND_FILTERS: { id: SearchKindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "community", label: "Communities" },
  { id: "restaurant", label: "Restaurants" },
  { id: "dish", label: "Dishes" },
];

export function mapSearchResults(data: ApiSearchResults): SearchResult[] {
  const poiCommunity = new Map(data.pois.map((p) => [p.id, p.communityId]));
  const fallback = data.communities[0]?.id ?? null;

  return [
    ...data.communities.map((c) => ({
      id: `c-${c.id}`,
      title: c.name,
      subtitle: `${c.neighborhood} · ${c.city}`,
      thumbnail: c.heroEmoji ?? "📍",
      communityId: c.id,
      kind: "community" as const,
    })),
    ...data.pois.map((p) => ({
      id: `r-${p.id}`,
      title: p.name,
      subtitle: `${p.category} · Place`,
      thumbnail: "🍽️",
      communityId: p.communityId,
      restaurantId: p.id,
      kind: "restaurant" as const,
    })),
    ...data.dishes.map((d) => ({
      id: `d-${d.id}`,
      title: d.name,
      subtitle: d.poiName ? `${d.poiName} · Dish` : "Dish",
      thumbnail: "🥢",
      communityId: poiCommunity.get(d.poiId) ?? fallback,
      restaurantId: d.poiId,
      kind: "dish" as const,
    })),
  ];
}

export function countSearchKinds(
  results: SearchResult[],
): Record<SearchKindFilter, number> {
  const counts: Record<SearchKindFilter, number> = {
    all: results.length,
    community: 0,
    restaurant: 0,
    dish: 0,
  };
  for (const item of results) {
    counts[item.kind] += 1;
  }
  return counts;
}

export function filterSearchResults(
  results: SearchResult[],
  kind: SearchKindFilter,
): SearchResult[] {
  if (kind === "all") return results;
  return results.filter((item) => item.kind === kind);
}
