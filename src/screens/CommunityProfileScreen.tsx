import { Feather } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge, Chip, ListRow, PrimaryButton } from "../components";
import {
  getCommunityById,
  getInsidersForCommunity,
  mockCommunities,
} from "../data/mockCommunities";
import {
  getDishesForCommunity,
  getDishesForRestaurant,
} from "../data/mockDishes";
import { getRestaurantsForCommunity } from "../data/mockRestaurants";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";
import type { CommunityProfileTab } from "../types";

const TABS: CommunityProfileTab[] = ["About", "Food", "Insiders"];

export function CommunityProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CommunityProfile">>();
  const community =
    getCommunityById(route.params.communityId) ?? mockCommunities[0];
  const [tab, setTab] = useState<CommunityProfileTab>(
    route.params.initialTab ?? "Food",
  );
  const [foodFilter, setFoodFilter] = useState<string | null>(null);

  const restaurants = useMemo(
    () => getRestaurantsForCommunity(community.id),
    [community.id],
  );
  const dishes = useMemo(
    () => getDishesForCommunity(community.id),
    [community.id],
  );
  const insiders = useMemo(
    () => getInsidersForCommunity(community.id),
    [community.id],
  );
  const dietaryOptions = useMemo(() => {
    const tags = new Set<string>();
    dishes.forEach((d) => d.dietaryTags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [dishes]);

  const visibleRestaurants = useMemo(() => {
    if (!foodFilter) return restaurants;
    return restaurants.filter((r) =>
      getDishesForRestaurant(r.id).some((d) =>
        d.dietaryTags.includes(foodFilter),
      ),
    );
  }, [restaurants, foodFilter]);

  const related = community.relatedIds
    .map((id) => getCommunityById(id))
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {community.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{community.emoji}</Text>
        </View>
        <Text style={styles.name}>{community.name}</Text>
        <Text style={styles.neighborhood}>{community.neighborhood}</Text>
        <View style={styles.tags}>
          {community.tags.map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </View>

        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text
                style={[styles.tabLabel, tab === t && styles.tabLabelActive]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "About" && (
          <View style={styles.tabContent}>
            <Text style={styles.body}>{community.description}</Text>
            <View style={styles.quote}>
              <Text style={styles.quoteText}>"{community.pullQuote}"</Text>
              <Text style={styles.quoteAuthor}>
                — {community.pullQuoteAuthor}
              </Text>
            </View>
            {restaurants.length > 0 && (
              <View style={styles.aboutFood}>
                <Text style={styles.sectionTitle}>
                  {restaurants.length} restaurants nearby
                </Text>
                {restaurants.slice(0, 3).map((r) => (
                  <ListRow
                    key={r.id}
                    thumbnail={r.emoji}
                    title={r.name}
                    subtitle={`${r.cuisine} · ${r.priceLevel}`}
                    onPress={() => setTab("Food")}
                  />
                ))}
                <Pressable
                  style={styles.savePrompt}
                  onPress={() => setTab("Food")}
                >
                  <Feather name="coffee" size={16} color={colors.forest} />
                  <Text style={styles.savePromptText}>
                    See all food in {community.name}
                  </Text>
                </Pressable>
              </View>
            )}
            <PrimaryButton
              label="See on map"
              onPress={() => navigation.navigate("MainTabs", { screen: "Map" })}
              style={{ marginTop: 8 }}
            />
            <Pressable
              style={styles.savePrompt}
              onPress={() =>
                navigation.navigate("MainTabs", { screen: "Favorites" })
              }
            >
              <Feather name="heart" size={16} color={colors.forest} />
              <Text style={styles.savePromptText}>Save to favorites</Text>
            </Pressable>
            {related.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>Related communities</Text>
                {related.map((c) =>
                  c ? (
                    <ListRow
                      key={c.id}
                      thumbnail={c.emoji}
                      title={c.name}
                      subtitle={`${c.neighborhood} · ${c.heritage}`}
                      onPress={() =>
                        navigation.push("CommunityProfile", {
                          communityId: c.id,
                        })
                      }
                    />
                  ) : null,
                )}
              </View>
            )}
          </View>
        )}

        {tab === "Food" && (
          <View style={styles.tabContent}>
            <Text style={styles.foodIntro}>
              {restaurants.length} restaurants · {dishes.length} dishes to try
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <Chip
                label="All"
                selected={foodFilter === null}
                onPress={() => setFoodFilter(null)}
              />
              {dietaryOptions.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={foodFilter === tag}
                  onPress={() => setFoodFilter(tag === foodFilter ? null : tag)}
                />
              ))}
            </ScrollView>

            {visibleRestaurants.length === 0 ? (
              <Text style={styles.body}>No restaurants match this filter.</Text>
            ) : (
              visibleRestaurants.map((restaurant) => {
                const restaurantDishes = getDishesForRestaurant(
                  restaurant.id,
                ).filter(
                  (d) => !foodFilter || d.dietaryTags.includes(foodFilter),
                );
                return (
                  <View key={restaurant.id} style={styles.restaurantBlock}>
                    <View style={styles.restaurantHeader}>
                      <View style={styles.restaurantEmojiWrap}>
                        <Text style={styles.restaurantEmoji}>
                          {restaurant.emoji}
                        </Text>
                      </View>
                      <View style={styles.restaurantInfo}>
                        <Text style={styles.restaurantName}>
                          {restaurant.name}
                        </Text>
                        <Text style={styles.restaurantMeta}>
                          {restaurant.cuisine} · {restaurant.priceLevel} ·{" "}
                          {restaurant.address}
                        </Text>
                        <Text style={styles.restaurantBlurb}>
                          {restaurant.blurb}
                        </Text>
                      </View>
                    </View>
                    {restaurantDishes.map((dish) => (
                      <ListRow
                        key={dish.id}
                        thumbnail={dish.emoji}
                        title={dish.name}
                        subtitle={dish.description}
                        showChevron={false}
                        rightElement={
                          dish.dietaryTags[0] ? (
                            <Badge label={dish.dietaryTags[0]} />
                          ) : undefined
                        }
                      />
                    ))}
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === "Insiders" && (
          <View style={styles.tabContent}>
            {insiders.length === 0 ? (
              <Text style={styles.body}>
                No insider notes yet for this community.
              </Text>
            ) : (
              insiders.map((insider) => (
                <View key={insider.id} style={styles.insiderCard}>
                  <Text style={styles.insiderQuote}>"{insider.quote}"</Text>
                  <Text style={styles.insiderMeta}>
                    {insider.author} · {insider.role}
                  </Text>
                </View>
              ))
            )}
          </View>
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
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  hero: {
    height: 160,
    borderRadius: radii.lg,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 64,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 32,
    color: colors.ink,
  },
  neighborhood: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.gray,
    marginTop: 4,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tabBar: {
    flexDirection: "row",
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.forest,
  },
  tabLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.gray,
  },
  tabLabelActive: {
    color: colors.forest,
    fontFamily: typography.bodySemibold,
  },
  tabContent: {
    paddingTop: 20,
  },
  body: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 24,
  },
  quote: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  quoteText: {
    fontFamily: typography.display,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 26,
  },
  quoteAuthor: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 10,
  },
  savePrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  savePromptText: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.forest,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
  },
  chipRow: {
    gap: 8,
    marginBottom: 12,
  },
  foodIntro: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.gray,
    marginBottom: 12,
  },
  aboutFood: {
    marginTop: 24,
  },
  restaurantBlock: {
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  restaurantHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  restaurantEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantEmoji: {
    fontSize: 24,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
  },
  restaurantMeta: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.forest,
    marginTop: 2,
  },
  restaurantBlurb: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
    lineHeight: 18,
  },
  insiderCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insiderQuote: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
  },
  insiderMeta: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.gray,
    marginTop: 10,
  },
});
