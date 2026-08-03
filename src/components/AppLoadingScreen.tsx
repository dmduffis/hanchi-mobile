import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, View } from "react-native";

/**
 * Brand splash: full-screen purple plate with the logo already dead-center
 * in the image. No percentage / flex guessing — the art is the layout.
 */
export function AppLoadingScreen() {
  return (
    <View style={styles.root} accessibilityLabel="Loading Hanchi">
      <StatusBar style="light" />
      <Image
        source={require("../../assets/images/splash-hanchi.png")}
        style={styles.plate}
        resizeMode="cover"
        accessibilityLabel="Hanchi"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#7C3AED",
  },
  plate: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
});
