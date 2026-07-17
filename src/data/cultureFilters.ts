import type { Community } from "../types";

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
  "little-baghdad-sterling-heights": ["middle-eastern"],
  "banglatown-hamtramck": ["south-asian"],
  "mexicantown-detroit": ["latino"],
  "koreatown-la": ["korean"],
  "thai-town-la": [],
  "little-tokyo-la": [],
  "little-ethiopia-la": ["african"],
  "little-arabia-anaheim": ["middle-eastern"],
  "little-saigon-westminster": [],
};

function affinitiesFor(community: Community): CultureFilterId[] {
  return AFFINITIES[community.id] ?? [];
}

export function getCommunityAffinities(
  community: Community,
): CultureFilterId[] {
  return affinitiesFor(community);
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
