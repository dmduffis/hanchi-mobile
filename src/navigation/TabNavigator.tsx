import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
  IconBookmark,
  IconBook2,
  IconHome,
  IconMap,
  IconUser,
  type Icon,
} from "../icons";
import { CollectionsScreen } from "../screens/CollectionsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MapScreen } from "../screens/MapScreen";
import { MomentsScreen } from "../screens/MomentsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors, typography } from "../theme";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, Icon> = {
  Home: IconHome,
  Moments: IconBook2,
  Map: IconMap,
  Collections: IconBookmark,
  Profile: IconUser,
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.grayLight,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingTop: 4,
          height: 88,
        },
        tabBarLabelStyle: {
          fontFamily: typography.bodyMedium,
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => {
          const TabIcon = TAB_ICONS[route.name];
          return <TabIcon size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Moments" component={MomentsScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{ title: "Collections" }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
