import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  stampInkForCommunity,
  stampMotifForCommunity,
  stampTiltForCommunity,
  stampTitleForCommunity,
} from "../data/stampPlaceTypes";
import { colors, typography } from "../theme";
import { StampPlaceIcon } from "./stamp/StampPlaceIcon";
import { StampShapeFrame } from "./stamp/StampShapeFrame";

/** Landscape stamp card size — room for white gutter + content */
const STAMP_W = 188;
const STAMP_H = 132;

type StampProps = {
  communityId: string;
  name: string;
  subtitle?: string;
  meta?: string;
  countryCode?: string | null;
  earned?: boolean;
  size?: "md" | "sm";
  onPress?: () => void;
  disabled?: boolean;
  emoji?: string;
  label?: string;
};

/**
 * Passport stamp — landscape perforated frame, light tilt, one place icon.
 */
export function Stamp({
  communityId,
  name,
  label,
  subtitle,
  meta,
  countryCode,
  earned = true,
  size = "md",
  onPress,
  disabled = false,
}: StampProps) {
  const title = stampTitleForCommunity(name || label || "Place");
  const motif = stampMotifForCommunity(communityId);
  const tilt = stampTiltForCommunity(communityId);
  const ink = earned ? stampInkForCommunity(communityId) : colors.grayLight;
  const code = countryCode?.trim().toUpperCase().slice(0, 2) || "—";
  const isSm = size === "sm";
  const w = isSm ? 156 : STAMP_W;
  const h = isSm ? 110 : STAMP_H;
  const tiltPad = 14;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.wrap,
        { width: w + tiltPad * 2 },
        pressed && onPress && !disabled && styles.pressed,
      ]}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={
        earned ? `${title}, stamped` : `Stamp ${title} in your passport`
      }
    >
      <View style={[styles.tiltBox, { padding: tiltPad }]}>
        <View style={{ transform: [{ rotate: `${tilt}deg` }] }}>
          <StampShapeFrame
            color={ink}
            width={w}
            height={h}
            strokeWidth={earned ? 2.25 : 1.75}
          >
            <View style={styles.face}>
              <Text
                style={[styles.title, { color: ink }, isSm && styles.titleSm]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              <View style={styles.bottomRow}>
                <Text
                  style={[styles.code, { color: ink }, isSm && styles.codeSm]}
                >
                  {code}
                </Text>
                <StampPlaceIcon
                  type={motif}
                  color={ink}
                  size={isSm ? 30 : 36}
                />
              </View>
            </View>
          </StampShapeFrame>
        </View>
      </View>

      {(subtitle || meta) && (
        <View style={styles.caption}>
          {subtitle ? (
            <Text style={styles.captionLine} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {meta ? (
            <Text style={styles.captionMeta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  tiltBox: {
    overflow: "visible",
  },
  pressed: {
    opacity: 0.78,
  },
  face: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  titleSm: {
    fontSize: 13,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  code: {
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  codeSm: {
    fontSize: 12,
  },
  caption: {
    marginTop: 2,
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 2,
    maxWidth: "100%",
  },
  captionLine: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    textAlign: "center",
  },
  captionMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.grayLight,
    textAlign: "center",
  },
});
