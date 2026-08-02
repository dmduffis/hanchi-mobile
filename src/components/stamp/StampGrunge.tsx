import type { ReactNode } from "react";
import Svg, { Circle, Ellipse, Line } from "react-native-svg";

type StampGrungeProps = {
  width: number;
  height: number;
  color: string;
  /** Stable seed so each community’s wear looks the same every render. */
  seed: string;
  /** 0–1 overall intensity. */
  intensity?: number;
};

/**
 * Worn rubber-stamp texture: speckles, soft blotches, light scratches.
 * Drawn in SVG (RN has no reliable CSS noise / feTurbulence).
 */
export function StampGrunge({
  width,
  height,
  color,
  seed,
  intensity = 0.55,
}: StampGrungeProps) {
  const rng = mulberry32(hashString(seed));
  const inset = Math.min(width, height) * 0.12;
  const marks: ReactNode[] = [];
  let i = 0;

  const blotches = 4 + Math.floor(rng() * 3);
  for (let b = 0; b < blotches; b += 1) {
    const cx = inset + rng() * (width - inset * 2);
    const cy = inset + rng() * (height - inset * 2);
    const rx = 6 + rng() * 14;
    const ry = 4 + rng() * 10;
    marks.push(
      <Ellipse
        key={`b${i++}`}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={color}
        opacity={0.04 + rng() * 0.07 * intensity}
      />,
    );
  }

  const speckles = Math.round(28 * intensity) + 10;
  for (let s = 0; s < speckles; s += 1) {
    const cx = inset * 0.6 + rng() * (width - inset * 1.2);
    const cy = inset * 0.6 + rng() * (height - inset * 1.2);
    const r = 0.4 + rng() * 1.6;
    marks.push(
      <Circle
        key={`s${i++}`}
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        opacity={0.1 + rng() * 0.28 * intensity}
      />,
    );
  }

  const scratches = 2 + Math.floor(rng() * 3);
  for (let sc = 0; sc < scratches; sc += 1) {
    const x1 = inset + rng() * (width - inset * 2);
    const y1 = inset + rng() * (height - inset * 2);
    const len = 8 + rng() * 18;
    const ang = rng() * Math.PI;
    marks.push(
      <Line
        key={`l${i++}`}
        x1={x1}
        y1={y1}
        x2={x1 + Math.cos(ang) * len}
        y2={y1 + Math.sin(ang) * len}
        stroke={color}
        strokeWidth={0.6 + rng() * 0.5}
        opacity={0.08 + rng() * 0.12 * intensity}
        strokeLinecap="round"
      />,
    );
  }

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: "absolute", left: 0, top: 0 }}
      pointerEvents="none"
    >
      {marks}
    </Svg>
  );
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

/** Deterministic PRNG — same seed → same wear pattern. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
