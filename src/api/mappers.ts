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
    // Prefer description for culture signals — city alone ("Boston") hides
    // Brazilian / Armenian / etc. from map client-side search.
    heritage: c.city || c.neighborhood,
    tags: [c.city, c.description].filter((t): t is string => !!t),
    description: c.description,
    pullQuote: "",
    pullQuoteAuthor: "",
    emoji: c.heroEmoji ?? "📍",
    imageUrl: c.imageUrl ?? null,
    // Never invent NYC coords — missing geo must not pin elsewhere.
    latitude: c.latitude ?? Number.NaN,
    longitude: c.longitude ?? Number.NaN,
    distanceMiles,
    relatedIds: [],
  };
}
