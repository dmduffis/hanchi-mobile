/** Ethnicity ids stored on POIs → flag emoji for display. */
export const ETHNICITY_FLAGS: Record<string, string> = {
  korean: "🇰🇷",
  japanese: "🇯🇵",
  chinese: "🇨🇳",
  taiwanese: "🇹🇼",
  filipino: "🇵🇭",
  vietnamese: "🇻🇳",
  thai: "🇹🇭",
  indonesian: "🇮🇩",
  malaysian: "🇲🇾",
  indian: "🇮🇳",
  pakistani: "🇵🇰",
  bangladeshi: "🇧🇩",
  nepali: "🇳🇵",
  afghan: "🇦🇫",
  mexican: "🇲🇽",
  colombian: "🇨🇴",
  dominican: "🇩🇴",
  ecuadorian: "🇪🇨",
  peruvian: "🇵🇪",
  venezuelan: "🇻🇪",
  cuban: "🇨🇺",
  puerto_rican: "🇵🇷",
  jamaican: "🇯🇲",
  haitian: "🇭🇹",
  guyanese: "🇬🇾",
  trinidadian: "🇹🇹",
  /** Generic Yelp label — prefer specific Caribbean tags when present. */
  caribbean: "🇯🇲",
  senegalese: "🇸🇳",
  ghanaian: "🇬🇭",
  liberian: "🇱🇷",
  ethiopian: "🇪🇹",
  nigerian: "🇳🇬",
  somali: "🇸🇴",
  west_african: "🌍",
  egyptian: "🇪🇬",
  lebanese: "🇱🇧",
  syrian: "🇸🇾",
  palestinian: "🇵🇸",
  yemeni: "🇾🇪",
  iraqi: "🇮🇶",
  moroccan: "🇲🇦",
  turkish: "🇹🇷",
  iranian: "🇮🇷",
  israeli: "🇮🇱",
  jewish: "✡️",
  middle_eastern: "🇱🇧",
  albanian: "🇦🇱",
  greek: "🇬🇷",
  serbian: "🇷🇸",
  bosnian: "🇧🇦",
  croatian: "🇭🇷",
  romanian: "🇷🇴",
  italian: "🇮🇹",
  polish: "🇵🇱",
  ukrainian: "🇺🇦",
  russian: "🇷🇺",
  german: "🇩🇪",
  french: "🇫🇷",
  spanish: "🇪🇸",
  brazilian: "🇧🇷",
  portuguese: "🇵🇹",
  salvadoran: "🇸🇻",
  british: "🇬🇧",
};

/**
 * Ethnicity ids → circle-flags ISO country codes
 * (via react-native-circle-flags / HatScripts).
 */
export const ETHNICITY_COUNTRY_CODES: Record<string, string> = {
  korean: "kr",
  japanese: "jp",
  chinese: "cn",
  taiwanese: "tw",
  filipino: "ph",
  vietnamese: "vn",
  thai: "th",
  indonesian: "id",
  malaysian: "my",
  indian: "in",
  pakistani: "pk",
  bangladeshi: "bd",
  nepali: "np",
  afghan: "af",
  mexican: "mx",
  colombian: "co",
  dominican: "do",
  ecuadorian: "ec",
  peruvian: "pe",
  venezuelan: "ve",
  cuban: "cu",
  puerto_rican: "pr",
  jamaican: "jm",
  haitian: "ht",
  guyanese: "gy",
  trinidadian: "tt",
  caribbean: "jm",
  senegalese: "sn",
  ghanaian: "gh",
  liberian: "lr",
  ethiopian: "et",
  nigerian: "ng",
  somali: "so",
  egyptian: "eg",
  lebanese: "lb",
  syrian: "sy",
  palestinian: "ps",
  yemeni: "ye",
  iraqi: "iq",
  moroccan: "ma",
  turkish: "tr",
  iranian: "ir",
  israeli: "il",
  middle_eastern: "lb",
  albanian: "al",
  greek: "gr",
  serbian: "rs",
  bosnian: "ba",
  croatian: "hr",
  romanian: "ro",
  italian: "it",
  polish: "pl",
  ukrainian: "ua",
  russian: "ru",
  german: "de",
  french: "fr",
  spanish: "es",
  brazilian: "br",
  portuguese: "pt",
  salvadoran: "sv",
  british: "gb",
  // west_african has no single country — omit so UI falls back to emoji
};

export type EthnicityFlag = {
  ethnicity: string;
  countryCode?: string;
  emoji: string;
};

/** Broad labels that should not win over a more specific culture on the same POI. */
const GENERIC_ETHNICITIES = new Set([
  "caribbean",
  "middle_eastern",
  "west_african",
]);

function orderedEthnicitiesForFlags(
  ethnicities: string[] | null | undefined,
): string[] {
  if (!ethnicities?.length) return [];
  const specific = ethnicities.filter((id) => !GENERIC_ETHNICITIES.has(id));
  const generic = ethnicities.filter((id) => GENERIC_ETHNICITIES.has(id));
  return specific.length > 0 ? [...specific, ...generic] : ethnicities;
}

/** Up to 2 ethnicity flag descriptors for a restaurant. */
export function ethnicityFlagsFor(
  ethnicities: string[] | null | undefined,
): EthnicityFlag[] {
  const ordered = orderedEthnicitiesForFlags(ethnicities);
  if (!ordered.length) return [];
  const out: EthnicityFlag[] = [];
  const seen = new Set<string>();

  for (const id of ordered) {
    const emoji = ETHNICITY_FLAGS[id];
    if (!emoji) continue;
    const countryCode = ETHNICITY_COUNTRY_CODES[id];
    const key = countryCode ?? emoji;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ethnicity: id, countryCode, emoji });
    if (out.length >= 2) break;
  }
  return out;
}

/** Primary ethnicity country code for map pins (first with a code). */
export function primaryEthnicityCountryCode(
  ethnicities: string[] | null | undefined,
): string | undefined {
  for (const id of orderedEthnicitiesForFlags(ethnicities)) {
    const code = ETHNICITY_COUNTRY_CODES[id];
    if (code) return code;
  }
  return undefined;
}

/** Primary ethnicity emoji fallback for map pins. */
export function primaryEthnicityEmoji(
  ethnicities: string[] | null | undefined,
): string {
  for (const id of orderedEthnicitiesForFlags(ethnicities)) {
    const emoji = ETHNICITY_FLAGS[id];
    if (emoji) return emoji;
  }
  return "🍽️";
}

/** @deprecated Prefer ethnicityFlagsFor + CircularFlag. */
export function flagsForEthnicities(
  ethnicities: string[] | null | undefined,
): string {
  return ethnicityFlagsFor(ethnicities)
    .map((f) => f.emoji)
    .join("");
}
