import type { Community } from "../types";
import { WIKI_COMMUNITY_AFFINITIES } from "./generated/wikipediaCommunityMeta";

export type CultureFilterId =
  | "all"
  | "chinese"
  | "korean"
  | "south-asian"
  | "caribbean"
  | "latino"
  | "african"
  | "middle-eastern"
  | "european"
  | "filipino";

export type CultureFilter = {
  id: CultureFilterId;
  label: string;
};

export const CULTURE_FILTERS: CultureFilter[] = [
  { id: "all", label: "All" },
  { id: "chinese", label: "Chinese" },
  { id: "korean", label: "Korean" },
  { id: "south-asian", label: "South Asian" },
  { id: "caribbean", label: "Caribbean" },
  { id: "latino", label: "Latino" },
  { id: "african", label: "African" },
  { id: "middle-eastern", label: "Middle Eastern" },
  { id: "european", label: "European" },
  { id: "filipino", label: "Filipino" },
];

/**
 * Soft cultural affinities per enclave — not 1:1.
 * An enclave can belong to several groups (e.g. Little Guyana → Caribbean + South Asian).
 * Replace / enrich later with backend taxonomy or embeddings.
 */
const AFFINITIES: Record<string, CultureFilterId[]> = {
  "chinatown-flushing": ["chinese"],
  "chinatown-manhattan": ["chinese"],
  "chinatown-sunset-park": ["chinese"],
  "guyana-gateway": ["caribbean", "south-asian"],
  "koreatown-manhattan": ["korean"],
  "koreatown-queens": ["korean"],
  "little-africa-si": ["african"],
  "little-africa-bronx": ["african"],
  "little-albania": ["european"],
  "little-bangladesh": ["south-asian"],
  "little-bhod-tibet": ["south-asian"],
  "little-caribbean": ["caribbean", "african"],
  "little-colombia": ["latino"],
  "little-dominican-republic": ["latino", "caribbean"],
  "little-ecuador": ["latino"],
  "little-egypt": ["middle-eastern", "african"],
  "little-guyana-queens": ["caribbean", "south-asian"],
  "little-guyana-bronx": ["caribbean", "south-asian"],
  "little-haiti": ["caribbean", "african"],
  "little-india": ["south-asian"],
  "little-manila": ["filipino"],
  "little-mexico-port-richmond": ["latino"],
  "little-mexico-sunset-park": ["latino"],
  "little-odessa": ["european"],
  "little-palestine": ["middle-eastern"],
  "little-pakistan": ["south-asian"],
  "little-poland": ["european"],
  "little-senegal": ["african"],
  "little-ukraine": ["european"],
  "little-yemen": ["middle-eastern"],
  "little-india-hicksville": ["south-asian"],
  "little-portugal-mineola": ["european"],
  "little-el-salvador-brentwood": ["latino"],
  "koreatown-nassau": ["korean"],
  "little-arabia-dearborn": ["middle-eastern"],
  "yemeni-south-end-dearborn": ["middle-eastern"],
  "little-baghdad-sterling-heights": ["middle-eastern"],
  "banglatown-hamtramck": ["south-asian"],
  "mexicantown-detroit": ["latino"],
  "koreatown-la": ["korean"],
  "thai-town-la": [],
  "little-tokyo-la": [],
  "little-ethiopia-la": ["african"],
  "little-arabia-anaheim": ["middle-eastern"],
  "little-saigon-westminster": [],
  "japantown-sf": [],
  "calle-24-sf": ["latino"],
  "soma-pilipinas-sf": ["filipino"],
  "sunset-chinese-sf": ["chinese"],
  // US cultural districts — not foreign-country / diaspora enclaves.
  "african-american-arts-sf": [],
  "pacific-islander-sf": [],
  "american-indian-sf": [],
};

function affinitiesFor(community: Community): CultureFilterId[] {
  const local = AFFINITIES[community.id];
  if (local) return local;
  const wiki = WIKI_COMMUNITY_AFFINITIES[community.id];
  if (!wiki?.length) return [];
  return wiki.filter((id): id is CultureFilterId =>
    CULTURE_FILTERS.some((f) => f.id === id),
  );
}

export function getCommunityAffinities(
  community: Community,
): CultureFilterId[] {
  return affinitiesFor(community);
}

/** Culture chips that have at least one matching community (always includes All). */
export function availableCultureFiltersForCommunities(
  communities: Community[],
): CultureFilter[] {
  const present = new Set<CultureFilterId>();
  for (const c of communities) {
    for (const id of affinitiesFor(c)) present.add(id);
  }
  return CULTURE_FILTERS.filter((f) => f.id === "all" || present.has(f.id));
}

