import type { Community } from "../types";
import { WIKI_COMMUNITY_AFFINITIES } from "./generated/wikipediaCommunityMeta";

export type CultureFilterId =
  | "all"
  // East / Southeast Asia
  | "chinese"
  | "taiwanese"
  | "korean"
  | "japanese"
  | "vietnamese"
  | "thai"
  | "filipino"
  // South Asia
  | "indian"
  | "pakistani"
  | "bangladeshi"
  | "nepali"
  | "afghan"
  // Latin America
  | "mexican"
  | "colombian"
  | "dominican"
  | "ecuadorian"
  | "peruvian"
  | "venezuelan"
  | "cuban"
  | "puerto_rican"
  | "salvadoran"
  | "brazilian"
  | "guatemalan"
  // Caribbean
  | "jamaican"
  | "haitian"
  | "guyanese"
  | "trinidadian"
  // Africa
  | "senegalese"
  | "ghanaian"
  | "liberian"
  | "ethiopian"
  | "nigerian"
  | "somali"
  // MENA
  | "lebanese"
  | "syrian"
  | "palestinian"
  | "yemeni"
  | "egyptian"
  | "iraqi"
  | "moroccan"
  | "jordanian"
  | "iranian"
  | "turkish"
  // Europe
  | "polish"
  | "ukrainian"
  | "russian"
  | "albanian"
  | "greek"
  | "italian"
  | "german"
  | "french"
  | "spanish"
  | "portuguese"
  | "british";

export type CultureFilter = {
  id: CultureFilterId;
  label: string;
};

export const CULTURE_FILTERS: CultureFilter[] = [
  { id: "all", label: "All" },
  { id: "chinese", label: "Chinese" },
  { id: "taiwanese", label: "Taiwanese" },
  { id: "korean", label: "Korean" },
  { id: "japanese", label: "Japanese" },
  { id: "vietnamese", label: "Vietnamese" },
  { id: "thai", label: "Thai" },
  { id: "filipino", label: "Filipino" },
  { id: "indian", label: "Indian" },
  { id: "pakistani", label: "Pakistani" },
  { id: "bangladeshi", label: "Bangladeshi" },
  { id: "nepali", label: "Nepali" },
  { id: "afghan", label: "Afghan" },
  { id: "mexican", label: "Mexican" },
  { id: "colombian", label: "Colombian" },
  { id: "dominican", label: "Dominican" },
  { id: "ecuadorian", label: "Ecuadorian" },
  { id: "peruvian", label: "Peruvian" },
  { id: "venezuelan", label: "Venezuelan" },
  { id: "cuban", label: "Cuban" },
  { id: "puerto_rican", label: "Puerto Rican" },
  { id: "salvadoran", label: "Salvadoran" },
  { id: "brazilian", label: "Brazilian" },
  { id: "guatemalan", label: "Guatemalan" },
  { id: "jamaican", label: "Jamaican" },
  { id: "haitian", label: "Haitian" },
  { id: "guyanese", label: "Guyanese" },
  { id: "trinidadian", label: "Trinidadian" },
  { id: "senegalese", label: "Senegalese" },
  { id: "ghanaian", label: "Ghanaian" },
  { id: "liberian", label: "Liberian" },
  { id: "ethiopian", label: "Ethiopian" },
  { id: "nigerian", label: "Nigerian" },
  { id: "somali", label: "Somali" },
  { id: "lebanese", label: "Lebanese" },
  { id: "syrian", label: "Syrian" },
  { id: "palestinian", label: "Palestinian" },
  { id: "yemeni", label: "Yemeni" },
  { id: "egyptian", label: "Egyptian" },
  { id: "iraqi", label: "Iraqi" },
  { id: "moroccan", label: "Moroccan" },
  { id: "jordanian", label: "Jordanian" },
  { id: "iranian", label: "Iranian" },
  { id: "turkish", label: "Turkish" },
  { id: "polish", label: "Polish" },
  { id: "ukrainian", label: "Ukrainian" },
  { id: "russian", label: "Russian" },
  { id: "albanian", label: "Albanian" },
  { id: "greek", label: "Greek" },
  { id: "italian", label: "Italian" },
  { id: "german", label: "German" },
  { id: "french", label: "French" },
  { id: "spanish", label: "Spanish" },
  { id: "portuguese", label: "Portuguese" },
  { id: "british", label: "British" },
];

