import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import type { StampMotif } from "../../data/stampPlaceTypes";

type StampPlaceIconProps = {
  type: StampMotif;
  color: string;
  size?: number;
};

type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * Stamp motifs via Material Community Icons (@expo/vector-icons).
 * Single pack keeps Expo/Metro imports reliable for the stamp face.
 */
const MOTIF_ICON: Record<StampMotif, MciName> = {
  // Curated
  yinYang: "yin-yang",
  templeBuddhist: "temple-buddhist-outline",
  om: "om",
  chili: "chili-mild-outline",
  pyramid: "pyramid",
  coffee: "coffee-outline",
  sailboat: "sail-boat",
  island: "island",
  guitar: "guitar-acoustic",
  mosque: "mosque-outline",
  noodles: "noodles",
  rice: "rice",
  volcano: "volcano-outline",
  tipi: "tent",
  // Generic
  skyline: "office-building-outline",
  temple: "church-outline",
  palm: "palm-tree",
  waves: "waves",
  mountain: "image-filter-hdr",
  sun: "white-balance-sunny",
  market: "storefront-outline",
  landmark: "bank-outline",
};

export function StampPlaceIcon({
  type,
  color,
  size = 36,
}: StampPlaceIconProps) {
  const name = MOTIF_ICON[type] ?? "map-marker-outline";
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
