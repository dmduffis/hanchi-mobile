/**
 * Stamp face motifs keyed by diaspora country / culture — not the host city.
 *
 * Curated motifs use distinctive Material Community Icons.
 * Everything else uses a small generic pool.
 */

import { getCommunityCountryCode } from "./communityFlags";

export type StampMotif =
  // Curated — distinctive country associations
  | "yinYang"
  | "templeBuddhist"
  | "om"
  | "chili"
  | "pyramid"
  | "coffee"
  | "sailboat"
  | "island"
  | "guitar"
  | "mosque"
  | "noodles"
  | "rice"
  | "volcano"
  | "tipi"
  // Generic pool
  | "skyline"
  | "temple"
  | "palm"
  | "waves"
  | "mountain"
  | "sun"
  | "market"
  | "landmark";

/** @deprecated Prefer StampMotif */
export type StampPlaceType = StampMotif;

/** Monochrome stamp ink colors — one color per stamp. */
export const STAMP_INK_COLORS = [
  "#163A2B", // forest
  "#C45C3A", // terracotta
  "#2A6F6F", // teal
  "#5C4033", // brown
  "#8B6914", // gold-ink
  "#3D5A6C", // slate
  "#B85C5C", // clay
  "#5A6B3F", // olive
] as const;

/**
 * Well-known country → distinctive motif.
 * Countries not listed fall through to the generic pool.
 */
const CURATED_BY_COUNTRY: Record<string, StampMotif> = {
  // East Asia
  cn: "yinYang",
  jp: "templeBuddhist",
  kr: "noodles", // MCI noodles = bowl + chopsticks
  // SE Asia
  th: "templeBuddhist",
  vn: "rice",
  ph: "island",
  // South Asia
  in: "om",
  np: "mountain",
  // Latin America
  mx: "chili",
  co: "coffee",
  ec: "volcano",
  cu: "palm",
  ni: "volcano",
  do: "palm",
  ve: "palm",
  pr: "palm",
  // Africa / Middle East / Caribbean
  eg: "pyramid",
  et: "coffee",
  ng: "market",
  ht: "palm",
  pk: "mosque",
  ye: "mosque",
  lb: "mosque",
  sy: "mosque",
  iq: "mosque",
  ps: "mosque",
  // Europe / Caribbean / Caucasus / Latin
  pt: "sailboat",
  it: "landmark",
  gr: "landmark",
  pl: "landmark",
  jm: "guitar",
  am: "mountain",
  br: "palm",
  sv: "chili",
};

/** Rare per-community overrides when country alone is too coarse. */
const CURATED_BY_COMMUNITY: Record<string, StampMotif> = {
  "little-bhod-tibet": "mountain",
  "pacific-islander-sf": "island",
  "american-indian-sf": "tipi",
  "little-caribbean": "guitar",
  "little-italy": "landmark",
};

const GENERIC_MOTIFS: StampMotif[] = [
  "skyline",
  "temple",
  "palm",
  "waves",
  "mountain",
  "sun",
  "market",
  "landmark",
];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function stampMotifForCommunity(communityId: string): StampMotif {
  const byId = CURATED_BY_COMMUNITY[communityId];
  if (byId) return byId;

  const cc = getCommunityCountryCode(communityId)?.toLowerCase();
  if (cc && CURATED_BY_COUNTRY[cc]) return CURATED_BY_COUNTRY[cc]!;

  return GENERIC_MOTIFS[hashString(communityId) % GENERIC_MOTIFS.length]!;
}

/** @deprecated Use stampMotifForCommunity */
export function stampPlaceTypeForCommunity(
  communityId: string,
  _name = "",
): StampMotif {
  return stampMotifForCommunity(communityId);
}

export function stampInkForCommunity(communityId: string): string {
  return STAMP_INK_COLORS[hashString(communityId) % STAMP_INK_COLORS.length]!;
}

/**
 * Subtle postcard tilt in degrees (−3.5 … +3.5), stable per community.
 */
export function stampTiltForCommunity(communityId: string): number {
  const n = hashString(`tilt:${communityId}`) % 1000;
  const t = (n / 999) * 7 - 3.5;
  if (Math.abs(t) < 0.8) return t >= 0 ? 1.2 : -1.2;
  return Math.round(t * 10) / 10;
}

/** Display title for stamp face — keep the full community name when it fits. */
export function stampTitleForCommunity(name: string): string {
  const trimmed = name.trim();
  const shortened = trimmed
    .replace(/^Chinatown in /i, "Chinatown · ")
    .replace(/^Koreatown in /i, "Koreatown · ")
    .replace(/^Japantown in /i, "Japantown · ")
    .replace(/\s+Cultural District$/i, "")
    .replace(/\s+Neighborhood$/i, "")
    .trim();
  if (shortened.length <= 24) return shortened;
  return `${shortened.slice(0, 23).trimEnd()}…`;
}
