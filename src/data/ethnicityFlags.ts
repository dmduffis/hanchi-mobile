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
  moroccan: "🇲🇦",
  turkish: "🇹🇷",
  iranian: "🇮🇷",
  israeli: "🇮🇱",
  middle_eastern: "🇱🇧",
  albanian: "🇦🇱",
  greek: "🇬🇷",
  italian: "🇮🇹",
  polish: "🇵🇱",
  ukrainian: "🇺🇦",
  russian: "🇷🇺",
  german: "🇩🇪",
  french: "🇫🇷",
  spanish: "🇪🇸",
  brazilian: "🇧🇷",
  british: "🇬🇧",
};

/** Map restaurant ethnicity ids → up to 2 flag emojis. */
export function flagsForEthnicities(
  ethnicities: string[] | null | undefined,
): string {
  if (!ethnicities?.length) return "";
  const flags: string[] = [];
  for (const id of ethnicities) {
    const flag = ETHNICITY_FLAGS[id];
    if (!flag || flags.includes(flag)) continue;
    flags.push(flag);
    if (flags.length >= 2) break;
  }
  return flags.join("");
}