export function getAffinityLabels(community: Community): string[] {
  return affinitiesFor(community).map(
    (id) => CULTURE_FILTERS.find((f) => f.id === id)?.label ?? id,
  );
}

/** Extra search terms per culture group (labels rarely appear in enclave copy). */
const GROUP_SEARCH_TERMS: Record<CultureFilterId, string[]> = {
  all: [],
  chinese: ["chinese", "asian", "east asian", "chinatown"],
  korean: ["korean", "asian", "east asian", "koreatown"],
  "south-asian": [
    "south asian",
    "asian",
    "desi",
    "indian",
    "pakistani",
    "bangladeshi",
    "indo-caribbean",
  ],
  caribbean: ["caribbean", "west indian", "indo-caribbean"],
  latino: ["latino", "latina", "latin", "hispanic", "latinx"],
  african: ["african", "west african", "africa"],
  "middle-eastern": ["middle eastern", "arab", "mena"],
  european: ["european", "eastern european"],
  filipino: ["filipino", "asian", "southeast asian", "pinoy"],
};

function haystack(c: Community): string {
  const affinityLabels = affinitiesFor(c)
    .map((id) => CULTURE_FILTERS.find((f) => f.id === id)?.label ?? id)
    .join(" ");
  const groupTerms = affinitiesFor(c)
    .flatMap((id) => GROUP_SEARCH_TERMS[id] ?? [])
    .join(" ");

  return [
    c.name,
    c.heritage,
    c.neighborhood,
    ...c.tags,
    affinityLabels,
    groupTerms,
    // City / metro aliases so "detroit", "long island", etc. resolve.
    c.heritage.includes("Detroit") ||
    c.tags.some((t) => /detroit|dearborn|hamtramck/i.test(t))
      ? "detroit dearborn sterling heights hamtramck"
      : "",
    c.heritage.includes("Long Island") ||
    c.neighborhood.includes("Nassau") ||
    c.neighborhood.includes("Suffolk")
      ? "long island nassau suffolk"
      : "",
    c.neighborhood.includes("Los Angeles") ||
    c.tags.some((t) => /los angeles/i.test(t))
      ? "los angeles la hollywood koreatown"
      : "",
    c.neighborhood.includes("Anaheim") ||
    c.neighborhood.includes("Westminster") ||
    c.tags.some((t) => /anaheim|orange county|westminster/i.test(t))
      ? "anaheim orange county oc westminster garden grove saigon"
      : "",
    c.neighborhood.includes("San Francisco") ||
    c.heritage.includes("San Francisco") ||
    c.tags.some((t) => /san francisco|\bsf\b/i.test(t))
      ? "san francisco sf bay area mission castro japantown sunset"
      : "",
    c.neighborhood.includes("Chicago") ||
    c.heritage.includes("Chicago") ||
    c.tags.some((t) =>
      /chicago|bridgeview|pilsen|argyle|devon|bolingbrook|humboldt|avondale/i.test(
        t,
      ),
    )
      ? "chicago chicagoland illinois uptown pilsen little village bolingbrook"
      : "",
    c.neighborhood.includes("Houston") ||
    c.tags.some((t) => /houston|bellaire|hillcroft|alief|sugar land|katy/i.test(t))
      ? "houston texas bellaire hillcroft alief sugar land katy"
      : "",
    c.neighborhood.includes("Seattle") ||
    c.neighborhood.includes("Bellevue") ||
    c.neighborhood.includes("Kent") ||
    c.neighborhood.includes("Redmond") ||
    c.tags.some((t) => /seattle|bellevue|kent|redmond|white center|beacon hill/i.test(t))
      ? "seattle eastside bellevue kent redmond white center beacon hill"
      : "",
    c.neighborhood.includes("Boston") ||
    c.neighborhood.includes("Quincy") ||
    c.neighborhood.includes("Malden") ||
    c.neighborhood.includes("Somerville") ||
    c.neighborhood.includes("Watertown") ||
    c.tags.some((t) => /boston|quincy|malden|somerville|watertown|east boston/i.test(t))
      ? "boston massachusetts quincy malden somerville watertown"
      : "",
    c.neighborhood.includes("Washington, D.C.") ||
    c.neighborhood.includes("Silver Spring") ||
    c.neighborhood.includes("Falls Church") ||
    c.neighborhood.includes("Annandale") ||
    c.tags.some((t) => /washington|d\.?c\.?|silver spring|falls church|annandale|eden center/i.test(t))
      ? "washington dc district columbia silver spring falls church annandale"
      : "",
    c.neighborhood.includes("Dallas") ||
    c.neighborhood.includes("Plano") ||
    c.neighborhood.includes("Frisco") ||
    c.neighborhood.includes("Irving") ||
    c.neighborhood.includes("Richardson") ||
    c.neighborhood.includes("Carrollton") ||
    c.tags.some((t) => /dallas|dfw|plano|frisco|irving|richardson|carrollton|oak cliff/i.test(t))
      ? "dallas fort worth dfw plano frisco irving richardson carrollton"
      : "",
    c.neighborhood.includes("Connecticut") ||
    c.neighborhood.includes("New Haven") ||
    c.neighborhood.includes("Hartford") ||
    c.neighborhood.includes("Bridgeport") ||
    c.neighborhood.includes("New Britain") ||
    c.neighborhood.includes("Danbury") ||
    c.neighborhood.includes("Stamford") ||
    c.tags.some((t) =>
      /connecticut|\bct\b|new haven|hartford|bridgeport|new britain|danbury|stamford|wooster|fair haven/i.test(
        t,
      ),
    )
      ? "connecticut ct new haven hartford bridgeport new britain danbury stamford wooster"
      : "",
    c.neighborhood.includes("Miami") ||
    c.neighborhood.includes("Hialeah") ||
    c.neighborhood.includes("Sweetwater") ||
    c.neighborhood.includes("Doral") ||
    c.neighborhood.includes("Westchester") ||
    c.neighborhood.includes("Kendall") ||
    c.neighborhood.includes("Pompano") ||
    c.neighborhood.includes("Deerfield") ||
    c.tags.some((t) =>
      /miami|hialeah|little havana|little haiti|sweetwater|doral|allapattah|calle ocho|kendall|pompano|broward/i.test(
        t,
      ),
    )
      ? "miami florida hialeah little havana little haiti sweetwater doral allapattah kendall pompano broward"
      : "",
    c.neighborhood.includes("Orlando") ||
    c.neighborhood.includes("Kissimmee") ||
    c.neighborhood.includes("Apopka") ||
    c.tags.some((t) =>
      /orlando|kissimmee|mills 50|pine hills|azalea park|central florida|kirkman|apopka|i-drive/i.test(
        t,
      ),
    )
      ? "orlando kissimmee mills 50 pine hills azalea park central florida kirkman apopka"
      : "",
    c.neighborhood.includes("Tampa") ||
    c.neighborhood.includes("Tarpon Springs") ||
    c.neighborhood.includes("Ybor") ||
    c.tags.some((t) => /tampa|ybor|tarpon springs|west tampa/i.test(t))
      ? "tampa ybor tarpon springs west tampa florida"
      : "",
    c.neighborhood.includes("Jacksonville") ||
    c.neighborhood.includes("Baymeadows") ||
    c.tags.some((t) => /jacksonville|baymeadows/i.test(t))
      ? "jacksonville baymeadows florida"
      : "",
    c.neighborhood.includes("Minneapolis") ||
    c.neighborhood.includes("Saint Paul") ||
    c.neighborhood.includes("Brooklyn Park") ||
    c.neighborhood.includes("Frogtown") ||
    c.tags.some((t) =>
      /minnesota|minneapolis|saint paul|st paul|twin cities|hmong|cedar-riverside|little mekong|brooklyn park/i.test(
        t,
      ),
    )
      ? "minnesota minneapolis saint paul st paul twin cities hmong cedar riverside little mekong"
      : "",
  ]
    .join(" ")
    .toLowerCase();
}

