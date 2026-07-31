import Svg, { Circle, Line, Path, Polygon } from "react-native-svg";

import type { StampPlaceType } from "../../data/stampPlaceTypes";

type StampPlaceIconProps = {
  type: StampPlaceType;
  color: string;
  size?: number;
};

/**
 * Lucide-inspired place motifs (ISC) — reused across stamps by vibe,
 * same idea as Airbnb’s city / sun-island / building icons.
 */
export function StampPlaceIcon({
  type,
  color,
  size = 36,
}: StampPlaceIconProps) {
  const stroke = 1.75;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
  };

  if (type === "coastal") {
    // Sun over waves — sunny island / waterfront
    return (
      <Svg {...common}>
        <Circle cx="12" cy="8" r="3.2" stroke={color} strokeWidth={stroke} />
        <Path
          d="M12 2.5v1.4M8.2 4.4l1 1M15.8 4.4l-1 1M5.5 8h1.4M17.1 8h1.4"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <Path
          d="M3 14.5c.5.4 1 .8 2 .8 2 0 2-1.6 4-1.6s1.9 1.6 4 1.6 2-1.6 4-1.6c1 0 1.5.4 2 .8"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <Path
          d="M3 18c.5.4 1 .8 2 .8 2 0 2-1.6 4-1.6s1.9 1.6 4 1.6 2-1.6 4-1.6c1 0 1.5.4 2 .8"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  if (type === "mountains") {
    return (
      <Svg {...common}>
        <Path
          d="m8 5 3.5 7 4-4.5 4.5 13H4L8 5z"
          stroke={color}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (type === "nature") {
    return (
      <Svg {...common}>
        <Path
          d="M12 4 8.5 10h1.2L7 16h2.2L7.5 21h9L14.8 16H17l-2.7-6h1.2L12 4z"
          stroke={color}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
        <Line
          x1="12"
          y1="16"
          x2="12"
          y2="21"
          stroke={color}
          strokeWidth={stroke}
        />
      </Svg>
    );
  }

  if (type === "landmark") {
    return (
      <Svg {...common}>
        <Polygon
          points="12,3 19,8 5,8"
          stroke={color}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
        <Line
          x1="7"
          y1="11"
          x2="7"
          y2="18"
          stroke={color}
          strokeWidth={stroke}
        />
        <Line
          x1="12"
          y1="11"
          x2="12"
          y2="18"
          stroke={color}
          strokeWidth={stroke}
        />
        <Line
          x1="17"
          y1="11"
          x2="17"
          y2="18"
          stroke={color}
          strokeWidth={stroke}
        />
        <Line
          x1="4"
          y1="21"
          x2="20"
          y2="21"
          stroke={color}
          strokeWidth={stroke}
        />
      </Svg>
    );
  }

  // city — simple skyline / buildings
  return (
    <Svg {...common}>
      <Path
        d="M4 21V10h5v11M9 21V6h6v15M15 21V12h5v9"
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx="6.5" cy="13" r="0.7" fill={color} />
      <Circle cx="6.5" cy="16" r="0.7" fill={color} />
      <Circle cx="12" cy="9" r="0.7" fill={color} />
      <Circle cx="12" cy="12" r="0.7" fill={color} />
      <Circle cx="12" cy="15" r="0.7" fill={color} />
      <Circle cx="17.5" cy="15" r="0.7" fill={color} />
      <Circle cx="17.5" cy="18" r="0.7" fill={color} />
    </Svg>
  );
}
