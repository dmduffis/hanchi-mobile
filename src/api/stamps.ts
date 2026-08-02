import { apiFetch } from "./client";
import { supabase } from "../lib/supabase";

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

export async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) {
    throw new Error("Not signed in");
  }
  return id;
}

export async function fetchUserStamps(
  userId?: string,
): Promise<ApiStamp[]> {
  const id = userId ?? (await getUserId());
  return apiFetch<ApiStamp[]>(`/users/${id}/stamps`);
}

export async function createStamp(communityId: string): Promise<ApiStamp> {
  return apiFetch<ApiStamp>("/stamps", {
    method: "POST",
    body: JSON.stringify({ communityId }),
  });
}

export async function deleteStamp(
  communityId: string,
): Promise<{ stamped: false; communityId: string }> {
  return apiFetch("/stamps", {
    method: "DELETE",
    body: JSON.stringify({ communityId }),
  });
}

export async function toggleStamp(
  communityId: string,
): Promise<StampToggleResult> {
  return apiFetch<StampToggleResult>("/stamps/toggle", {
    method: "POST",
    body: JSON.stringify({ communityId }),
  });
}
