import { useId, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Mask, Rect } from "react-native-svg";

type StampShapeFrameProps = {
  color: string;
  width: number;
  height: number;
  strokeWidth?: number;
  children: ReactNode;
};

/**
 * Landscape postage stamp — CSS-mask perforations via SVG Mask.
 * Circles are kept clear of the corners so tips stay sharp 90°.
 * Extra white gutter between outline and inner frame makes the face pop.
 */
export function StampShapeFrame({
  color,
  width,
  height,
  strokeWidth = 2.25,
  children,
}: StampShapeFrameProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const maskId = `stampMask${uid}`;

  const radius = Math.min(5.5, Math.min(width, height) * 0.048);
  // Wider gap → fewer perforations along each edge
  const gap = radius * 3.2;

  const holes = edgeHoles(width, height, gap, radius);

  // Colored scalloped band — thinner so the white face reads larger
  const colorBand = Math.max(7, Math.min(width, height) * 0.055);
  const outlineInset = radius + colorBand;
  // Keep the inner-rectangle gutter as before
  const frameInset = outlineInset + 4;
  const contentPad = frameInset + 4;

  return (
    <View style={{ width, height }}>
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <Mask
            id={maskId}
            x={0}
            y={0}
            width={width}
            height={height}
            maskUnits="userSpaceOnUse"
          >
            <Rect x={0} y={0} width={width} height={height} fill="#FFFFFF" />
            {holes.map((h, i) => (
              <Circle key={i} cx={h.cx} cy={h.cy} r={radius} fill="#000000" />
            ))}
          </Mask>
        </Defs>

        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={color}
          mask={`url(#${maskId})`}
        />

        <Rect
          x={outlineInset}
          y={outlineInset}
          width={Math.max(0, width - outlineInset * 2)}
          height={Math.max(0, height - outlineInset * 2)}
          fill="#FFFFFF"
        />

        <Rect
          x={frameInset}
          y={frameInset}
          width={Math.max(0, width - frameInset * 2)}
          height={Math.max(0, height - frameInset * 2)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </Svg>

      <View
        style={[
          styles.content,
          {
            width,
            height,
            paddingHorizontal: contentPad,
            paddingVertical: contentPad,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

type Hole = { cx: number; cy: number };

/**
 * Semicircle bites along each edge, stopping short of the corners
 * so the four tips stay sharp (no overlapping corner circles).
 */
function edgeHoles(w: number, h: number, gap: number, radius: number): Hole[] {
  const holes: Hole[] = [];
  // Keep hole centers at least ~1.25×radius away from each corner.
  const cornerClear = radius * 1.35;

  const topSpan = w - cornerClear * 2;
  const sideSpan = h - cornerClear * 2;
  const nTop = Math.max(3, Math.round(topSpan / gap));
  const nSide = Math.max(2, Math.round(sideSpan / gap));
  const stepX = topSpan / nTop;
  const stepY = sideSpan / nSide;

  for (let i = 0; i < nTop; i += 1) {
    const cx = cornerClear + stepX * (i + 0.5);
    holes.push({ cx, cy: 0 });
    holes.push({ cx, cy: h });
  }
  for (let i = 0; i < nSide; i += 1) {
    const cy = cornerClear + stepY * (i + 0.5);
    holes.push({ cx: 0, cy });
    holes.push({ cx: w, cy });
  }

  return holes;
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "space-between",
  },
});
