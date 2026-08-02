import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconChevronRight } from "../icons";
import { colors, listTitle, typography } from "../theme";

type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Emoji / text thumbnail (ignored when `leading` is set). */
  thumbnail?: string;
  /** Custom leading node — e.g. CircularFlag. */
  leading?: React.ReactNode;
  onPress?: () => void;
  /** Trailing control (e.g. heart). */
  rightElement?: React.ReactNode;
  /** Renders under title/subtitle (e.g. price badge). */
  belowElement?: React.ReactNode;
  /** Vertical alignment for the trailing slot. */
  rightAlign?: "center" | "top";
  showChevron?: boolean;
};

export function ListRow({
  title,
  subtitle,
  thumbnail,
  leading,
  onPress,
  rightElement,
  belowElement,
  rightAlign = "center",
  showChevron = true,
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        rightAlign === "top" && styles.rowTop,
        pressed && styles.pressed,
      ]}
      disabled={!onPress}
    >
      {leading ? (
        <View style={styles.leading}>{leading}</View>
      ) : thumbnail ? (
        <View style={styles.thumb}>
          <Text style={styles.thumbText}>{thumbnail}</Text>
        </View>
      ) : null}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {belowElement ? (
          <View
            style={styles.below}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {belowElement}
          </View>
        ) : null}
      </View>
      {rightElement ? (
        <View
          style={styles.right}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {rightElement}
        </View>
      ) : null}
      {showChevron && onPress ? (
        <IconChevronRight size={18} color={colors.grayLight} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  rowTop: {
    alignItems: "flex-start",
  },
  pressed: {
    opacity: 0.7,
  },
  leading: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  thumbText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...listTitle,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  below: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  right: {
    flexShrink: 0,
  },
});
