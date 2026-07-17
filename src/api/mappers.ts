import type { Community } from "../types";
import type { ApiCommunity } from "./communities";

const METERS_PER_MILE = 1609.34;

/** Map API community → mobile Community shape used by map/list UIs. */
export function mapApiCommunity(c: ApiCommunity): Community {
  const distanceMiles =
    c.distanceMeters != null
      ? Math.round((c.distanceMeters / METERS_PER_MILE) * 10) / 10
      : 0;

  return {
    id: c.id,
    name: c.name,
    neighborhood: c.neighborhood,
    heritage: c.city || c.neighborhood,
    tags: c.city ? [c.city] : [],
    description: c.description,
    pullQuote: "",
    pullQuoteAuthor: "",
    emoji: c.heroEmoji ?? "📍",
    latitude: c.latitude ?? 40.72,
    longitude: c.longitude ?? -73.95,
    distanceMiles,
    relatedIds: [],
  };
}
