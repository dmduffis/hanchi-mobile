export interface Community {
  id: string;
  name: string;
  neighborhood: string;
  heritage: string;
  tags: string[];
  description: string;
  pullQuote: string;
  pullQuoteAuthor: string;
  emoji: string;
  /** Community hero / cover photo when available. */
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  relatedIds: string[];
  /** From NYC Immigrant Enclaves map (Mayor's Office) */
  mapNumber?: number;
  subwayLines?: string[];
  station?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  communityId: string;
  communityName: string;
  cuisine: string;
  priceLevel: "$" | "$$" | "$$$";
  blurb: string;
  emoji: string;
  address: string;
  knownFor: string[];
}

export interface Dish {
  id: string;
  name: string;
  communityId: string;
  communityName: string;
  restaurantId: string;
  restaurantName: string;
  description: string;
  dietaryTags: string[];
  emoji: string;
}

export interface FavoriteItem {
  id: string;
  type: "community" | "dish" | "restaurant";
  title: string;
  subtitle: string;
  communityId: string;
  emoji: string;
  savedAt: string;
}

export interface InsiderQuote {
  id: string;
  communityId: string;
  quote: string;
  author: string;
  role: string;
}

export interface PassportStamp {
  id: string;
  communityId: string;
  communityName: string;
  emoji: string;
  earned: boolean;
}

export interface DishStamp {
  id: string;
  dishName: string;
  emoji: string;
  earned: boolean;
}

/** Profile achievement badge (mock catalog for now). */
export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progressCurrent: number;
  progressTarget: number;
  /** Level number on the medal (e.g. "1", "3"). */
  levelLabel?: string;
  isNew?: boolean;
  /** Key into shared app icon set (no emoji). */
  icon:
    | "award"
    | "star"
    | "mapPin"
    | "fire"
    | "building"
    | "book"
    | "users"
    | "moon"
    | "compass"
    | "bolt"
    | "kitchen"
    | "check";
}

/** @deprecated Use AchievementBadge */
export type PassportBadge = AchievementBadge;

/** A feed item on the Moments tab. */
export interface MomentItem {
  id: string;
  kind: "own" | "peer";
  /** post = written note; stamp = stamped place only (activity/notification). */
  activity: "post" | "stamp";
  authorName: string;
  note: string;
  createdAt: string;
  communityId?: string | null;
  communityName?: string | null;
  /** Place heritage flag (Facebook-style “Name at Place”). */
  placeCountryCode?: string | null;
  photoUrl?: string | null;
  /** Author culture ISO country code for avatar flag badge. */
  authorCountryCode?: string | null;
  /** Emoji fallback when no country code. */
  authorFlag?: string | null;
}


export interface AppNotification {
  id: string;
  message: string;
  timestamp: string;
  /** Glyph keyed to meaning of the notification, not a generic default. */
  icon: "bell" | "map-pin" | "award" | "heart" | "bolt";
}

export interface DiscoverRoute {
  id: string;
  title: string;
  subtitle: string;
  stops: number;
  durationHours: number;
  communities: string[];
  isAiSuggested?: boolean;
}

export type CommunityProfileTab = "About" | "Food" | "Insiders";
