import { apiFetch } from "./client";

export type UserIntent = "explore" | "home" | "learn" | "bite";

export type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  intents: UserIntent[] | string[];
  cultures: string[];
};

export function fetchMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>("/users/me");
}

export function updateMe(body: {
  intents?: UserIntent[];
  cultures?: string[];
  /** Approved /media id (purpose avatar), or null to clear. */
  avatarMediaId?: string | null;
}): Promise<ApiUser> {
  return apiFetch<ApiUser>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
