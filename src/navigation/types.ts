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
      }
    | undefined;
  Favorites: undefined;
  Passport: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CommunityProfile: { communityId: string; initialTab?: CommunityProfileTab };
  RestaurantDetail: { restaurantId: string };
  Search: undefined;
  Discover: undefined;
  DropIn: undefined;
  Notifications: undefined;
};
