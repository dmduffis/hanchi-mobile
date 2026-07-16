import type {
    AppNotification,
    DiscoverRoute,
    DishStamp,
    PassportBadge,
    PassportStamp,
} from "../types";
import { mockCommunities } from "./mockCommunities";

export const TOTAL_COMMUNITY_STAMPS = mockCommunities.length;

const earnedIds = new Set([
  "little-guyana-queens",
  "little-pakistan",
  "little-india",
  "chinatown-flushing",
  "koreatown-manhattan",
]);

export const mockPassportStamps: PassportStamp[] = mockCommunities.map(
  (c, i) => ({
    id: `ps${i + 1}`,
    communityId: c.id,
    communityName: c.name,
    emoji: c.emoji,
    earned: earnedIds.has(c.id),
  }),
);

export const mockDishStamps: DishStamp[] = [
  { id: "ds1", dishName: "Doubles", emoji: "🫓", earned: true },
  { id: "ds2", dishName: "Nihari", emoji: "🥘", earned: true },
  { id: "ds3", dishName: "Soup Dumplings", emoji: "🥟", earned: true },
  { id: "ds4", dishName: "Arepas", emoji: "🫓", earned: false },
  { id: "ds5", dishName: "Jerk Chicken", emoji: "🍗", earned: false },
];

export const mockPassportBadges: PassportBadge[] = [
  {
    id: "b1",
    title: "First Stamp",
    description: "Visited your first enclave",
    earned: true,
  },
  {
    id: "b2",
    title: "Weekend Wanderer",
    description: "Explored 3 enclaves in one month",
    earned: true,
  },
  {
    id: "b3",
    title: "Spice Route",
    description: "Tried 5 spicy dishes",
    earned: false,
  },
  {
    id: "b4",
    title: "Borough Hopper",
    description: "Stamped enclaves in 4 boroughs",
    earned: false,
  },
];

export const mockNotifications: AppNotification[] = [
  {
    id: "n1",
    message: "New seasonal challenge: Queens enclaves — stamp 4 this weekend.",
    timestamp: "2h ago",
    icon: "award",
  },
  {
    id: "n2",
    message: "Little Guyana on Liberty Ave is buzzing this Saturday.",
    timestamp: "Yesterday",
    icon: "map-pin",
  },
  {
    id: "n3",
    message: "You earned the Weekend Wanderer badge.",
    timestamp: "3 days ago",
    icon: "award",
  },
  {
    id: "n4",
    message: "Your Little Pakistan favorites are nearby — free this weekend?",
    timestamp: "5 days ago",
    icon: "coffee",
  },
  {
    id: "n5",
    message: "Drop In found a new spot — try Little Senegal?",
    timestamp: "1 week ago",
    icon: "coffee",
  },
];

export const mockRoutes: DiscoverRoute[] = [
  {
    id: "r1",
    title: "Queens Enclave Crawl",
    subtitle:
      "Little India, Little Colombia, and Flushing Chinatown in one afternoon",
    stops: 4,
    durationHours: 3,
    communities: ["Little India", "Little Colombia", "Chinatown in Flushing"],
    isAiSuggested: true,
  },
  {
    id: "r2",
    title: "Liberty Avenue Walk",
    subtitle: "Doubles, pine tart, and Indo-Caribbean bakeries",
    stops: 3,
    durationHours: 2.5,
    communities: ["Little Guyana in Queens"],
  },
  {
    id: "r3",
    title: "Brooklyn Chinatown + Mexico",
    subtitle: "Dim sum on 8th Ave, tacos on 5th",
    stops: 4,
    durationHours: 3.5,
    communities: ["Chinatown in Sunset Park", "Little Mexico in Sunset Park"],
  },
  {
    id: "r4",
    title: "Neon & Noodles",
    subtitle: "Late-night Koreatown for after-work explorers",
    stops: 3,
    durationHours: 2,
    communities: ["Koreatown in Manhattan"],
  },
];
