import { mockPeerMoments } from "../data/mockMoments";
import type { MomentItem } from "../types";
import type { StoredDishTry } from "./dishTries";

export type ProofFace = {
  name: string;
  countryCode?: string | null;
  flag?: string | null;
};

export type SocialProof = {
  /** Short line under community / dish cards. */
  label: string;
  faces: ProofFace[];
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRelativeShort(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return "";
}

/** Stable 1–3 demo counts when we lack live activity (offline / cold demo). */
function demoCount(seed: string, min = 1, max = 4): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return min + (h % (max - min + 1));
}

function recentPeerMoments(): MomentItem[] {
  const cutoff = Date.now() - WEEK_MS;
  return mockPeerMoments.filter((m) => {
    const t = new Date(m.createdAt).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
}

/**
 * Social proof for a community row: stamps + check-ins nearby this week.
 * Uses Moments peer activity when available, then a stable demo line.
 */
export function communitySocialProof(
  communityId: string,
): SocialProof | null {
  const hits = recentPeerMoments().filter(
    (m) =>
      m.communityId === communityId &&
      (m.activity === "stamp" ||
        m.activity === "post" ||
        m.activity === "dish_try"),
  );

  if (hits.length > 0) {
    hits.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const latest = hits[0];
    const uniquePeople = [
      ...new Map(
        hits.map((h) => [
          h.authorName,
          {
            name: h.authorName,
            countryCode: h.authorCountryCode,
            flag: h.authorFlag,
          } satisfies ProofFace,
        ]),
      ).values(),
    ];
    const when = formatRelativeShort(latest.createdAt);
    const verb =
      latest.activity === "stamp"
        ? "stamped"
        : latest.activity === "dish_try"
          ? "tried food here"
          : "checked in";

    if (uniquePeople.length === 1) {
      return {
        label: when
          ? `${latest.authorName} ${verb} · ${when}`
          : `${latest.authorName} ${verb}`,
        faces: uniquePeople.slice(0, 3),
      };
    }
    return {
      label: when
        ? `${uniquePeople.length} people marked this · latest ${when}`
        : `${uniquePeople.length} people marked this recently`,
      faces: uniquePeople.slice(0, 3),
    };
  }

  // Demo fallback so Home still shows proof without a full activity API.
  const n = demoCount(communityId, 2, 6);
  return {
    label: `${n} people marked this recently`,
    faces: [],
  };
}

/**
 * Social proof for a dish card: local try + peer dish_try by name / community.
 */
export function dishSocialProof(
  dish: {
    id: string;
    name: string;
    communityId?: string | null;
    poiId?: string;
  },
  ownTries: StoredDishTry[] = [],
): SocialProof | null {
  const dishKey = normalizeName(dish.name);
  const peerHits = recentPeerMoments().filter((m) => {
    if (m.activity !== "dish_try") return false;
    if (m.dishId && m.dishId === dish.id) return true;
    if (m.dishName && normalizeName(m.dishName) === dishKey) return true;
    // Same neighborhood + overlapping name tokens
    if (
      dish.communityId &&
      m.communityId === dish.communityId &&
      m.dishName &&
      (normalizeName(m.dishName).includes(dishKey) ||
        dishKey.includes(normalizeName(m.dishName)))
    ) {
      return true;
    }
    return false;
  });

  const ownHit = ownTries.find(
    (t) =>
      t.dishId === dish.id ||
      normalizeName(t.dishName) === dishKey ||
      (dish.communityId &&
        t.communityId === dish.communityId &&
        normalizeName(t.dishName) === dishKey),
  );

  const faces: ProofFace[] = [];
  for (const h of peerHits) {
    if (!faces.some((f) => f.name === h.authorName)) {
      faces.push({
        name: h.authorName,
        countryCode: h.authorCountryCode,
        flag: h.authorFlag,
      });
    }
  }
  if (ownHit && !faces.some((f) => f.name === "You")) {
    faces.unshift({ name: "You" });
  }

  const totalPeople = faces.length || peerHits.length + (ownHit ? 1 : 0);
  const latestIso =
    peerHits
      .map((h) => h.createdAt)
      .concat(ownHit ? [ownHit.createdAt] : [])
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
  const when = latestIso ? formatRelativeShort(latestIso) : "";

  if (ownHit && peerHits.length === 0) {
    return {
      label: when ? `You tried this · ${when}` : "You tried this",
      faces,
    };
  }

  if (totalPeople === 1 && faces[0]) {
    const who = faces[0].name;
    return {
      label: when ? `${who} tried this · ${when}` : `${who} tried this`,
      faces,
    };
  }

  if (totalPeople > 1) {
    return {
      label: when
        ? `${totalPeople} tried this · latest ${when}`
        : `${totalPeople} people tried this`,
      faces: faces.slice(0, 3),
    };
  }

  // Demo: show mild interest so the rail always feels alive.
  const n = demoCount(dish.id || dish.name, 1, 5);
  return {
    label: n === 1 ? "1 person tried this recently" : `${n} tried this recently`,
    faces: [],
  };
}