/**
 * Soft cultural affinities per enclave — country-level where possible.
 * An enclave can belong to several countries (e.g. Little Guyana → Guyanese + Indian).
 */
const AFFINITIES: Record<string, CultureFilterId[]> = {
  "chinatown-flushing": ["chinese"],
  "chinatown-manhattan": ["chinese"],
  "chinatown-sunset-park": ["chinese"],
  "guyana-gateway": ["guyanese", "indian"],
  "koreatown-manhattan": ["korean"],
  "koreatown-queens": ["korean"],
  "little-africa-si": ["liberian", "senegalese", "ghanaian"],
  "little-africa-bronx": ["ghanaian", "nigerian", "senegalese"],
  "little-albania": ["albanian"],
  "little-bangladesh": ["bangladeshi"],
  "little-bhod-tibet": ["nepali"],
  "little-caribbean": ["jamaican", "haitian", "trinidadian"],
  "little-colombia": ["colombian"],
  "little-dominican-republic": ["dominican"],
  "little-ecuador": ["ecuadorian"],
  "little-egypt": ["egyptian"],
  "little-guyana-queens": ["guyanese", "indian"],
  "little-guyana-bronx": ["guyanese", "indian"],
  "little-haiti": ["haitian"],
  "little-india": ["indian"],
  "little-manila": ["filipino"],
  "little-mexico-port-richmond": ["mexican"],
  "little-mexico-sunset-park": ["mexican"],
  "little-odessa": ["ukrainian", "russian"],
  "little-palestine": ["palestinian"],
  "little-pakistan": ["pakistani"],
  "little-poland": ["polish"],
  "little-senegal": ["senegalese"],
  "little-ukraine": ["ukrainian"],
  "little-yemen": ["yemeni"],
  // Greater Boston / CT / FL Brazilian corridors (curated, not wiki-tagged)
  "somerville-boston": ["brazilian"],
  "danbury-brazilian": ["brazilian"],
  "pompano-brazilian": ["brazilian"],
  "hollow-bridgeport": ["portuguese", "brazilian"],
  "little-india-hicksville": ["indian"],
  "little-portugal-mineola": ["portuguese"],
  "little-el-salvador-brentwood": ["salvadoran"],
  "koreatown-nassau": ["korean"],
  "little-arabia-dearborn": ["lebanese", "yemeni", "iraqi"],
  "yemeni-south-end-dearborn": ["yemeni"],
  "little-baghdad-sterling-heights": ["iraqi"],
  "banglatown-hamtramck": ["bangladeshi"],
  "mexicantown-detroit": ["mexican"],
  "koreatown-la": ["korean"],
  "thai-town-la": ["thai"],
  "little-tokyo-la": ["japanese"],
  "little-ethiopia-la": ["ethiopian"],
  "little-arabia-anaheim": ["syrian", "lebanese", "egyptian"],
  "little-saigon-westminster": ["vietnamese"],
  "japantown-sf": ["japanese"],
  "calle-24-sf": ["mexican", "salvadoran", "peruvian"],
  "soma-pilipinas-sf": ["filipino"],
  "sunset-chinese-sf": ["chinese"],
  // US cultural districts — not foreign-country / diaspora enclaves.
  "african-american-arts-sf": [],
  "pacific-islander-sf": [],
  "american-indian-sf": [],
};

