import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { CommunityProfileScreen } from "../screens/CommunityProfileScreen";
import { DiscoverScreen } from "../screens/DiscoverScreen";
import { DropInScreen } from "../screens/DropInScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { colors } from "../theme";
import { TabNavigator } from "./TabNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  hasOnboarded: boolean;
  onOnboarded: () => void;
};

export function RootNavigator({
  hasOnboarded,
  onOnboarded,
}: RootNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!hasOnboarded ? (
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
