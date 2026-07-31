import { apiFetch } from "./client";

export type ApiStamp = {
  id: string;
  userId: string;
  communityId: string;
  earnedAt: string;
  community?: {
    id: string;
    name: string;
    neighborhood: string;
    city: string;
    description: string;
    heroEmoji: string | null;
    imageUrl: string | null;
  };
};

export type StampToggleResult = {
  stamped: boolean;
  communityId: string;
  userId?: string;
  id?: string;
  earnedAt?: string;
  community?: ApiStamp["community"];
};

export function getUserId(): string {
  return process.env.EXPO_PUBLIC_USER_ID?.trim() || "seed-user-1";
}

export function fetchUserStamps(userId = getUserId()): Promise<ApiStamp[]> {
  return apiFetch<ApiStamp[]>(`/users/${userId}/stamps`);
}

export function createStamp(
  communityId: string,
  userId = getUserId(),
): Promise<ApiStamp> {
  return apiFetch<ApiStamp>("/stamps", {
    method: "POST",
    body: JSON.stringify({ communityId, userId }),
  });
}

export function deleteStamp(
  communityId: string,
  userId = getUserId(),
): Promise<{ stamped: false; communityId: string }> {
  return apiFetch("/stamps", {
    method: "DELETE",
    body: JSON.stringify({ communityId, userId }),
  });
}

export function toggleStamp(
  communityId: string,
  userId = getUserId(),
): Promise<StampToggleResult> {
  return apiFetch<StampToggleResult>("/stamps/toggle", {
    method: "POST",
    body: JSON.stringify({ communityId, userId }),
  });
}