const COUNTRY_HINTS: Array<{ id: CultureFilterId; re: RegExp }> = [
  // Asia
  { id: "chinese", re: /chinatown|chinese|china\b/ },
  { id: "taiwanese", re: /taiwan/ },
  { id: "korean", re: /korea/ },
  { id: "japanese", re: /japan|tokyo|nippon/ },
  { id: "vietnamese", re: /vietnam|saigon/ },
  { id: "thai", re: /\bthai\b|thailand/ },
  { id: "filipino", re: /filipino|filipina|pilipinas|manila|philippines/ },
  { id: "indian", re: /\bindia\b|indian(?!a)/ },
  { id: "pakistani", re: /pakistan/ },
  { id: "bangladeshi", re: /bangladesh|bangla/ },
  { id: "nepali", re: /nepal|tibet|bhod/ },
  { id: "afghan", re: /afghan/ },
  // Latin America
  { id: "mexican", re: /mexico|mexican/ },
  { id: "colombian", re: /colombia/ },
  { id: "dominican", re: /dominican/ },
  { id: "ecuadorian", re: /ecuador/ },
  { id: "peruvian", re: /peru/ },
  { id: "venezuelan", re: /venezuela/ },
  { id: "cuban", re: /\bcuba\b|cuban/ },
  { id: "puerto_rican", re: /puerto\s*ric/ },
  { id: "salvadoran", re: /salvador/ },
  { id: "brazilian", re: /brazil/ },
  { id: "guatemalan", re: /guatemala/ },
  // Caribbean
  { id: "jamaican", re: /jamaica/ },
  { id: "haitian", re: /haiti/ },
  { id: "guyanese", re: /guyana/ },
  { id: "trinidadian", re: /trinidad|tobago/ },
  // Africa
  { id: "senegalese", re: /senegal/ },
  { id: "ghanaian", re: /ghana/ },
  { id: "liberian", re: /liberia/ },
  { id: "ethiopian", re: /ethiopia/ },
  { id: "nigerian", re: /nigeria/ },
  { id: "somali", re: /somali/ },
  // MENA
  { id: "yemeni", re: /yemen/ },
  { id: "lebanese", re: /lebanon|lebanese/ },
  { id: "syrian", re: /syria|syrian/ },
  { id: "palestinian", re: /palestine|palestinian/ },
  { id: "egyptian", re: /egypt/ },
  { id: "iraqi", re: /iraq|baghdad/ },
  { id: "moroccan", re: /morocco|moroccan/ },
  { id: "jordanian", re: /jordan/ },
  { id: "iranian", re: /persian|iranian|tehrangeles|\biran\b/ },
  { id: "turkish", re: /turkish|turk\b|anatolia/ },
  // Europe
  { id: "polish", re: /poland|polish/ },
  { id: "ukrainian", re: /ukraine|ukrainian|odessa/ },
  { id: "russian", re: /russia|russian/ },
  { id: "albanian", re: /albania/ },
  { id: "greek", re: /\bgreek\b|greece/ },
  { id: "italian", re: /italy|italian/ },
  { id: "german", re: /german|germany/ },
  { id: "french", re: /\bfrench\b|france/ },
  { id: "spanish", re: /\bspain\b|spanish/ },
  { id: "portuguese", re: /portugal|portuguese/ },
  { id: "british", re: /british|england|uk\b/ },
];

function communityHaystack(community: Community): string {
  return [
    community.name,
    community.heritage,
    community.neighborhood,
    community.description,
    ...community.tags,
  ]
    .join(" ")
    .toLowerCase();
}

function countriesFromHaystack(hay: string): CultureFilterId[] {
  return COUNTRY_HINTS.filter((h) => h.re.test(hay)).map((h) => h.id);
}

