import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { createStamp, fetchUserStamps } from "../api/stamps";
import { colors } from "../theme";

type PassportStampButtonProps = {
  communityId: string;
  size?: number;
  /** When provided, skips the initial stamps fetch. */
  initialStamped?: boolean;
  /** Called after a successful stamp (or when already stamped is confirmed). */
  onStampedChange?: (stamped: boolean) => void;
};

export function PassportStampButton({
  communityId,
  size = 22,
  initialStamped,
  onStampedChange,
}: PassportStampButtonProps) {
  const [stamped, setStamped] = useState(initialStamped ?? false);
  const [loading, setLoading] = useState(initialStamped === undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialStamped !== undefined) {
      setStamped(initialStamped);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchUserStamps();
        if (cancelled) return;
        setStamped(list.some((s) => s.communityId === communityId));
      } catch {
        if (!cancelled) setStamped(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [communityId, initialStamped]);

  const onPress = useCallback(async () => {
    if (busy || stamped) return;
    setBusy(true);
    setStamped(true);
    onStampedChange?.(true);
    try {
      await createStamp(communityId);
    } catch {
      setStamped(false);
      onStampedChange?.(false);
    } finally {
      setBusy(false);
    }
  }, [busy, stamped, communityId, onStampedChange]);

  if (loading) {
    return (
      <Pressable style={styles.btn} disabled>
        <ActivityIndicator size="small" color={colors.forest} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      disabled={busy || stamped}
      accessibilityRole="button"
      accessibilityLabel={
        stamped ? "Already stamped in passport" : "Stamp passport"
      }
    >
      <Ionicons
        name={stamped ? "ribbon" : "ribbon-outline"}
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
  pressed: {
    opacity: 0.7,
  },
});
