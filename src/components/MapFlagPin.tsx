import { StyleSheet, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";

import { colors } from "../theme";
import { CircularFlag } from "./CircularFlag";

/** Default community flag disk diameter. */
export const MAP_PIN_FLAG_SIZE = 40;

/**
 * Lucide Icons `map-pin` outer silhouette (ISC).
 * viewBox 0 0 24 24 — circular head (r=8 at 12,10) + short rounded tip.
 * @see https://lucide.dev/icons/map-pin
 */
const LUCIDE_MAP_PIN_PATH =
  "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0";

/** Head circle diameter in Lucide viewBox units. */
const PIN_VB = 24;
const PIN_HEAD_CX = 12;
const PIN_HEAD_CY = 10;
const PIN_HEAD_R = 8;
const PIN_TIP_Y = 21.8;

/** Frame thickness around the flag inside the pin head. */
export function mapPinBodyPad(flagSize: number): number {
  if (flagSize <= 22) return 3;
  if (flagSize <= 28) return 3.5;
  return 4;
}

export function mapPinBodySize(flagSize: number): number {
  return flagSize + mapPinBodyPad(flagSize) * 2;
}

/** Tip length below the circular head (matches Lucide proportions). */
export function mapPinPointerOverhang(flagSize: number): number {
  const head = mapPinBodySize(flagSize);
  const scale = head / (PIN_HEAD_R * 2);
  const headBottom = (PIN_HEAD_CY + PIN_HEAD_R) * scale;
  const tip = PIN_TIP_Y * scale;
  return Math.max(6, Math.round(tip - headBottom));
}

export function mapPinTotalHeight(flagSize: number): number {
  const head = mapPinBodySize(flagSize);
  const scale = head / (PIN_HEAD_R * 2);
  return Math.round(PIN_TIP_Y * scale - (PIN_HEAD_CY - PIN_HEAD_R) * scale);
}

/** @deprecated Alias for overhang helpers. */
export function mapPinPointerSize(flagSize: number): number {
  return mapPinPointerOverhang(flagSize);
}

type MapFlagPinProps = {
  countryCode?: string | null;
  flag?: string;
  /** Flag disk size in px. */
  size?: number;
  selected?: boolean;
};

/**
 * Map pin using Lucide's map-pin silhouette with CircularFlag inset in the head.
 * Use Marker anchor={{ x: 0.5, y: 1 }}.
 */
export function MapFlagPin({
  countryCode,
  flag,
  size = MAP_PIN_FLAG_SIZE,
  selected = false,
}: MapFlagPinProps) {
  const pad = mapPinBodyPad(size);
  const head = mapPinBodySize(size);
  const scale = head / (PIN_HEAD_R * 2);
  const svgW = PIN_VB * scale;
  const svgH = PIN_VB * scale;
  const flagLeft = PIN_HEAD_CX * scale - size / 2;
  const flagTop = PIN_HEAD_CY * scale - size / 2;
  const shadowPad = Math.round(head * 0.1);

  return (
    <View
      style={[
        styles.container,
        {
          width: svgW,
          height: svgH + shadowPad * 0.3,
        },
      ]}
      collapsable={false}
    >
      <Svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${PIN_VB} ${PIN_VB}`}
        style={styles.pinSvg}
        collapsable={false}
      >
        <Ellipse
          cx={PIN_HEAD_CX}
          cy={PIN_TIP_Y + 0.4}
          rx={2.4}
          ry={0.85}
          fill="rgba(0,0,0,0.2)"
        />
        <Path
          d={LUCIDE_MAP_PIN_PATH}
          fill="#FFFFFF"
          stroke={selected ? colors.gold : "rgba(0,0,0,0.14)"}
          strokeWidth={selected ? 1.1 : 0.55}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View
        style={[
          styles.flagInset,
          {
            top: flagTop,
            left: flagLeft,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        collapsable={false}
      >
        <CircularFlag countryCode={countryCode} flag={flag} size={size} bare />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    overflow: "visible",
  },
  pinSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  flagInset: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
});
