import { apiFetch } from "./client";
import { getUserId } from "./stamps";

export type FavoriteType = "community" | "restaurant" | "dish";

export type ApiFavorite = {
  id?: string;
  type: FavoriteType;
  targetId: string;
  title: string;
  subtitle: string;
  communityId: string;
  restaurantId?: string | null;
  emoji: string;
  imageUrl?: string | null;
  ethnicities?: string[];
  latitude?: number | null;
  longitude?: number | null;
  savedAt?: string;
  favorited?: boolean;
};

export async function fetchUserFavorites(
  userId?: string,
): Promise<ApiFavorite[]> {
  const id = userId ?? (await getUserId());
  return apiFetch<ApiFavorite[]>(`/users/${id}/favorites`);
}

export function toggleFavorite(
  type: FavoriteType,
  targetId: string,
): Promise<ApiFavorite> {
  return apiFetch<ApiFavorite>("/favorites/toggle", {
    method: "POST",
    body: JSON.stringify({ type, targetId }),
  });
}
