import AsyncStorage from "@react-native-async-storage/async-storage";

const LIKED_KEY = "@hanchi/moment_likes_v1";
const COUNTS_KEY = "@hanchi/moment_like_counts_v1";

type LikeStore = {
  likedIds: string[];
  /** Total like counts including demo base + user toggles. */
  counts: Record<string, number>;
};

async function readStore(): Promise<LikeStore> {
  try {
    const [likedRaw, countsRaw] = await Promise.all([
      AsyncStorage.getItem(LIKED_KEY),
      AsyncStorage.getItem(COUNTS_KEY),
    ]);
    const likedIds = likedRaw ? (JSON.parse(likedRaw) as string[]) : [];
    const counts = countsRaw
      ? (JSON.parse(countsRaw) as Record<string, number>)
      : {};
    return {
      likedIds: Array.isArray(likedIds) ? likedIds : [],
      counts: counts && typeof counts === "object" ? counts : {},
    };
  } catch {
    return { likedIds: [], counts: {} };
  }
}

async function writeStore(store: LikeStore): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(LIKED_KEY, JSON.stringify(store.likedIds)),
    AsyncStorage.setItem(COUNTS_KEY, JSON.stringify(store.counts)),
  ]);
}

/**
 * Demo social proof for mock feed rows only.
 * Real journal / stamp / dish-try posts start at 0 likes.
 */
export function baseLikeCount(momentId: string): number {
  if (!momentId.startsWith("mock-")) return 0;
  let h = 0;
  for (let i = 0; i < momentId.length; i += 1) {
    h = (h * 33 + momentId.charCodeAt(i)) >>> 0;
  }
  return 1 + (h % 8);
}

export async function getMomentLikeState(momentId: string): Promise<{
  liked: boolean;
  count: number;
}> {
  const store = await readStore();
  const liked = store.likedIds.includes(momentId);
  const stored = store.counts[momentId];
  const base = baseLikeCount(momentId);
  return {
    liked,
    count: typeof stored === "number" ? stored : base,
  };
}

export async function getMomentLikesMap(
  momentIds: string[],
): Promise<Record<string, { liked: boolean; count: number }>> {
  const store = await readStore();
  const likedSet = new Set(store.likedIds);
  const out: Record<string, { liked: boolean; count: number }> = {};
  for (const id of momentIds) {
    const stored = store.counts[id];
    out[id] = {
      liked: likedSet.has(id),
      count: typeof stored === "number" ? stored : baseLikeCount(id),
    };
  }
  return out;
}

export async function toggleMomentLike(
  momentId: string,
): Promise<{ liked: boolean; count: number }> {
  const store = await readStore();
  const likedSet = new Set(store.likedIds);
  const wasLiked = likedSet.has(momentId);
  const current =
    typeof store.counts[momentId] === "number"
      ? store.counts[momentId]
      : baseLikeCount(momentId);

  if (wasLiked) {
    likedSet.delete(momentId);
    store.counts[momentId] = Math.max(0, current - 1);
  } else {
    likedSet.add(momentId);
    store.counts[momentId] = current + 1;
  }

  store.likedIds = [...likedSet];
  await writeStore(store);
  return {
    liked: !wasLiked,
    count: store.counts[momentId],
  };
}
