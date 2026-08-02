import type { NavigatorScreenParams } from "@react-navigation/native";

import type { CommunityProfileTab } from "../types";

export type MainTabParamList = {
  Home: undefined;
  Map:
    | {
        focusCommunityId?: string;
        query?: string;
        showResults?: boolean;
        focusSearch?: boolean;
        /** Open restaurants layer scoped to a community (sheet/profile expand). */
        expandRestaurants?: {
          communityId: string;
          communityName: string;
          latitude: number;
          longitude: number;
          restaurantCoords?: { latitude: number; longitude: number }[];
        };
        /** Home “Open map” — sync camera to the Home peek and clear stale focus. */
        openAt?: {
          latitude: number;
          longitude: number;
          latitudeDelta: number;
          longitudeDelta: number;
          /** Unique per tap so the same region can re-apply. */
          token: number;
        };
      }
    | undefined;
  Favorites: undefined;
  Passport: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CommunityProfile: { communityId: string; initialTab?: CommunityProfileTab };
  RestaurantDetail: { restaurantId: string };
  Search: undefined;
  Discover: undefined;
  DropIn: undefined;
  Notifications: undefined;
};