/** Loose text search — token-ish, not exact phrase only. */
export function communityMatchesQuery(
  community: Community,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const text = haystack(community);
  if (text.includes(q)) return true;

  // Multi-word: all tokens should appear somewhere (order-independent)
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => text.includes(t))) return true;

  // Synonym / vibe aliases for scaffold demos
  const aliases: Record<string, string[]> = {
    desi: [
      "south asian",
      "indian",
      "pakistan",
      "bangladesh",
      "guyanese",
      "indo",
    ],
    spicy: ["indian", "korean", "mexican", "caribbean", "sichuan"],
    dimsum: ["chinese", "chinatown", "flushing", "sunset park"],
    bbq: ["korean", "koreatown"],
    latin: ["latino", "colombian", "mexican", "ecuador", "dominican"],
    arab: ["egypt", "yemen", "palestine", "middle eastern"],
    africa: ["senegal", "african", "ghana", "liberian", "haiti"],
  };

  // Avoid Object.entries — React Compiler / Hermes can turn it into .entries() and crash
  for (const alias of Object.keys(aliases)) {
    const hints = aliases[alias];
    if (q.includes(alias) || alias.includes(q)) {
      if (hints.some((h) => text.includes(h))) return true;
    }
  }

  return false;
}

export function communityMatchesCulture(
  community: Community,
  filterId: CultureFilterId,
): boolean {
  if (filterId === "all") return true;
  return affinitiesFor(community).includes(filterId);
}

