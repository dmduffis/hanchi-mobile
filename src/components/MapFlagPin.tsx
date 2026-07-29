import { StyleSheet, View } from "react-native";

import { colors } from "../theme";
import { CircularFlag } from "./CircularFlag";

/** Default community flag disk diameter. */
export const MAP_PIN_FLAG_SIZE = 40;

/** White pad around the flag (each side). Scales with pin size. */
export function mapPinBodyPad(flagSize: number): number {
  if (flagSize <= 22) return 2.5;
  if (flagSize <= 28) return 3;
  return 3.5;
}

/** Diamond edge before rotation. Scales down for restaurant pins. */
export function mapPinPointerSize(flagSize: number): number {
  return Math.max(7, Math.round(flagSize * 0.26));
}

/** Visible tip below the circle (diamond mostly tucked under the body). */
export function mapPinPointerOverhang(flagSize: number): number {
  const pointer = mapPinPointerSize(flagSize);
  return Math.max(5, Math.round((pointer / Math.SQRT2) * 0.85));
}

export function mapPinBodySize(flagSize: number): number {
  return flagSize + mapPinBodyPad(flagSize) * 2;
}

export function mapPinTotalHeight(flagSize: number): number {
  return mapPinBodySize(flagSize) + mapPinPointerOverhang(flagSize);
}

type MapFlagPinProps = {
  countryCode?: string | null;
  flag?: string;
  /** Flag disk size in px. */
  size?: number;
  selected?: boolean;
};

/**
 * Map-only chrome: white padded circle + short downward pointer + soft shadow.
 * Use Marker anchor={{ x: 0.5, y: 1 }}.
 */
export function MapFlagPin({
  countryCode,
  flag,
  size = MAP_PIN_FLAG_SIZE,
  selected = false,
}: MapFlagPinProps) {
  const body = mapPinBodySize(size);
  const pointer = mapPinPointerSize(size);
  const overhang = mapPinPointerOverhang(size);
  // Tuck most of the diamond under the circle for a clean join
  const pointerTop = body - pointer * 0.62;

  return (
    <View
      style={[
        styles.container,
        {
          width: body,
          height: body + overhang,
        },
      ]}
      collapsable={false}
    >
      <View
        style={[
          styles.pointer,
          {
            width: pointer,
            height: pointer,
            top: pointerTop,
            left: (body - pointer) / 2,
            borderRadius: Math.max(1, pointer * 0.1),
          },
          selected ? styles.chromeSelected : styles.chrome,
        ]}
      />
      <View
        style={[
          styles.body,
          {
            width: body,
            height: body,
            borderRadius: body / 2,
          },
          selected ? styles.chromeSelected : styles.chrome,
          selected && styles.bodySelectedRing,
        ]}
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
  pointer: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
    zIndex: 0,
  },
  body: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  chrome: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  chromeSelected: {
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 4.5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  bodySelectedRing: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
});
