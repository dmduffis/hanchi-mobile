import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ComponentType } from "react";
import {
  BankIcon,
  BuildingsIcon,
  ChurchIcon,
  CoffeeBeanIcon,
  GuitarIcon,
  IslandIcon,
  MosqueIcon,
  MountainsIcon,
  SailboatIcon,
  StorefrontIcon,
  SunIcon,
  TipiIcon,
  TreePalmIcon,
  WavesIcon,
  YinYangIcon,
  type IconProps as PhosphorIconProps,
} from "phosphor-react-native";

import type { StampMotif } from "../../data/stampPlaceTypes";

type StampPlaceIconProps = {
  type: StampMotif;
  color: string;
  size?: number;
};

type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type MotifSource =
  | { pack: "phosphor"; Icon: ComponentType<PhosphorIconProps> }
  | { pack: "mci"; name: MciName };

/**
 * Stamp motifs mix Phosphor + Material Community Icons
 * (via @expo/vector-icons) so well-known places get distinctive glyphs
 * (pyramid, om, Buddhist temple, chili) that Phosphor lacks.
 */
const MOTIF_ICON: Record<StampMotif, MotifSource> = {
  // Curated — MCI where Phosphor has no good match
  pyramid: { pack: "mci", name: "pyramid" },
  templeBuddhist: { pack: "mci", name: "temple-buddhist-outline" },
  om: { pack: "mci", name: "om" },
  chili: { pack: "mci", name: "chili-mild-outline" },
  noodles: { pack: "mci", name: "noodles" },
  rice: { pack: "mci", name: "rice" },
  volcano: { pack: "mci", name: "volcano-outline" },
  // Curated — Phosphor
  yinYang: { pack: "phosphor", Icon: YinYangIcon },
  coffee: { pack: "phosphor", Icon: CoffeeBeanIcon },
  sailboat: { pack: "phosphor", Icon: SailboatIcon },
  island: { pack: "phosphor", Icon: IslandIcon },
  guitar: { pack: "phosphor", Icon: GuitarIcon },
  mosque: { pack: "phosphor", Icon: MosqueIcon },
  tipi: { pack: "phosphor", Icon: TipiIcon },
  // Generic — Phosphor
  skyline: { pack: "phosphor", Icon: BuildingsIcon },
  temple: { pack: "phosphor", Icon: ChurchIcon },
  palm: { pack: "phosphor", Icon: TreePalmIcon },
  waves: { pack: "phosphor", Icon: WavesIcon },
  mountain: { pack: "phosphor", Icon: MountainsIcon },
  sun: { pack: "phosphor", Icon: SunIcon },
  market: { pack: "phosphor", Icon: StorefrontIcon },
  landmark: { pack: "phosphor", Icon: BankIcon },
};

export function StampPlaceIcon({
  type,
  color,
  size = 36,
}: StampPlaceIconProps) {
  const source = MOTIF_ICON[type];
  if (source.pack === "mci") {
    return (
      <MaterialCommunityIcons name={source.name} size={size} color={color} />
    );
  }
  const Icon = source.Icon;
  return <Icon size={size} color={color} weight="regular" />;
}
