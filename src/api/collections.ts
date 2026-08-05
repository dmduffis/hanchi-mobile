import { ApiError, apiFetch } from "./client";

export type FavoriteType = "community" | "restaurant" | "dish";

export type CollectionVisibility = "private" | "public";

export type ApiCollectionSummary = {
  id: string;
  name: string;
  description: string | null;
  visibility: CollectionVisibility;
  isDefault: boolean;
  shareSlug: string;
  itemCount: number;
  coverImages: string[];
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; displayName: string };
  followedAt?: string;
};

export type ApiCollectionItem = {
  id: string;
  type: FavoriteType;
  targetId: string;
  title: string;
  subtitle: string;
  communityId: string | null;
  restaurantId: string | null;
  emoji: string;
  imageUrl: string | null;
  ethnicities: string[];
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  savedAt: string;
};

export type ApiCollectionDetail = ApiCollectionSummary & {
  followerCount?: number;
  owner: { id: string; displayName: string };
  isOwner: boolean;
  following: boolean;
  items: ApiCollectionItem[];
};

export type MembershipResult = {
  saved: boolean;
  collectionIds: string[];
};

export type SmartSaveResult = {
  saved: boolean;
  collectionIds: string[];
  needsPicker?: boolean;
  error?: string;
  collectionCount?: number;
};

export async function listMyCollections(): Promise<ApiCollectionSummary[]> {
  return apiFetch<ApiCollectionSummary[]>("/collections");
}

export async function createCollection(input: {
  name: string;
  description?: string | null;
  visibility?: CollectionVisibility;
}): Promise<ApiCollectionSummary> {
  return apiFetch<ApiCollectionSummary>("/collections", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchCollection(
  id: string,
): Promise<ApiCollectionDetail> {
  return apiFetch<ApiCollectionDetail>(`/collections/${id}`);
}

export async function fetchCollectionBySlug(
  shareSlug: string,
): Promise<ApiCollectionDetail> {
  return apiFetch<ApiCollectionDetail>(`/collections/by-slug/${shareSlug}`);
}

export async function updateCollection(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    visibility?: CollectionVisibility;
  },
): Promise<ApiCollectionSummary> {
  return apiFetch<ApiCollectionSummary>(`/collections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteCollection(id: string): Promise<void> {
  await apiFetch(`/collections/${id}`, { method: "DELETE" });
}

export async function addCollectionItem(
  collectionId: string,
  type: FavoriteType,
  targetId: string,
  note?: string,
): Promise<ApiCollectionItem> {
  return apiFetch<ApiCollectionItem>(`/collections/${collectionId}/items`, {
    method: "POST",
    body: JSON.stringify({ type, targetId, note }),
  });
}

export async function removeCollectionItem(
  collectionId: string,
  type: FavoriteType,
  targetId: string,
): Promise<void> {
  await apiFetch(`/collections/${collectionId}/items`, {
    method: "DELETE",
    body: JSON.stringify({ type, targetId }),
  });
}

export async function getMembership(
  type: FavoriteType,
  targetId: string,
): Promise<MembershipResult> {
  const qs = new URLSearchParams({ type, targetId });
  try {
    return await apiFetch<MembershipResult>(`/collections/membership?${qs}`);
  } catch (e) {
    // Collections route may not be deployed yet; fall back to favorite list.
    if (!(e instanceof ApiError) || (e.status !== 404 && e.status !== 0)) {
      throw e;
    }
    try {
      const favs = await fetchUserFavorites();
      const hit = favs.some((f) => f.type === type && f.targetId === targetId);
      return { saved: hit, collectionIds: [] };
    } catch {
      return { saved: false, collectionIds: [] };
    }
  }
}

/**
 * Smart save: toggles sole collection, or when collectionIds provided sets membership.
 * Throws with needsPicker when 2+ collections and no ids.
 * Falls back to legacy /favorites/toggle when collections API is unavailable.
 */
export async function smartSave(
  type: FavoriteType,
  targetId: string,
  collectionIds?: string[],
): Promise<SmartSaveResult> {
  try {
    return await apiFetch<SmartSaveResult>("/collections/save", {
      method: "POST",
      body: JSON.stringify({
        type,
        targetId,
        ...(collectionIds ? { collectionIds } : {}),
      }),
    });
  } catch (e) {
    if (
      e instanceof ApiError &&
      (e.message === "needs_picker" || e.message.includes("needs_picker"))
    ) {
      return {
        saved: false,
        collectionIds: [],
        needsPicker: true,
        error: "needs_picker",
      };
    }
    // Multi-list set requires collections; no legacy equivalent.
    if (collectionIds) throw e;
    // Simple toggle only when /collections/save is missing (not deployed).
    // Do not retry when the target itself is missing.
    const looksLikeMissingRoute =
      e instanceof ApiError &&
      (e.status === 404 || e.status === 0 || e.status === 502) &&
      !/target not found/i.test(e.message);
    if (!looksLikeMissingRoute) throw e;
    const result = await toggleFavorite(type, targetId);
    return {
      saved: Boolean(result.favorited),
      collectionIds: [],
      needsPicker: false,
    };
  }
}

export async function listFollowingCollections(): Promise<
  ApiCollectionSummary[]
> {
  return apiFetch<ApiCollectionSummary[]>("/collections/following");
}

export async function followCollection(
  collectionId: string,
): Promise<{ following: boolean }> {
  return apiFetch(`/collections/${collectionId}/follow`, { method: "POST" });
}

export async function unfollowCollection(
  collectionId: string,
): Promise<{ following: boolean }> {
  return apiFetch(`/collections/${collectionId}/follow`, {
    method: "DELETE",
  });
}

// --- Back-compat favorite helpers (list membership across collections) ---

export type ApiFavorite = ApiCollectionItem & { favorited?: boolean };

export async function fetchUserFavorites(): Promise<ApiFavorite[]> {
  const { getUserId } = await import("./stamps");
  const id = await getUserId();
  return apiFetch<ApiFavorite[]>(`/users/${id}/favorites`);
}

export async function toggleFavorite(
  type: FavoriteType,
  targetId: string,
): Promise<ApiFavorite & { favorited?: boolean }> {
  return apiFetch(`/favorites/toggle`, {
    method: "POST",
    body: JSON.stringify({ type, targetId }),
  });
}
