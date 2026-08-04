import type { MomentItem } from "../types";

/**
 * Peer posts + stamp activities for the feed until follow exists.
 * Mix same-culture home stops with people trying other kitchens —
 * not every visit should match the author's flag.
 */
export const mockPeerMoments: MomentItem[] = [
  // Aisha (Guyanese) → Korean, not Guyana
  {
    id: "mock-m1",
    kind: "peer",
    activity: "post",
    authorName: "Aisha",
    note: "First time splitting a kimchi jjigae for two. Wish I asked how to make it at home.",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    communityId: "koreatown-manhattan",
    communityName: "Koreatown in Manhattan",
    placeCountryCode: "kr",
    authorCountryCode: "gy",
    authorFlag: "🇬🇾",
  },
  // Sofia (Colombian) stamps Chinatown Flushing
  {
    id: "mock-s1",
    kind: "peer",
    activity: "stamp",
    authorName: "Sofia",
    note: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    communityId: "chinatown-flushing",
    communityName: "Chinatown in Flushing",
    placeCountryCode: "cn",
    authorCountryCode: "co",
    authorFlag: "🇨🇴",
  },
  // Kenji (Japanese) → Chinese dim sum (keep exploration)
  {
    id: "mock-m2",
    kind: "peer",
    activity: "post",
    authorName: "Kenji",
    note: "Late dim sum in Flushing with friends from work. The soup dumplings were perfect.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    communityId: "chinatown-flushing",
    communityName: "Chinatown in Flushing",
    placeCountryCode: "cn",
    authorCountryCode: "jp",
    authorFlag: "🇯🇵",
  },
  // Luis (Mexican) stamps Little Pakistan
  {
    id: "mock-s2",
    kind: "peer",
    activity: "stamp",
    authorName: "Luis",
    note: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    communityId: "little-pakistan",
    communityName: "Little Pakistan",
    placeCountryCode: "pk",
    authorCountryCode: "mx",
    authorFlag: "🇲🇽",
  },
  // Maya (Korean) → Guyanese doubles night
  {
    id: "mock-m3",
    kind: "peer",
    activity: "post",
    authorName: "Maya",
    note: "Someone told me to order doubles with the works on Liberty. Pepper sauce still lingering.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    communityId: "little-guyana-queens",
    communityName: "Little Guyana in Queens",
    placeCountryCode: "gy",
    authorCountryCode: "kr",
    authorFlag: "🇰🇷",
  },
  // Omar (Pakistani) → Mexican Sunset Park (home culture is rare exception)
  {
    id: "mock-m4",
    kind: "peer",
    activity: "post",
    authorName: "Omar",
    note: "Tacos al pastor at 11pm hit different after the train. Coming back for the aguas.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    communityId: "little-mexico-sunset-park",
    communityName: "Little Mexico in Sunset Park",
    placeCountryCode: "mx",
    authorCountryCode: "pk",
    authorFlag: "🇵🇰",
  },
  // Priya (Indian) stamps Little Colombia — exploration
  {
    id: "mock-s3",
    kind: "peer",
    activity: "stamp",
    authorName: "Priya",
    note: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    communityId: "little-colombia",
    communityName: "Little Colombia in Jackson Heights",
    placeCountryCode: "co",
    authorCountryCode: "in",
    authorFlag: "🇮🇳",
  },
  // Priya home pocket — intentional same-culture return visit
  {
    id: "mock-m5",
    kind: "peer",
    activity: "post",
    authorName: "Priya",
    note: "Back on the strip for chai and kulfi. Nice to know the order without thinking.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    communityId: "little-india",
    communityName: "Little India",
    placeCountryCode: "in",
    authorCountryCode: "in",
    authorFlag: "🇮🇳",
  },
];
