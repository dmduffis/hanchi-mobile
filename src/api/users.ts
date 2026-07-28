import { apiFetch } from "./client";

export type UserIntent = "explore" | "home" | "learn" | "bite";

export type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  intents: UserIntent[] | string[];
  cultures: string[];
};

export function fetchMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>("/users/me");
}

export function updateMe(body: {
  intents?: UserIntent[];
  cultures?: string[];
}): Promise<ApiUser> {
  return apiFetch<ApiUser>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