export function filterCommunities(
  communities: Community[],
  opts: { culture: CultureFilterId; query: string },
): Community[] {
  return communities.filter(
    (c) =>
      communityMatchesCulture(c, opts.culture) &&
      communityMatchesQuery(c, opts.query),
  );
}

/**
 * Higher = better text match for map fly-to.
 * Prefer real names/neighborhoods over loose metro aliases in the haystack.
 */
export function scoreCommunityQuery(
  community: Community,
  query: string,
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const name = community.name.toLowerCase();
  const neighborhood = community.neighborhood.toLowerCase();
  const heritage = community.heritage.toLowerCase();
  const tags = community.tags.join(" ").toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);

  let score = 0;
  if (name === q) score = 1000;
  else if (name.startsWith(q)) score = 850;
  else if (name.includes(q)) score = 700;
  else if (tokens.length > 1 && tokens.every((t) => name.includes(t)))
    score = 650;
  else if (neighborhood.includes(q)) score = 500;
  else if (tokens.every((t) => neighborhood.includes(t))) score = 450;
  else if (heritage.includes(q) || tags.includes(q)) score = 300;
  else if (communityMatchesQuery(community, q)) score = 120;
  else return 0;

  // City-hall / metro-centroid dumps should lose to a better-geocoded twin.
  if (isLikelyCityHallPin(community.latitude, community.longitude)) {
    score -= 400;
  }
  return score;
}

/** Known Nominatim city-level centroids that previously swallowed neighborhoods. */
function isLikelyCityHallPin(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;
  const dumps: Array<[number, number]> = [
    [40.7127281, -74.0060152], // NYC
    [40.7128, -74.006],
    [34.0522, -118.2437], // LA
    [34.0522342, -118.2436849],
    [43.6532, -79.3832], // Toronto
    [37.8044, -122.2712], // Oakland
    [49.2827, -123.1207], // Vancouver
  ];
  return dumps.some(
    ([dLat, dLng]) => Math.abs(lat - dLat) < 0.0015 && Math.abs(lng - dLng) < 0.0015,
  );
}

/**
 * Map culture chips → POI ethnicity slugs for Food-layer discovery.
 * Null means no ethnicity filter (All).
 */
const CULTURE_POI_ETHNICITIES: Record<CultureFilterId, string[] | null> = {
  all: null,
  chinese: ["chinese", "taiwanese"],
  korean: ["korean"],
  "south-asian": ["indian", "pakistani", "bangladeshi", "nepali", "afghan"],
  caribbean: ["jamaican", "haitian", "guyanese", "caribbean"],
  latino: [
    "mexican",
    "colombian",
    "dominican",
    "ecuadorian",
    "peruvian",
    "venezuelan",
    "cuban",
    "puerto_rican",
    "salvadoran",
  ],
  african: [
    "senegalese",
    "ghanaian",
    "liberian",
    "ethiopian",
    "nigerian",
    "somali",
    "west_african",
  ],
  "middle-eastern": [
    "egyptian",
    "lebanese",
    "syrian",
    "palestinian",
    "yemeni",
    "iraqi",
    "moroccan",
    "turkish",
    "iranian",
    "israeli",
    "middle_eastern",
  ],
  european: [
    "polish",
    "ukrainian",
    "russian",
    "albanian",
    "greek",
    "italian",
    "german",
    "french",
    "spanish",
    "portuguese",
    "british",
  ],
  filipino: ["filipino"],
};

export function ethnicitiesForCultureFilter(
  filterId: CultureFilterId,
): string[] | null {
  return CULTURE_POI_ETHNICITIES[filterId] ?? null;
}

/** Culture chips that match ethnicities present on POIs (always includes All). */
export function availableCultureFiltersForEthnicities(
  ethnicities: Iterable<string>,
): CultureFilter[] {
  const present = new Set<string>();
  for (const e of ethnicities) present.add(e.toLowerCase());

  return CULTURE_FILTERS.filter((f) => {
    if (f.id === "all") return true;
    const ids = CULTURE_POI_ETHNICITIES[f.id];
    if (!ids?.length) return false;
    return ids.some((id) => present.has(id));
  });
}

export function poiMatchesQuery(
  poi: { name: string; category: string; address?: string | null; ethnicities?: string[] },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const text = [
    poi.name,
    poi.category,
    poi.address ?? "",
    ...(poi.ethnicities ?? []),
  ]
    .join(" ")
    .toLowerCase();
  if (text.includes(q)) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.length > 1 && tokens.every((t) => text.includes(t));
}
