import type { UserIntent } from "../api/users";
import {
  WORLD_COUNTRIES,
  countryFlagEmoji,
  getWorldCountry,
  type WorldCountry,
} from "./worldCountries";
import { ETHNICITY_COUNTRY_CODES, ETHNICITY_FLAGS } from "./ethnicityFlags";

export type IntentOption = {
  id: UserIntent;
  label: string;
  description: string;
};

/** Maps to Hanchi personas (Maya, Sofia/Diego, Sam, Jordan). */
export const INTENT_OPTIONS: IntentOption[] = [
  {
    id: "explore",
    label: "I want to try something new",
    description: "Surprise me with a community or dish nearby",
  },
  {
    id: "home",
    label: "I’m looking for a taste of home",
    description: "Food and places from a culture I know well",
  },
  {
    id: "learn",
    label: "I want to learn the story behind a place",
    description: "History, neighborhoods, and local voices",
  },
  {
    id: "bite",
    label: "I just need something good to eat",
    description: "A solid nearby option, nothing complicated",
  },
];

export const INTENT_LABELS: Record<UserIntent, string> = {
  explore: "Trying something new",
  home: "Looking for a taste of home",
  learn: "Learning the story behind a place",
  bite: "Finding a good bite nearby",
};

export type CultureOption = {
  id: string;
  label: string;
  countryCode?: string;
  flag: string;
};

/** Whole-world country list for culture onboarding (ISO ids). */
export const ONBOARDING_CULTURES: CultureOption[] = WORLD_COUNTRIES.map(
  (c: WorldCountry) => ({
    id: c.id,
    label: c.label,
    countryCode: c.countryCode,
    flag: countryFlagEmoji(c.countryCode),
  }),
);

/** Legacy ethnicity slug → ISO (for older saved prefs). */
const ETHNICITY_TO_COUNTRY: Record<string, string> = {
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
  senegalese: "sn",
  ghanaian: "gh",
  ethiopian: "et",
  nigerian: "ng",
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
  albanian: "al",
  greek: "gr",
  italian: "it",
  polish: "pl",
  ukrainian: "ua",
  russian: "ru",
  portuguese: "pt",
  salvadoran: "sv",
  brazilian: "br",
  british: "gb",
  french: "fr",
  german: "de",
  spanish: "es",
};

export function resolveCultureId(raw: string): string {
  const slug = raw.trim().toLowerCase();
  if (getWorldCountry(slug)) return slug;
  return ETHNICITY_TO_COUNTRY[slug] ?? slug;
}

export function cultureLabel(slug: string): string {
  const id = resolveCultureId(slug);
  const country = getWorldCountry(id);
  if (country) return country.label;
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function cultureCountryCode(slug: string): string | undefined {
  const id = resolveCultureId(slug);
  return (
    getWorldCountry(id)?.countryCode ??
    ETHNICITY_COUNTRY_CODES[slug] ??
    ETHNICITY_COUNTRY_CODES[id]
  );
}

export function cultureFlag(slug: string): string {
  const id = resolveCultureId(slug);
  const code = cultureCountryCode(slug);
  if (code) return countryFlagEmoji(code);
  return ETHNICITY_FLAGS[slug] ?? ETHNICITY_FLAGS[id] ?? "🏳️";
}
