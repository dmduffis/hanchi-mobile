import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import {
  isDishTried,
  toggleDishTry,
  type RecordDishTryInput,
} from "../lib/dishTries";
import { colors, radii, typography } from "../theme";

type DishTryButtonProps = {
  dish: RecordDishTryInput;
  /** When provided, skips the initial local lookup. */
  initialTried?: boolean;
  onTriedChange?: (tried: boolean) => void;
};

/**
 * Local “I tried this dish” toggle — writes a Moments dish_try until API exists.
 */
export function DishTryButton({
  dish,
  initialTried,
  onTriedChange,
}: DishTryButtonProps) {
  const [tried, setTried] = useState(initialTried ?? false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialTried !== undefined) {
      setTried(initialTried);
      return;
    }
    let cancelled = false;
    (async () => {
      const yes = await isDishTried(dish.dishId);
      if (!cancelled) setTried(yes);
    })();
    return () => {
      cancelled = true;
    };
  }, [dish.dishId, initialTried]);

  const onPress = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const previous = tried;
    const next = !previous;
    setTried(next);
    onTriedChange?.(next);
    try {
      const result = await toggleDishTry(dish);
      setTried(result.tried);
      onTriedChange?.(result.tried);
    } catch {
      setTried(previous);
      onTriedChange?.(previous);
    } finally {
      setBusy(false);
    }
  }, [busy, tried, dish, onTriedChange]);

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.btn,
        tried && styles.btnTried,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={tried ? "Remove tried mark" : "Mark dish as tried"}
    >
      <Text style={[styles.label, tried && styles.labelTried]}>
        {tried ? "Tried" : "Tried it"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnTried: {
    borderColor: colors.forest,
    backgroundColor: colors.forest,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    color: colors.ink,
  },
  labelTried: {
    color: colors.white,
  },
});