/** Expand legacy broad wiki tags into country chips. */
function expandLegacyGroup(
  id: string,
  community: Community,
): CultureFilterId[] {
  const hay = communityHaystack(community);
  const fromName = countriesFromHaystack(hay);

  switch (id) {
    case "middle-eastern":
    case "arab":
      if (fromName.some((c) =>
        [
          "lebanese",
          "syrian",
          "palestinian",
          "yemeni",
          "egyptian",
          "iraqi",
          "moroccan",
          "jordanian",
          "iranian",
          "turkish",
        ].includes(c),
      )) {
        return fromName.filter((c) =>
          [
            "lebanese",
            "syrian",
            "palestinian",
            "yemeni",
            "egyptian",
            "iraqi",
            "moroccan",
            "jordanian",
            "iranian",
            "turkish",
          ].includes(c),
        );
      }
      if (/arabia|arab|middle.?east|mena/.test(hay)) {
        return ["lebanese", "yemeni", "syrian"];
      }
      return [];
    case "persian":
      return ["iranian"];
    case "latino":
    case "hispanic":
      if (fromName.some((c) =>
        [
          "mexican",
          "colombian",
          "dominican",
          "ecuadorian",
          "peruvian",
          "venezuelan",
          "cuban",
          "puerto_rican",
          "salvadoran",
          "brazilian",
          "guatemalan",
        ].includes(c),
      )) {
        return fromName.filter((c) =>
          [
            "mexican",
            "colombian",
            "dominican",
            "ecuadorian",
            "peruvian",
            "venezuelan",
            "cuban",
            "puerto_rican",
            "salvadoran",
            "brazilian",
            "guatemalan",
          ].includes(c),
        );
      }
      return ["mexican"];
    case "south-asian":
      if (fromName.some((c) =>
        ["indian", "pakistani", "bangladeshi", "nepali", "afghan"].includes(c),
      )) {
        return fromName.filter((c) =>
          ["indian", "pakistani", "bangladeshi", "nepali", "afghan"].includes(c),
        );
      }
      return ["indian"];
    case "caribbean":
      if (fromName.some((c) =>
        ["jamaican", "haitian", "guyanese", "trinidadian", "dominican"].includes(
          c,
        ),
      )) {
        return fromName.filter((c) =>
          ["jamaican", "haitian", "guyanese", "trinidadian", "dominican"].includes(
            c,
          ),
        );
      }
      return ["jamaican", "haitian"];
    case "african":
      if (fromName.some((c) =>
        [
          "senegalese",
          "ghanaian",
          "liberian",
          "ethiopian",
          "nigerian",
          "somali",
          "egyptian",
          "moroccan",
        ].includes(c),
      )) {
        return fromName.filter((c) =>
          [
            "senegalese",
            "ghanaian",
            "liberian",
            "ethiopian",
            "nigerian",
            "somali",
            "egyptian",
            "moroccan",
          ].includes(c),
        );
      }
      return ["senegalese", "nigerian", "ethiopian"];
    case "european":
      if (fromName.some((c) =>
        [
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
        ].includes(c),
      )) {
        return fromName.filter((c) =>
          [
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
          ].includes(c),
        );
      }
      return [];
    default:
      return [];
  }
}

function normalizeAffinityIds(
  id: string,
  community: Community,
): CultureFilterId[] {
  const legacy = expandLegacyGroup(id, community);
  if (legacy.length > 0) return legacy;
  if (CULTURE_FILTERS.some((f) => f.id === id)) return [id as CultureFilterId];
  // Unknown wiki tag — try country hints from the tag string itself.
  return countriesFromHaystack(id.replace(/-/g, " "));
}

