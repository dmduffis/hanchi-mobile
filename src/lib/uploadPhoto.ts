import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { uploadMedia, type MediaPurpose, type UploadedMedia } from "../api/media";

export type LocalPhoto = {
  uri: string;
  width?: number;
  height?: number;
};

/** Longest edge after compress — keeps base64 payloads well under API limits. */
const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.65;
/** Soft target: re-compress if still larger (bytes ≈ base64 * 0.75). */
const TARGET_MAX_BYTES = 1.5 * 1024 * 1024;
export const MAX_MOMENT_PHOTOS = 6;

function resizeActions(
  width?: number,
  height?: number,
  maxEdge = MAX_EDGE,
): ImageManipulator.Action[] {
  const w = width ?? 0;
  const h = height ?? 0;
  if (w <= 0 && h <= 0) {
    // Unknown size (common on some picks): force downscale by width.
    return [{ resize: { width: maxEdge } }];
  }
  if (w >= h && w > maxEdge) return [{ resize: { width: maxEdge } }];
  if (h > maxEdge) return [{ resize: { height: maxEdge } }];
  return [];
}

async function compressAsset(asset: {
  uri: string;
  width?: number;
  height?: number;
}): Promise<LocalPhoto> {
  let uri = asset.uri;
  let width = asset.width;
  let height = asset.height;
  let quality = JPEG_QUALITY;
  let maxEdge = MAX_EDGE;

  for (let attempt = 0; attempt < 3; attempt++) {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      resizeActions(width, height, maxEdge),
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    uri = manipulated.uri;
    width = manipulated.width;
    height = manipulated.height;

    try {
      const info = await FileSystem.getInfoAsync(uri);
      const size =
        info.exists && "size" in info && typeof (info as { size?: number }).size === "number"
          ? (info as { size: number }).size
          : 0;
      if (size > 0 && size <= TARGET_MAX_BYTES) break;
    } catch {
      break;
    }

    quality = Math.max(0.45, quality - 0.15);
    maxEdge = Math.round(maxEdge * 0.75);
  }

  return { uri, width, height };
}

/**
 * Open gallery for a single photo (avatars, etc.).
 */
export async function pickPhoto(): Promise<LocalPhoto | null> {
  const photos = await pickPhotos(1);
  return photos[0] ?? null;
}

/**
 * Open gallery for up to `remaining` photos (Moments multi-attach).
 */
export async function pickPhotos(remaining: number): Promise<LocalPhoto[]> {
  if (remaining <= 0) return [];

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library access is required to add a photo.");
  }

  const multi = remaining > 1;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: !multi,
    allowsMultipleSelection: multi,
    selectionLimit: remaining,
    quality: 1,
    exif: false,
  });

  if (result.canceled || !result.assets?.length) return [];

  const out: LocalPhoto[] = [];
  for (const asset of result.assets.slice(0, remaining)) {
    out.push(await compressAsset(asset));
  }
  return out;
}

/**
 * Read local uri as base64, upload for moderation + store.
 */
export async function uploadLocalPhoto(
  purpose: MediaPurpose,
  localUri: string,
): Promise<UploadedMedia> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uploadMedia({ purpose, imageBase64: base64 });
}
