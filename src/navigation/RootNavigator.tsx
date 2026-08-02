import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { AuthScreen } from "../screens/AuthScreen";
import { CommunityProfileScreen } from "../screens/CommunityProfileScreen";
import { DiscoverScreen } from "../screens/DiscoverScreen";
import { DropInScreen } from "../screens/DropInScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { RestaurantDetailScreen } from "../screens/RestaurantDetailScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { colors, typography } from "../theme";
import { TabNavigator } from "./TabNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  onOnboarded: () => void | Promise<void>;
};

function friendlyProfileError(raw: string | null): string {
  if (!raw) {
    return "We couldn’t reach your account. Check your connection and try again.";
  }
  const lower = raw.toLowerCase();
  if (lower.includes("x-user-id") || lower.includes("stub auth")) {
    return "The server is still updating. Wait a minute, then tap Retry.";
  }
  if (lower.includes("invalid or expired") || lower.includes("jwt")) {
    return "Your session expired. Sign out, then sign in again.";
  }
  if (lower.includes("not configured") || lower.includes("supabase")) {
    return "Account setup isn’t ready yet. Try again in a moment.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Network issue — check your connection and try again.";
  }
  return raw;
}

function ProfileLoadError() {
  const { profileError, refreshProfile, signOut } = useAuth();
  return (
    <View style={styles.errorWrap}>
      <Text style={styles.errorTitle}>Almost there</Text>
      <Text style={styles.errorBody}>
        {friendlyProfileError(profileError)}
      </Text>
      <Pressable onPress={() => void refreshProfile()} style={styles.errorBtn}>
        <Text style={styles.errorBtnText}>Retry</Text>
      </Pressable>
      <Pressable onPress={() => void signOut()} style={styles.errorBtnGhost}>
        <Text style={styles.errorBtnGhostText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

export function RootNavigator({
  isAuthenticated,
  needsOnboarding,
  onOnboarded,
}: RootNavigatorProps) {
  const { profile, profileReady } = useAuth();
  const profileMissing = isAuthenticated && profileReady && !profile;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : profileMissing ? (
        <Stack.Screen name="Auth" component={ProfileLoadError} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onComplete={onOnboarded} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="CommunityProfile"
            component={CommunityProfileScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="RestaurantDetail"
            component={RestaurantDetailScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ animation: "fade_from_bottom" }}
          />
          <Stack.Screen name="Discover" component={DiscoverScreen} />
          <Stack.Screen
            name="DropIn"
            component={DropInScreen}
            options={{ presentation: "fullScreenModal", animation: "fade" }}
          />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  errorWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.ink,
  },
  errorBody: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.gray,
    lineHeight: 22,
  },
  errorBtn: {
    marginTop: 8,
    backgroundColor: colors.forest,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  errorBtnText: {
    fontFamily: typography.bodySemibold,
    color: colors.white,
    fontSize: 16,
  },
  errorBtnGhost: {
    paddingVertical: 12,
    alignItems: "center",
  },
  errorBtnGhostText: {
    fontFamily: typography.bodyMedium,
    color: colors.forest,
    fontSize: 15,
  },
});
