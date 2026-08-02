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

  return n;
}
