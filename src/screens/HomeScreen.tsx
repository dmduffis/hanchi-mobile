import { Feather } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListRow, PromoBanner, SearchBar } from "../components";
import { CommunityMap } from "../components/CommunityMap";
import { getCommunityFlag } from "../data/communityFlags";
import { filterCommunities } from "../data/cultureFilters";
import { mockCommunities } from "../data/mockCommunities";
import { getFeaturedDishes, mockDishes } from "../data/mockDishes";
import { getRestaurantCount, mockRestaurants } from "../data/mockRestaurants";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  communityId: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const [query, setQuery] = useState("");
  const dishes = getFeaturedDishes(6);
  const nearby = mockCommunities.slice(0, 5);
  const isSearching = query.trim().length > 0;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as SearchResult[];

    const communities = filterCommunities(mockCommunities, {
      culture: "all",
      query: q,
    }).map(
      (c): SearchResult => ({
        id: `c-${c.id}`,
        title: c.name,
        subtitle: `${c.neighborhood} · ${c.heritage}`,
        thumbnail: getCommunityFlag(c.id, c.emoji),
        communityId: c.id,
      }),
    );

    const restaurants = mockRestaurants
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.communityName.toLowerCase().includes(q) ||
          r.knownFor.some((k) => k.toLowerCase().includes(q)),
      )
      .map(
        (r): SearchResult => ({
          id: `r-${r.id}`,
          title: r.name,
          subtitle: `${r.communityName} · ${r.cuisine} · Restaurant`,
          thumbnail: r.emoji,
          communityId: r.communityId,
        }),
      );

    const dishHits = mockDishes
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.communityName.toLowerCase().includes(q) ||
          d.restaurantName.toLowerCase().includes(q) ||
          d.dietaryTags.some((t) => t.toLowerCase().includes(q)),
      )
      .map(
        (d): SearchResult => ({
          id: `d-${d.id}`,
          title: d.name,
          subtitle: `${d.restaurantName} · ${d.communityName}`,
          thumbnail: d.emoji,
          communityId: d.communityId,
        }),
      );

    return [...communities, ...restaurants, ...dishHits];
  }, [query]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subGreeting}>Ready to explore nearby?</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate("Notifications")}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Feather name="bell" size={20} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("Profile")}
              style={styles.avatar}
              hitSlop={8}
            >
              <Text style={styles.avatarText}>A</Text>
            </Pressable>
          </View>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search communities, dishes…"
        />

        {isSearching ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {searchResults.length === 0
                ? "No matches"
                : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`}
            </Text>
            {searchResults.length === 0 ? (
              <Text style={styles.emptySearch}>
                Try an enclave, restaurant, or dish name.
              </Text>
            ) : (
              searchResults.map((item) => (
                <ListRow
                  key={item.id}
                  thumbnail={item.thumbnail}
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={() => {
                    Keyboard.dismiss();
                    navigation.navigate("CommunityProfile", {
                      communityId: item.communityId,
                    });
                  }}
                />
              ))
            )}
          </View>
        ) : (
          <>
            <View style={styles.mapPeek}>
              <CommunityMap communities={mockCommunities} interactive={false} />
              <Pressable
                style={styles.mapHitArea}
                onPress={() => navigation.navigate("Map")}
              >
                <View style={styles.mapCta}>
                  <Feather name="maximize-2" size={14} color={colors.forest} />
                  <Text style={styles.mapCtaText}>Open map</Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <PromoBanner
                text="Taste of Queens challenge — stamp 4 communities this weekend"
                icon="award"
                onPress={() => navigation.navigate("Discover")}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dishes to try</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dishRow}
              >
                {dishes.map((dish) => (
                  <View key={dish.id} style={styles.dishCard}>
                    <View style={styles.dishImage}>
                      <Text style={styles.dishEmoji}>{dish.emoji}</Text>
                    </View>
                    <Text style={styles.dishName} numberOfLines={1}>
                      {dish.name}
                    </Text>
                    <Text style={styles.dishCommunity} numberOfLines={1}>
                      {dish.restaurantName}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.entryRow}>
              <Pressable
                style={styles.entryCard}
                onPress={() => navigation.navigate("Discover")}
              >
                <Feather name="map" size={20} color={colors.forest} />
                <Text style={styles.entryTitle}>Discover routes</Text>
                <Text style={styles.entrySub}>Curated walks near you</Text>
              </Pressable>
              <Pressable
                style={styles.entryCard}
                onPress={() => navigation.navigate("DropIn")}
              >
                <Feather name="shuffle" size={20} color={colors.forest} />
                <Text style={styles.entryTitle}>Drop In</Text>
                <Text style={styles.entrySub}>Surprise me nearby</Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nearby communities</Text>
              {nearby.map((c) => (
                <ListRow
                  key={c.id}
                  thumbnail={getCommunityFlag(c.id, c.emoji)}
                  title={c.name}
                  subtitle={`${c.neighborhood} · ${getRestaurantCount(c.id)} restaurants · ${c.distanceMiles} mi`}
                  onPress={() =>
                    navigation.navigate("CommunityProfile", {
                      communityId: c.id,
                    })
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  greeting: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.ink,
  },
  subGreeting: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: typography.bodySemibold,
    color: colors.white,
    fontSize: 14,
  },
  mapPeek: {
    height: 200,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mapHitArea: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 12,
  },
  mapCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapCtaText: {
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    color: colors.forest,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 12,
  },
  emptySearch: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
  },
  dishRow: {
    gap: 12,
    paddingRight: 8,
  },
  dishCard: {
    width: 120,
  },
  dishImage: {
    width: 120,
    height: 100,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dishEmoji: {
    fontSize: 36,
  },
  dishName: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  dishCommunity: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  entryRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  entryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 4,
  },
  entrySub: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
  },
});
