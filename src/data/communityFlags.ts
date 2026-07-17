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
  "little-india-hicksville": "🇮🇳",
  "little-portugal-mineola": "🇵🇹",
  "little-el-salvador-brentwood": "🇸🇻",
  "koreatown-nassau": "🇰🇷",
  "little-arabia-dearborn": "🇱🇧",
  "little-baghdad-sterling-heights": "🇮🇶",
  "banglatown-hamtramck": "🇧🇩",
  "mexicantown-detroit": "🇲🇽",
  "koreatown-la": "🇰🇷",
  "thai-town-la": "🇹🇭",
  "little-tokyo-la": "🇯🇵",
  "little-ethiopia-la": "🇪🇹",
  "little-arabia-anaheim": "🇸🇾",
  "little-saigon-westminster": "🇻🇳",
};

/**
 * ISO / circle-flags country codes for map pins
 * (HatScripts circle-flags via react-native-circle-flags).
 */
export const COMMUNITY_COUNTRY_CODES: Record<string, string> = {
  "chinatown-flushing": "cn",
  "chinatown-manhattan": "cn",
  "chinatown-sunset-park": "cn",
  "guyana-gateway": "gy",
  "koreatown-manhattan": "kr",
  "koreatown-queens": "kr",
  "little-africa-si": "lr",
  "little-africa-bronx": "gh",
  "little-albania": "al",
  "little-bangladesh": "bd",
  "little-bhod-tibet": "np",
  "little-caribbean": "jm",
  "little-colombia": "co",
  "little-dominican-republic": "do",
  "little-ecuador": "ec",
  "little-egypt": "eg",
  "little-guyana-queens": "gy",
  "little-guyana-bronx": "gy",
  "little-haiti": "ht",
  "little-india": "in",
  "little-manila": "ph",
  "little-mexico-port-richmond": "mx",
  "little-mexico-sunset-park": "mx",
  "little-odessa": "ru",
  "little-palestine": "ps",
  "little-pakistan": "pk",
  "little-poland": "pl",
  "little-senegal": "sn",
  "little-ukraine": "ua",
  "little-yemen": "ye",
  "little-india-hicksville": "in",
  "little-portugal-mineola": "pt",
  "little-el-salvador-brentwood": "sv",
  "koreatown-nassau": "kr",
  "little-arabia-dearborn": "lb",
  "little-baghdad-sterling-heights": "iq",
  "banglatown-hamtramck": "bd",
  "mexicantown-detroit": "mx",
  "koreatown-la": "kr",
  "thai-town-la": "th",
  "little-tokyo-la": "jp",
  "little-ethiopia-la": "et",
  "little-arabia-anaheim": "sy",
  "little-saigon-westminster": "vn",
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
  "little-india-hicksville": ["🇮🇳"],
  "little-portugal-mineola": ["🇵🇹"],
  "little-el-salvador-brentwood": ["🇸🇻"],
  "koreatown-nassau": ["🇰🇷"],
  "little-arabia-dearborn": ["🇱🇧", "🇾🇪"],
  "little-baghdad-sterling-heights": ["🇮🇶"],
  "banglatown-hamtramck": ["🇧🇩"],
  "mexicantown-detroit": ["🇲🇽"],
  "koreatown-la": ["🇰🇷"],
  "thai-town-la": ["🇹🇭"],
  "little-tokyo-la": ["🇯🇵"],
  "little-ethiopia-la": ["🇪🇹"],
  "little-arabia-anaheim": ["🇸🇾"],
  "little-saigon-westminster": ["🇻🇳"],
};

export function getCommunityFlag(communityId: string, fallback = "🏳️"): string {
  return COMMUNITY_FLAGS[communityId] ?? fallback;
}

export function getCommunityCountryCode(
  communityId: string,
): string | undefined {
  return COMMUNITY_COUNTRY_CODES[communityId];
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
