/**
 * App icon set: Iconscout Unicons (line), plus a few Expo icons where Unicons fall short.
 * Import from here so screens stay consistent.
 */
import { Ionicons } from "@expo/vector-icons";
import { createElement, type ComponentType } from "react";

export type IconProps = {
  color?: string;
  size?: string | number;
};

export type Icon = ComponentType<IconProps>;

function toIconSize(size?: string | number): number {
  if (typeof size === "number" && Number.isFinite(size)) return size;
  if (typeof size === "string") {
    const n = Number(size);
    if (Number.isFinite(n)) return n;
  }
  return 24;
}

/** Clean outline bell — Unicons' solid bell reads too heavy in the header. */
export function IconBell({ color = "currentColor", size }: IconProps) {
  return createElement(Ionicons, {
    name: "notifications-outline",
    size: toIconSize(size),
    color,
  });
}

/** Outline heart for not-saved state. */
export function IconHeart({ color = "currentColor", size }: IconProps) {
  return createElement(Ionicons, {
    name: "heart-outline",
    size: toIconSize(size),
    color,
  });
}

/** Solid filled heart for favorited state. */
export function IconHeartFilled({ color = "currentColor", size }: IconProps) {
  return createElement(Ionicons, {
    name: "heart",
    size: toIconSize(size),
    color,
  });
}

/** Outline bookmark for collections. */
export function IconBookmark({ color = "currentColor", size }: IconProps) {
  return createElement(Ionicons, {
    name: "bookmark-outline",
    size: toIconSize(size),
    color,
  });
}

/** Filled bookmark for saved collections state. */
export function IconBookmarkFilled({ color = "currentColor", size }: IconProps) {
  return createElement(Ionicons, {
    name: "bookmark",
    size: toIconSize(size),
    color,
  });
}

export { default as IconArrowLeft } from "@iconscout/react-native-unicons/icons/uil-arrow-left";
export { default as IconArrowRight } from "@iconscout/react-native-unicons/icons/uil-arrow-right";
export { default as IconArrowsMaximize } from "@iconscout/react-native-unicons/icons/uil-expand-arrows";
export { default as IconAward } from "@iconscout/react-native-unicons/icons/uil-award";
export { default as IconAwardFilled } from "@iconscout/react-native-unicons/icons/uil-medal";
export { default as IconBolt } from "@iconscout/react-native-unicons/icons/uil-bolt";
export { default as IconBook2 } from "@iconscout/react-native-unicons/icons/uil-book";
export { default as IconBuilding } from "@iconscout/react-native-unicons/icons/uil-building";
export { default as IconCheck } from "@iconscout/react-native-unicons/icons/uil-check";
export { default as IconChevronDown } from "@iconscout/react-native-unicons/icons/uil-angle-down";
export { default as IconChevronRight } from "@iconscout/react-native-unicons/icons/uil-angle-right";
export { default as IconChevronUp } from "@iconscout/react-native-unicons/icons/uil-angle-up";
export { default as IconClock } from "@iconscout/react-native-unicons/icons/uil-clock";
export { default as IconCoffee } from "@iconscout/react-native-unicons/icons/uil-coffee";
export { default as IconCompass } from "@iconscout/react-native-unicons/icons/uil-compass";
export { default as IconFire } from "@iconscout/react-native-unicons/icons/uil-fire";
export { default as IconGlobe } from "@iconscout/react-native-unicons/icons/uil-globe";
export { default as IconHelpCircle } from "@iconscout/react-native-unicons/icons/uil-question-circle";
export { default as IconHome } from "@iconscout/react-native-unicons/icons/uil-estate";
export { default as IconImage } from "@iconscout/react-native-unicons/icons/uil-image";
export { default as IconList } from "@iconscout/react-native-unicons/icons/uil-list-ul";
export { default as IconLocate } from "@iconscout/react-native-unicons/icons/uil-location-arrow";
export { default as IconMap } from "@iconscout/react-native-unicons/icons/uil-map";
export { default as IconMapPin } from "@iconscout/react-native-unicons/icons/uil-map-marker";
export { default as IconMinus } from "@iconscout/react-native-unicons/icons/uil-minus";
export { default as IconMoon } from "@iconscout/react-native-unicons/icons/uil-moon";
export { default as IconNavigation } from "@iconscout/react-native-unicons/icons/uil-navigator";
export { default as IconPlus } from "@iconscout/react-native-unicons/icons/uil-plus";
export { default as IconSearch } from "@iconscout/react-native-unicons/icons/uil-search";
export { default as IconSetting } from "@iconscout/react-native-unicons/icons/uil-setting";
export { default as IconStar } from "@iconscout/react-native-unicons/icons/uil-star";
export { default as IconToolsKitchen2 } from "@iconscout/react-native-unicons/icons/uil-utensils";
export { default as IconUser } from "@iconscout/react-native-unicons/icons/uil-user";
export { default as IconUsers } from "@iconscout/react-native-unicons/icons/uil-users-alt";
export { default as IconX } from "@iconscout/react-native-unicons/icons/uil-times";
export { default as IconEllipsisV } from "@iconscout/react-native-unicons/icons/uil-ellipsis-v";
