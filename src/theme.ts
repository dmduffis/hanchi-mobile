export const colors = {
  /** Primary interactive (chips, CTAs, active tabs). */
  forest: "#7C3AED",
  forestDark: "#5B21B6",
  gold: "#F9BF30",
  goldText: "#1A1A2E",
  /** Favorites — restrained warm red, less candy than palette rose. */
  heart: "#C84B4B",
  /** Playful accent kept for rare highlights (not primary UI). */
  accent: "#F6643C",
  blue: "#0057A6",
  background: "#FFFFFF",
  surface: "#F5F5F7",
  ink: "#1A1A2E",
  gray: "#6B7280",
  grayLight: "#9CA3AF",
  border: "#E8E8ED",
  white: "#FFFFFF",
};

export const typography = {
  display: "Poppins_700Bold",
  body: "Poppins_400Regular",
  bodyMedium: "Poppins_500Medium",
  bodySemibold: "Poppins_600SemiBold",
};

/** Restaurant / place names in list rows (search, favorites, profile Food, sheets). */
export const listTitle = {
  fontFamily: typography.bodySemibold,
  fontSize: 16,
  color: colors.ink,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  full: 999,
};
