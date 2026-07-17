/** One primary flag per enclave pin — multi-group affinities show as chips on cards. */
export const COMMUNITY_FLAGS: Record<string, string> = {
  "chinatown-flushing": "🇨🇳",
  "chinatown-manhattan": "🇨🇳",
  "chinatown-sunset-park": "🇨🇳",
  "guyana-gateway": "🇬🇾",
  "koreatown-manhattan": "🇰🇷",
  "koreatown-queens": "🇰🇷",
  "little-africa-si": "🇱🇷",
  "little-africa-bronx": "🇬🇭",
  "little-albania": "🇦🇱",
  "little-bangladesh": "🇧🇩",
  "little-bhod-tibet": "🇳🇵",
  "little-caribbean": "🇯🇲",
  "little-colombia": "🇨🇴",
  "little-dominican-republic": "🇩🇴",
  "little-ecuador": "🇪🇨",
  "little-egypt": "🇪🇬",
  "little-guyana-queens": "🇬🇾",
  "little-guyana-bronx": "🇬🇾",
  "little-haiti": "🇭🇹",
  "little-india": "🇮🇳",
  "little-manila": "🇵🇭",
  "little-mexico-port-richmond": "🇲🇽",
  "little-mexico-sunset-park": "🇲🇽",
  "little-odessa": "🇷🇺",
  "little-palestine": "🇵🇸",
  "little-pakistan": "🇵🇰",
  "little-poland": "🇵🇱",
  "little-senegal": "🇸🇳",
  "little-ukraine": "🇺🇦",
  "little-yemen": "🇾🇪",
};

/**
 * 1–2 national / cultural flags for an enclave.
 * Second flag is for dual-heritage corridors (e.g. Little Odessa, Flushing).
 */
const COMMUNITY_FLAGS_PAIR: Record<string, [string] | [string, string]> = {
  "chinatown-flushing": ["🇨🇳", "🇹🇼"],
  "chinatown-manhattan": ["🇨🇳"],
  "chinatown-sunset-park": ["🇨🇳"],
  "guyana-gateway": ["🇬🇾"],
  "koreatown-manhattan": ["🇰🇷"],
  "koreatown-queens": ["🇰🇷"],
  "little-africa-si": ["🇱🇷"],
  "little-africa-bronx": ["🇬🇭"],
  "little-albania": ["🇦🇱"],
  "little-bangladesh": ["🇧🇩"],
  "little-bhod-tibet": ["🇳🇵", "🇮🇳"],
  "little-caribbean": ["🇯🇲", "🇹🇹"],
  "little-colombia": ["🇨🇴"],
  "little-dominican-republic": ["🇩🇴"],
  "little-ecuador": ["🇪🇨"],
  "little-egypt": ["🇪🇬"],
  "little-guyana-queens": ["🇬🇾", "🇹🇹"],
  "little-guyana-bronx": ["🇬🇾"],
  "little-haiti": ["🇭🇹"],
  "little-india": ["🇮🇳"],
  "little-manila": ["🇵🇭"],
  "little-mexico-port-richmond": ["🇲🇽"],
  "little-mexico-sunset-park": ["🇲🇽"],
  "little-odessa": ["🇷🇺", "🇺🇦"],
  "little-palestine": ["🇵🇸"],
  "little-pakistan": ["🇵🇰"],
  "little-poland": ["🇵🇱"],
  "little-senegal": ["🇸🇳"],
  "little-ukraine": ["🇺🇦"],
  "little-yemen": ["🇾🇪"],
};

export function getCommunityFlag(communityId: string, fallback = "🏳️"): string {
  return COMMUNITY_FLAGS[communityId] ?? fallback;
}

/** Up to two flags for restaurant / place labels. */
export function getCommunityFlags(
  communityId: string,
  fallback = "🏳️",
): string[] {
  const pair = COMMUNITY_FLAGS_PAIR[communityId];
  if (pair?.length) return pair.slice(0, 2);
  const primary = COMMUNITY_FLAGS[communityId];
  return primary ? [primary] : [fallback];
}

export function formatCommunityFlags(
  communityId: string,
  fallback = "🏳️",
): string {
  return getCommunityFlags(communityId, fallback).join("");
}
