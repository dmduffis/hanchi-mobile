export const colors = {
  /** Primary interactive (chips, CTAs, active tabs). */
  forest: "#163A2B",
  forestDark: "#0F2A1F",
  gold: "#F9BF30",
  goldText: "#171922",
  /** Favorites — restrained warm red, less candy than palette rose. */
  heart: "#C84B4B",
  /** Playful accent kept for rare highlights (not primary UI). */
  accent: "#F6643C",
  blue: "#0057A6",
  background: "#FFFFFF",
  surface: "#F3F2F0",
  ink: "#171922",
  gray: "#5C5F6A",
  grayLight: "#8B8E99",
  border: "#E6E4DF",
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
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};
