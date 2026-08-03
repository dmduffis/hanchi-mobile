import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radii } from "../theme";

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  /** Circle diameter when set (overrides width/height). */
  circle?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Soft pulsing bone for loading placeholders. */
export function Skeleton({
  width = "100%",
  height = 14,
  circle,
  radius = radii.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const size = circle
    ? { width: circle, height: circle, borderRadius: circle / 2 }
    : { width, height, borderRadius: radius };

  return (
    <Animated.View
      style={[styles.bone, size, { opacity }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** List rows: thumb + two text lines (favorites, nearby, search). */
export function SkeletonListRows({
  count = 6,
  style,
}: {
  count?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.listRow}>
          <Skeleton circle={48} />
          <View style={styles.listText}>
            <Skeleton width="72%" height={14} />
            <Skeleton width="48%" height={12} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Home feed: map peek + section + rows. */
export function SkeletonHome() {
  return (
    <View style={styles.block}>
      <Skeleton height={160} radius={radii.lg} />
      <Skeleton width="42%" height={18} style={{ marginTop: 24 }} />
      <SkeletonListRows count={5} style={{ marginTop: 12 }} />
    </View>
  );
}

/** Full-screen detail (restaurant / community profile). */
export function SkeletonDetail() {
  return (
    <View style={styles.blockPad}>
      <View style={styles.detailNav}>
        <Skeleton circle={36} />
        <Skeleton width="50%" height={16} />
      </View>
      <Skeleton height={200} radius={radii.lg} style={{ marginTop: 12 }} />
      <Skeleton width="70%" height={22} style={{ marginTop: 20 }} />
      <Skeleton width="40%" height={14} style={{ marginTop: 10 }} />
      <Skeleton width="100%" height={12} style={{ marginTop: 18 }} />
      <Skeleton width="92%" height={12} style={{ marginTop: 8 }} />
      <Skeleton width="85%" height={12} style={{ marginTop: 8 }} />
      <SkeletonListRows count={3} style={{ marginTop: 28 }} />
    </View>
  );
}

/** Bottom sheet body while community detail loads. */
export function SkeletonSheet() {
  return (
    <View style={styles.sheetPad}>
      <Skeleton width="55%" height={22} />
      <Skeleton width="35%" height={12} style={{ marginTop: 8 }} />
      <Skeleton height={120} radius={radii.md} style={{ marginTop: 16 }} />
      <Skeleton width="30%" height={16} style={{ marginTop: 20 }} />
      <SkeletonListRows count={4} style={{ marginTop: 12 }} />
    </View>
  );
}

/** Moments feed skeleton. */
export function SkeletonMoments() {
  return (
    <View style={styles.block}>
      <SkeletonListRows count={5} />
    </View>
  );
}

/** Stamp collection grid skeleton. */
export function SkeletonStampGrid() {
  return (
    <View style={styles.block}>
      <Skeleton width="40%" height={14} />
      <View style={styles.stampRow}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} width={112} height={132} radius={radii.md} />
        ))}
      </View>
    </View>
  );
}

/** @deprecated Prefer SkeletonMoments / SkeletonStampGrid */
export function SkeletonPassport() {
  return <SkeletonStampGrid />;
}

/** Map boot: search chrome over a soft wash. */
export function SkeletonMapBoot() {
  return (
    <View style={styles.mapBoot}>
      <View style={styles.mapSearch}>
        <Skeleton height={48} radius={radii.full} />
        <View style={styles.mapChipRow}>
          <Skeleton width={96} height={34} radius={radii.full} />
          <Skeleton width={110} height={34} radius={radii.full} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: colors.border,
  },
  list: {
    gap: 0,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listText: {
    flex: 1,
  },
  block: {
    marginTop: 16,
  },
  blockPad: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flex: 1,
  },
  detailNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetPad: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flex: 1,
  },
  stampRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 20,
  },
  mapBoot: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mapSearch: {
    paddingHorizontal: 16,
    paddingTop: 56,
    gap: 12,
  },
  mapChipRow: {
    flexDirection: "row",
    gap: 8,
  },
});
