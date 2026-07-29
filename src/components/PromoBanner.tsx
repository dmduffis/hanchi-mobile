import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconArrowRight, IconStar, type Icon } from "../icons";
import { colors, radii, typography } from "../theme";

type PromoBannerProps = {
  text: string;
  icon?: Icon;
  onPress?: () => void;
};

export function PromoBanner({
  text,
  icon: BannerIcon = IconStar,
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
        <BannerIcon size={16} color={colors.goldText} />
      </View>
      <Text style={styles.text}>{text}</Text>
      {onPress ? <IconArrowRight size={16} color={colors.goldText} /> : null}
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
