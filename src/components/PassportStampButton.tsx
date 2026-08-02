import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { fetchUserStamps, toggleStamp } from "../api/stamps";
import { colors } from "../theme";
import { PostageStampIcon } from "./stamp/PostageStampIcon";

type PassportStampButtonProps = {
  communityId: string;
  size?: number;
  /** Shrink hit box for dense headers (icon size unchanged). */
  compact?: boolean;
  /** When provided, skips the initial stamps fetch. */
  initialStamped?: boolean;
  /** Called after stamp state changes. */
  onStampedChange?: (stamped: boolean) => void;
};

export function PassportStampButton({
  communityId,
  size = 22,
  compact = false,
  initialStamped,
  onStampedChange,
}: PassportStampButtonProps) {
  const [stamped, setStamped] = useState(initialStamped ?? false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialStamped !== undefined) {
      setStamped(initialStamped);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const list = await fetchUserStamps();
        if (cancelled) return;
        setStamped(list.some((s) => s.communityId === communityId));
      } catch {
        if (!cancelled) setStamped(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [communityId, initialStamped]);

  const onPress = useCallback(async () => {
    if (busy) return;
    const next = !stamped;
    setBusy(true);
    setStamped(next);
    onStampedChange?.(next);
    try {
      const result = await toggleStamp(communityId);
      setStamped(result.stamped);
      onStampedChange?.(result.stamped);
    } catch {
      setStamped(!next);
      onStampedChange?.(!next);
    } finally {
      setBusy(false);
    }
  }, [busy, stamped, communityId, onStampedChange]);

  const btnStyle = compact ? styles.btnCompact : styles.btn;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={compact ? 6 : 8}
      style={({ pressed }) => [btnStyle, pressed && styles.pressed]}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={
        stamped ? "Remove stamp from passport" : "Stamp passport"
      }
    >
      <PostageStampIcon
        size={size}
        color={stamped ? colors.gold : colors.grayLight}
      />
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
  btnCompact: {
    width: 28,
    height: 40,
    marginLeft: -8,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