function affinitiesFor(community: Community): CultureFilterId[] {
  const local = AFFINITIES[community.id];
  if (local) return local;
  const wiki = WIKI_COMMUNITY_AFFINITIES[community.id];
  if (!wiki?.length) {
    // Fall back to name/heritage parsing for untagged rows.
    return countriesFromHaystack(communityHaystack(community));
  }
  const out: CultureFilterId[] = [];
  for (const id of wiki) {
    for (const next of normalizeAffinityIds(id, community)) {
      if (!out.includes(next)) out.push(next);
    }
  }
  if (out.length === 0) {
    return countriesFromHaystack(communityHaystack(community));
  }
  return out;
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
  chinese: ["chinese", "chinatown", "china"],
  taiwanese: ["taiwanese", "taiwan"],
  korean: ["korean", "koreatown", "korea"],
  japanese: ["japanese", "japan", "tokyo"],
  vietnamese: ["vietnamese", "vietnam", "saigon", "pho"],
  thai: ["thai", "thailand"],
  filipino: ["filipino", "philippines", "manila", "pinoy"],
  indian: ["indian", "india", "desi"],
  pakistani: ["pakistani", "pakistan"],
  bangladeshi: ["bangladeshi", "bangladesh", "bangla"],
  nepali: ["nepali", "nepal", "tibet"],
  afghan: ["afghan", "afghanistan"],
  mexican: ["mexican", "mexico", "taco"],
  colombian: ["colombian", "colombia"],
  dominican: ["dominican", "dominica"],
  ecuadorian: ["ecuadorian", "ecuador"],
  peruvian: ["peruvian", "peru"],
  venezuelan: ["venezuelan", "venezuela"],
  cuban: ["cuban", "cuba"],
  puerto_rican: ["puerto rican", "puerto rico"],
  salvadoran: ["salvadoran", "el salvador"],
  brazilian: ["brazilian", "brazil"],
  guatemalan: ["guatemalan", "guatemala"],
  jamaican: ["jamaican", "jamaica"],
  haitian: ["haitian", "haiti"],
  guyanese: ["guyanese", "guyana"],
  trinidadian: ["trinidadian", "trinidad", "tobago"],
  senegalese: ["senegalese", "senegal"],
  ghanaian: ["ghanaian", "ghana"],
  liberian: ["liberian", "liberia"],
  ethiopian: ["ethiopian", "ethiopia"],
  nigerian: ["nigerian", "nigeria"],
  somali: ["somali", "somalia"],
  lebanese: ["lebanese", "lebanon"],
  syrian: ["syrian", "syria"],
  palestinian: ["palestinian", "palestine"],
  yemeni: ["yemeni", "yemen"],
  egyptian: ["egyptian", "egypt"],
  iraqi: ["iraqi", "iraq", "baghdad"],
  moroccan: ["moroccan", "morocco"],
  jordanian: ["jordanian", "jordan"],
  iranian: ["iranian", "persian", "iran", "farsi", "tehrangeles"],
  turkish: ["turkish", "turk", "anatolian"],
  polish: ["polish", "poland"],
  ukrainian: ["ukrainian", "ukraine", "odessa"],
  russian: ["russian", "russia"],
  albanian: ["albanian", "albania"],
  greek: ["greek", "greece"],
  italian: ["italian", "italy"],
  german: ["german", "germany"],
  french: ["french", "france"],
  spanish: ["spanish", "spain"],
  portuguese: ["portuguese", "portugal"],
  british: ["british", "england", "uk"],
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
    c.description,
    ...c.tags,
    affinityLabels,
    groupTerms,
    // City / metro aliases so "detroit", "long island", etc. resolve.
    c.heritage.includes("Detroit") ||
    c.tags.some((t) => /detroit|dearborn|hamtramck/i.test(t))
      ? "detroit dearborn sterling heights hamtramck"
      : "",
    c.heritage.includes("Long Island") ||
    c.tags.some((t) => /long island|nassau|hicksville|mineola|brentwood/i.test(t))
      ? "long island nassau suffolk hicksville mineola"
      : "",
    c.tags.some((t) => /los angeles/i.test(t))
      ? "los angeles la hollywood koreatown"
      : "",
    c.tags.some((t) => /anaheim|orange county|westminster/i.test(t))
      ? "anaheim orange county oc westminster garden grove saigon"
      : "",
    c.tags.some((t) => /san francisco/i.test(t))
      ? "san francisco sf bay area"
      : "",
    c.tags.some((t) => /chicago/i.test(t)) ? "chicago" : "",
    c.tags.some((t) => /houston/i.test(t)) ? "houston" : "",
    c.tags.some((t) => /seattle/i.test(t)) ? "seattle" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function communityMatchesQuery(
  community: Community,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const text = haystack(community);
  if (text.includes(q)) return true;

  // Multi-token: every token must appear somewhere.
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => text.includes(t))) return true;

  // Lightweight metro / nickname aliases.
  const aliases: Record<string, string[]> = {
    nyc: ["new york", "queens", "brooklyn", "manhattan", "bronx", "staten"],
    "new york": ["nyc", "queens", "brooklyn", "manhattan"],
    la: ["los angeles", "hollywood", "hollywood"],
    oc: ["orange county", "westminster", "anaheim", "garden grove"],
    sf: ["san francisco"],
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

  const cultureHit = affinitiesFor(community).some((id) => {
    if (id === q || id.includes(q) || (q.length >= 4 && q.includes(id))) {
      return true;
    }
    const terms = GROUP_SEARCH_TERMS[id] ?? [];
    return terms.some(
      (t) => t === q || t.includes(q) || (q.length >= 4 && q.includes(t)),
    );
  });

  let score = 0;
  if (name === q) score = 1000;
  else if (name.startsWith(q)) score = 850;
  else if (name.includes(q)) score = 700;
  else if (tokens.length > 1 && tokens.every((t) => name.includes(t)))
    score = 650;
  else if (cultureHit) score = 640;
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
  chinese: ["chinese"],
  taiwanese: ["taiwanese"],
  korean: ["korean"],
  japanese: ["japanese"],
  vietnamese: ["vietnamese"],
  thai: ["thai"],
  filipino: ["filipino"],
  indian: ["indian"],
  pakistani: ["pakistani"],
  bangladeshi: ["bangladeshi"],
  nepali: ["nepali"],
  afghan: ["afghan"],
  mexican: ["mexican"],
  colombian: ["colombian"],
  dominican: ["dominican"],
  ecuadorian: ["ecuadorian"],
  peruvian: ["peruvian"],
  venezuelan: ["venezuelan"],
  cuban: ["cuban"],
  puerto_rican: ["puerto_rican"],
  salvadoran: ["salvadoran"],
  brazilian: ["brazilian"],
  guatemalan: ["guatemalan"],
  jamaican: ["jamaican"],
  haitian: ["haitian"],
  guyanese: ["guyanese"],
  trinidadian: ["trinidadian", "caribbean"],
  senegalese: ["senegalese"],
  ghanaian: ["ghanaian"],
  liberian: ["liberian"],
  ethiopian: ["ethiopian"],
  nigerian: ["nigerian"],
  somali: ["somali"],
  lebanese: ["lebanese"],
  syrian: ["syrian"],
  palestinian: ["palestinian"],
  yemeni: ["yemeni"],
  egyptian: ["egyptian"],
  iraqi: ["iraqi"],
  moroccan: ["moroccan"],
  jordanian: ["jordanian"],
  iranian: ["iranian", "persian"],
  turkish: ["turkish"],
  polish: ["polish"],
  ukrainian: ["ukrainian"],
  russian: ["russian"],
  albanian: ["albanian"],
  greek: ["greek"],
  italian: ["italian"],
  german: ["german"],
  french: ["french"],
  spanish: ["spanish"],
  portuguese: ["portuguese"],
  british: ["british"],
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
  poi: {
    name: string;
    category: string;
    address?: string | null;
    ethnicities?: string[];
  },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const eth = (poi.ethnicities ?? []).join(" ");
  const text = `${poi.name} ${poi.category} ${poi.address ?? ""} ${eth}`.toLowerCase();
  if (text.includes(q)) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.length > 1 && tokens.every((t) => text.includes(t));
}
