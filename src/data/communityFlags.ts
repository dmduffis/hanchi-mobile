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

export function getCommunityFlag(communityId: string, fallback = "🏳️"): string {
  return COMMUNITY_FLAGS[communityId] ?? fallback;
}
