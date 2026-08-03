import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { AppLoadingScreen } from "./src/components/AppLoadingScreen";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { colors } from "./src/theme";

/** Cream auth field — match AuthScreen + stack so dissolve doesn't flash white. */
const AUTH_FIELD = "#F6F0E6";

const MIN_SPLASH_MS = 1100;
const FADE_OUT_MS = 700;
const SETTLE_MS = 200;

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const authNavTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: AUTH_FIELD,
    card: AUTH_FIELD,
  },
};

function AppNavigation() {
  const { ready, profileReady, session, needsOnboarding, completeOnboarding } =
    useAuth();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [minSplashDone, setMinSplashDone] = useState(false);
  const [navReady, setNavReady] = useState(false);
  const [settled, setSettled] = useState(false);
  const [overlayMounted, setOverlayMounted] = useState(true);
  const [fading, setFading] = useState(false);
  const dissolveStarted = useRef(false);
  const nativeHidden = useRef(false);
  const splashOpacity = useSharedValue(1);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  const resourcesReady =
    (fontsLoaded || !!fontError) && ready && (!session || profileReady);
  const mountApp = resourcesReady;
  const canDissolve = mountApp && minSplashDone && settled;

  useEffect(() => {
    if (!mountApp || !navReady) {
      setSettled(false);
      return;
    }
    const t = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, [mountApp, navReady]);

  const finishOverlay = useCallback(() => {
    setOverlayMounted(false);
  }, []);

  useEffect(() => {
    if (!canDissolve || dissolveStarted.current) return;
    dissolveStarted.current = true;
    setFading(true);
    void SplashScreen.hideAsync().catch(() => undefined);

    splashOpacity.value = withTiming(
      0,
      {
        duration: FADE_OUT_MS,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      },
      (finished) => {
        if (finished) runOnJS(finishOverlay)();
      },
    );
  }, [canDissolve, finishOverlay, splashOpacity]);

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  const hideNativeOnce = useCallback(() => {
    if (nativeHidden.current) return;
    nativeHidden.current = true;
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  const isAuthEntry = !session;

  const stackTheme = useMemo((): Theme => {
    if (isAuthEntry) return authNavTheme;
    return {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.background,
      },
    };
  }, [isAuthEntry]);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        {mountApp ? (
          <View
            style={[
              styles.app,
              { backgroundColor: isAuthEntry ? AUTH_FIELD : colors.background },
            ]}
          >
            <StatusBar style={overlayMounted ? "light" : "dark"} />
            <NavigationContainer
              theme={stackTheme}
              onReady={() => setNavReady(true)}
            >
              <RootNavigator
                isAuthenticated={!!session}
                needsOnboarding={needsOnboarding}
                onOnboarded={completeOnboarding}
                entryBackground={isAuthEntry ? AUTH_FIELD : colors.background}
              />
            </NavigationContainer>
          </View>
        ) : (
          <View style={styles.bootFill} />
        )}
      </SafeAreaProvider>

      {overlayMounted ? (
        <Animated.View
          pointerEvents={fading ? "none" : "auto"}
          onLayout={hideNativeOnce}
          style={[styles.splashOverlay, splashStyle]}
          collapsable={false}
        >
          <AppLoadingScreen />
        </Animated.View>
      ) : null}
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <View style={styles.boot}>
      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  boot: {
    flex: 1,
    backgroundColor: colors.forest,
  },
  bootFill: {
    flex: 1,
    backgroundColor: colors.forest,
  },
  app: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
    backgroundColor: colors.forest,
  },
});
