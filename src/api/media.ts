import { apiFetch } from "./client";

export type MediaPurpose = "moment" | "avatar";

export type UploadedMedia = {
  mediaId: string;
  purpose: MediaPurpose;
  status: "approved" | "pending" | "rejected";
  publicUrl: string | null;
};

/**
 * Upload a photo for moderation + storage.
 * Server hard-blocks unsafe content before returning a public URL.
 */
export async function uploadMedia(input: {
  purpose: MediaPurpose;
  imageBase64: string;
}): Promise<UploadedMedia> {
  return apiFetch<UploadedMedia>("/media", {
    method: "POST",
    body: JSON.stringify({
      purpose: input.purpose,
      imageBase64: input.imageBase64,
    }),
  });
}
