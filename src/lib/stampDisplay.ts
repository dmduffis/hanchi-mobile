import type { ApiStamp } from "../api/stamps";
import { getCommunityCountryCode } from "../data/communityFlags";

export type StampCardModel = {
  id: string;
  stampId: string;
  communityName: string;
  subtitle: string;
  meta: string;
  countryCode: string | null;
  earnedAt: string;
};

export function formatStampMonth(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export type CommunityLookup = {
  id: string;
  name: string;
  neighborhood?: string;
  city?: string;
};

export function stampToCard(
  stamp: ApiStamp,
  communityById?: Map<string, CommunityLookup>,
): StampCardModel {
  const community = communityById?.get(stamp.communityId);
  const name = stamp.community?.name ?? community?.name ?? "Unknown place";
  const neighborhood =
    stamp.community?.neighborhood ?? community?.neighborhood ?? "";
  const city = stamp.community?.city ?? community?.city ?? "";
  const subtitle = [neighborhood, city].filter(Boolean).join(", ");
  return {
    id: stamp.communityId,
    stampId: stamp.id,
    communityName: name,
    subtitle: subtitle || name,
    meta: formatStampMonth(stamp.earnedAt),
    countryCode: getCommunityCountryCode(stamp.communityId) ?? null,
    earnedAt: stamp.earnedAt,
  };
}

export function sortStampsNewestFirst(stamps: ApiStamp[]): ApiStamp[] {
  return [...stamps].sort(
    (a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime(),
  );
}
