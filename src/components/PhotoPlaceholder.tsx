import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type PhotoPlaceholderProps = {
  height?: number;
  style?: StyleProp<ViewStyle>;
};

/** Empty photo area — used when a place has no cover image yet. */
export function PhotoPlaceholder({
  height = 200,
  style,
}: PhotoPlaceholderProps) {
  return <View style={[styles.wrap, { height }, style]} />;
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    backgroundColor: "#E8E6E1",
  },
});
