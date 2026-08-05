import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import {
  getMembership,
  listMyCollections,
  smartSave,
  type FavoriteType,
} from "../api/collections";
import { IconBookmark, IconBookmarkFilled } from "../icons";
import { colors } from "../theme";
import { SaveToCollectionSheet } from "./SaveToCollectionSheet";

type FavoriteHeartProps = {
  type: FavoriteType;
  targetId: string;
  size?: number;
  /** Outline circle around the control. */
  circled?: boolean;
  /** When provided, skips the initial membership fetch. */
  initialFavorited?: boolean;
  /** Fires after a successful toggle / sheet save. */
  onFavoritedChange?: (favorited: boolean) => void;
};

/**
 * Save control for places/dishes.
 * 0–1 collections: quick toggle on that list.
 * 2+ collections: opens Save to Collection sheet.
 */
export function FavoriteHeart({
  type,
  targetId,
  size = 22,
  circled = false,
  initialFavorited,
  onFavoritedChange,
}: FavoriteHeartProps) {
  const [saved, setSaved] = useState(initialFavorited ?? false);
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (initialFavorited !== undefined) {
      setSaved(initialFavorited);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const membership = await getMembership(type, targetId);
        if (!cancelled) setSaved(membership.saved);
      } catch {
        if (!cancelled) setSaved(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, targetId, initialFavorited]);

  const onPress = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const previous = saved;
    try {
      // If user has 2+ lists, always open the sheet for save control.
      const lists = await listMyCollections().catch(() => []);
      if (lists.length >= 2) {
        setSheetOpen(true);
        setBusy(false);
        return;
      }

      const next = !previous;
      setSaved(next);
      onFavoritedChange?.(next);

      const result = await smartSave(type, targetId);
      if (result.needsPicker) {
        setSaved(previous);
        onFavoritedChange?.(previous);
        setSheetOpen(true);
        return;
      }
      setSaved(result.saved);
      onFavoritedChange?.(result.saved);
    } catch {
      setSaved(previous);
      onFavoritedChange?.(previous);
    } finally {
      setBusy(false);
    }
  }, [busy, saved, type, targetId, onFavoritedChange]);

  const diameter = circled ? Math.max(size + 16, 36) : undefined;

  return (
    <>
      <Pressable
        onPress={onPress}
        hitSlop={circled ? 4 : 10}
        style={({ pressed }) => [
          styles.btn,
          circled && styles.circled,
          circled && diameter != null
            ? { width: diameter, height: diameter, borderRadius: diameter / 2 }
            : null,
          pressed && styles.pressed,
        ]}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={saved ? "Saved. Manage collections" : "Save"}
      >
        {saved ? (
          <IconBookmarkFilled size={size} color={colors.forest} />
        ) : (
          <IconBookmark size={size} color={colors.grayLight} />
        )}
      </Pressable>
      <SaveToCollectionSheet
        visible={sheetOpen}
        type={type}
        targetId={targetId}
        onClose={() => setSheetOpen(false)}
        onSaved={(next) => {
          setSaved(next);
          onFavoritedChange?.(next);
        }}
      />
    </>
  );
}

/** @deprecated Alias — same as FavoriteHeart */
export const SaveControl = FavoriteHeart;

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
  },
  circled: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.7,
  },
});
