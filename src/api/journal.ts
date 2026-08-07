import { apiFetch } from "./client";
import { getUserId } from "./stamps";

export type ApiJournalEntry = {
  id: string;
  userId: string;
  communityId: string | null;
  poiId: string | null;
  note: string;
  photoUrl: string | null;
  photoUrls?: string[];
  createdAt: string;
  communityName?: string | null;
  poiName?: string | null;
  poi?: {
    id: string;
    name: string;
    communityId: string | null;
    category: string;
    ethnicities?: string[];
  } | null;
};

export type CreateJournalInput = {
  note: string;
  communityId?: string | null;
  poiId?: string | null;
  /** Up to 6 approved media ids from POST /media (purpose moment). */
  mediaIds?: string[] | null;
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
      mediaIds: input.mediaIds?.length ? input.mediaIds : undefined,
    }),
  });
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await apiFetch<{ ok: boolean; id: string }>(
    `/journal/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export type UpdateJournalInput = {
  note?: string;
  communityId?: string | null;
  poiId?: string | null;
};

export async function updateJournalEntry(
  id: string,
  input: UpdateJournalInput,
): Promise<ApiJournalEntry> {
  return apiFetch<ApiJournalEntry>(`/journal/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      note: input.note,
      communityId: input.communityId,
      poiId: input.poiId,
    }),
  });
}
