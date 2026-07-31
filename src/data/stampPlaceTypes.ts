/**
 * Place-type motifs for passport stamps (Airbnb-style reuse of a few icons).
 * Icons drawn from Lucide (ISC) — building-2, waves, sun, mountain, trees, landmark.
 */

export type StampPlaceType =
  | "city"
  | "coastal"
  | "nature"
  | "mountains"
  | "landmark";

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

/** Explicit overrides when an enclave has a clear vibe. */
const PLACE_TYPE_BY_ID: Record<string, StampPlaceType> = {
  "chinatown-flushing": "city",
  "chinatown-manhattan": "city",
  "chinatown-sunset-park": "city",
  "koreatown-manhattan": "city",
  "koreatown-queens": "city",
  "koreatown-la": "city",
  "koreatown-nassau": "city",
  "little-tokyo-la": "city",
  "japantown-sf": "city",
  "little-odessa": "coastal",
  "little-italy": "city",
  "little-senegal": "city",
  "little-ukraine": "city",
  "little-poland": "city",
  "little-india": "city",
  "little-india-hicksville": "city",
  "little-bangladesh": "city",
  "little-pakistan": "city",
  "little-manila": "city",
  "little-mexico-sunset-park": "city",
  "little-mexico-port-richmond": "city",
  "little-colombia": "city",
  "little-ecuador": "city",
  "little-dominican-republic": "city",
  "little-haiti": "coastal",
  "little-caribbean": "coastal",
  "little-guyana-queens": "city",
  "little-guyana-bronx": "city",
  "little-africa-si": "city",
  "little-africa-bronx": "city",
  "little-egypt": "landmark",
  "little-palestine": "city",
  "little-yemen": "city",
  "little-albania": "city",
  "little-bhod-tibet": "mountains",
  "little-arabia-dearborn": "city",
  "little-arabia-anaheim": "city",
  "little-baghdad-sterling-heights": "city",
  "little-ethiopia-la": "city",
  "little-saigon-westminster": "city",
  "little-portugal-mineola": "city",
  "little-el-salvador-brentwood": "city",
  "calle-24-sf": "city",
  "soma-pilipinas-sf": "city",
  "sunset-chinese-sf": "city",
  "pacific-islander-sf": "coastal",
  "banglatown-hamtramck": "city",
  "mexicantown-detroit": "city",
  "thai-town-la": "city",
  "guyana-gateway": "city",
};

// Fix: "market" isn't in StampPlaceType — use city or nature. Use "city" for markets
// or add market type. I'll use city for markets and map market to city icon, OR add market as alias to city.
// Better: use landmark for temple-ish and city for markets. Fix the type error - little-india used "market"

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const KEYWORD_TYPES: { re: RegExp; type: StampPlaceType }[] = [
  { re: /beach|island|coast|harbor|harbour|caribbean|haiti|odessa|pacific/i, type: "coastal" },
  { re: /tibet|nepal|bhod|mountain|highland/i, type: "mountains" },
  { re: /park|garden|forest|green/i, type: "nature" },
  { re: /egypt|temple|church|mosque|cathedral|landmark/i, type: "landmark" },
  { re: /town|city|street|heights|village|korea|china|japan|india|mexico/i, type: "city" },
];

export function stampPlaceTypeForCommunity(
  communityId: string,
  name = "",
): StampPlaceType {
  const fixed = PLACE_TYPE_BY_ID[communityId];
  if (fixed) return fixed;
  const hay = `${communityId} ${name}`;
  for (const { re, type } of KEYWORD_TYPES) {
    if (re.test(hay)) return type;
  }
  const types: StampPlaceType[] = [
    "city",
    "coastal",
    "nature",
    "mountains",
    "landmark",
  ];
  return types[hashString(communityId) % types.length]!;
}

export function stampInkForCommunity(communityId: string): string {
  return STAMP_INK_COLORS[hashString(communityId) % STAMP_INK_COLORS.length]!;
}

/**
 * Subtle postcard tilt in degrees (−3.5 … +3.5), stable per community.
 */
export function stampTiltForCommunity(communityId: string): number {
  const n = hashString(`tilt:${communityId}`) % 1000;
  // Map 0–999 → −3.5 … +3.5, skip a dead zone near 0 so most tilt a little.
  const t = (n / 999) * 7 - 3.5;
  if (Math.abs(t) < 0.8) return t >= 0 ? 1.2 : -1.2;
  return Math.round(t * 10) / 10;
}

/** Display title for stamp face — keep the full community name when it fits. */
export function stampTitleForCommunity(name: string): string {
  const trimmed = name.trim();
  // Only compress a few long "X in Y" forms; never drop "Little ".
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
