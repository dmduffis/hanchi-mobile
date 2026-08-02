import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import {
  fetchUserFavorites,
  toggleFavorite,
  type FavoriteType,
} from "../api/favorites";
import { IconHeart, IconHeartFilled } from "../icons";
import { colors } from "../theme";

type FavoriteHeartProps = {
  type: FavoriteType;
  targetId: string;
  size?: number;
  /** When provided, skips the initial favorites fetch. */
  initialFavorited?: boolean;
  /** Fires after a successful toggle (or optimistic update). */
  onFavoritedChange?: (favorited: boolean) => void;
};

export function FavoriteHeart({
  type,
  targetId,
  size = 22,
  initialFavorited,
  onFavoritedChange,
}: FavoriteHeartProps) {
  const [favorited, setFavorited] = useState(initialFavorited ?? false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialFavorited !== undefined) {
      setFavorited(initialFavorited);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const list = await fetchUserFavorites();
        if (cancelled) return;
        setFavorited(
          list.some((f) => f.type === type && f.targetId === targetId),
        );
      } catch {
        if (!cancelled) setFavorited(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, targetId, initialFavorited]);

  const onPress = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const previous = favorited;
    const next = !previous;
    setFavorited(next);
    onFavoritedChange?.(next);
    try {
      const result = await toggleFavorite(type, targetId);
      const confirmed = Boolean(result.favorited);
      setFavorited(confirmed);
      onFavoritedChange?.(confirmed);
    } catch {
      setFavorited(previous);
      onFavoritedChange?.(previous);
    } finally {
      setBusy(false);
    }
  }, [busy, favorited, type, targetId, onFavoritedChange]);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={
        favorited ? "Remove from favorites" : "Add to favorites"
      }
    >
      {favorited ? (
        <IconHeartFilled size={size} color={colors.heart} />
      ) : (
        <IconHeart size={size} color={colors.grayLight} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
