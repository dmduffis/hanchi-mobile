/**
 * Helpers for community title / place / about copy on detail surfaces.
 */

/** Wiki import blurbs that just restate the title + section. */
export function isBoilerplateDescription(description: string): boolean {
  // No \b before the dash — space+em-dash is not a word boundary in JS.
  return /[—–-]\s*a\s+.+\s+cultural community in\b/i.test(description.trim());
}

/** About text worth showing — empty when boilerplate or blank. */
export function displayDescription(
  description: string | null | undefined,
): string {
  const trimmed = (description ?? "").trim();
  if (!trimmed || isBoilerplateDescription(trimmed)) return "";
  return trimmed;
}

/** Full US state / DC names → postal codes for tight place lines. */
const US_STATE_ABBREV: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
  "washington, d.c.": "DC",
  "washington, dc": "DC",
  "washington d.c.": "DC",
  "washington dc": "DC",
};

/** Shorten a trailing full state name so one-line place labels fit. */
export function abbreviatePlaceLine(place: string): string {
  const trimmed = place.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return trimmed;

  const last = parts[parts.length - 1]!.toLowerCase();
  const abbr = US_STATE_ABBREV[last];
  if (!abbr) return trimmed;

  parts[parts.length - 1] = abbr;
  return parts.join(", ");
}

/**
 * Single place line under the title — neighborhood (e.g. "Hicksville, Nassau").
 * No city pill; hide when it only restates the title.
 */
export function displayNeighborhood(
  name: string,
  neighborhood: string,
  _city?: string,
): string {
  const n = neighborhood.trim();
  if (!n) return "";
  if (name.trim().toLowerCase() === n.toLowerCase()) return "";

  // "Little India in Hicksville" + "Hicksville, Nassau" → keep place line.
  // "Excelsior District" + "Excelsior District, San Francisco" → hide (title covers it).
  const nameCore = name.replace(/\s+in\s+.+$/i, "").trim().toLowerCase();
  const neighCore = n.split(",")[0]?.trim().toLowerCase() ?? "";
  if (nameCore && neighCore && nameCore === neighCore) return "";

  return abbreviatePlaceLine(n);
}
