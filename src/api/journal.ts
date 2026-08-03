import { apiFetch } from "./client";
import { getUserId } from "./stamps";

export type ApiJournalEntry = {
  id: string;
  userId: string;
  communityId: string | null;
  poiId: string | null;
  note: string;
  photoUrl: string | null;
  createdAt: string;
};

export type CreateJournalInput = {
  note: string;
  communityId?: string | null;
  poiId?: string | null;
  photoUrl?: string | null;
};

export async function fetchUserJournal(
  userId?: string,
): Promise<ApiJournalEntry[]> {
  const id = userId ?? (await getUserId());
  return apiFetch<ApiJournalEntry[]>(`/users/${id}/journal`);
}

export async function createJournalEntry(
  input: CreateJournalInput,
): Promise<ApiJournalEntry> {
  return apiFetch<ApiJournalEntry>("/journal", {
    method: "POST",
    body: JSON.stringify({
      note: input.note,
      communityId: input.communityId ?? undefined,
      poiId: input.poiId ?? undefined,
      photoUrl: input.photoUrl ?? undefined,
    }),
  });
}
