import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useOnboardingGate } from "./src/lib/onboardingStorage";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { colors } from "./src/theme";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { ready, hasOnboarded, completeOnboarding } = useOnboardingGate();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const appReady = (fontsLoaded || !!fontError) && ready;

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  const onLayoutRootView = useCallback(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style="dark" />
            <RootNavigator
              hasOnboarded={hasOnboarded}
              onOnboarded={completeOnboarding}
            />
          </View>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
