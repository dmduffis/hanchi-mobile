import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, typography } from "../theme";

type PromoBannerProps = {
  text: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
};

export function PromoBanner({
  text,
  icon = "star",
  onPress,
}: PromoBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.banner,
        pressed && onPress && styles.pressed,
      ]}
      disabled={!onPress}
    >
      <View style={styles.iconWrap}>
        <Feather name={icon} size={16} color={colors.goldText} />
      </View>
      <Text style={styles.text}>{text}</Text>
      {onPress ? (
        <Feather name="arrow-right" size={16} color={colors.goldText} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  pressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(92, 61, 20, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.goldText,
    lineHeight: 20,
  },
});
