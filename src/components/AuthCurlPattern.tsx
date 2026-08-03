import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, View } from "react-native";

/**
 * Curl wallpaper under auth — strongest at the top, fades out
 * before the Hanchi wordmark so stamps + logo stay clear.
 */
export function AuthCurlPattern() {
  return (
    <View
      pointerEvents="none"
      style={styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={require("../../assets/images/auth-curl-bg.png")}
        style={styles.image}
        resizeMode="cover"
      />
      {/* Longer falloff — pattern still readable into the mid-screen / logo band */}
      <LinearGradient
        colors={[
          "rgba(246, 240, 230, 0.05)",
          "rgba(246, 240, 230, 0.28)",
          "rgba(246, 240, 230, 0.55)",
          "rgba(246, 240, 230, 0.82)",
          "rgba(246, 240, 230, 0.96)",
          "#F6F0E6",
        ]}
        locations={[0, 0.22, 0.4, 0.55, 0.7, 0.88]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 0,
    elevation: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    // Stronger at the top band; gradient handles fade toward logo
    opacity: 0.62,
  },
});
