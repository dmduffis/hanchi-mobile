import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchUserFavorites,
  toggleFavorite,
  type ApiFavorite,
} from "../api/favorites";
import { Chip, FavoriteThumb, ListRow, SkeletonListRows } from "../components";
import {
  getCommunityCountryCode,
  getCommunityFlag,
} from "../data/communityFlags";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import { IconHeart } from "../icons";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";

type Filter = "all" | "community" | "restaurant" | "dish";

function formatSavedAt(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function FavoritesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<ApiFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const swipeRefs = useRef(new Map<string, Swipeable>());
  const openSwipeKey = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserFavorites();
      setItems(data);
    } catch {
      // API may still be deploying — show empty state instead of a hard error.
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const data = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.type === filter);
  }, [filter, items]);

  const onUnfavorite = async (item: ApiFavorite) => {
    setItems((prev) =>
      prev.filter(
        (f) => !(f.type === item.type && f.targetId === item.targetId),
      ),
    );
    try {
      await toggleFavorite(item.type, item.targetId);
    } catch {
      void load();
    }
  };

  const onOpen = (item: ApiFavorite) => {
    if (item.type === "community") {
      navigation.navigate("CommunityProfile", {
        communityId: item.targetId,
      });
      return;
    }
    if (item.type === "restaurant") {
      navigation.navigate("RestaurantDetail", {
        restaurantId: item.targetId,
      });
      return;
    }
    if (item.type === "dish") {
      const restaurantId = item.restaurantId ?? item.targetId;
      if (restaurantId) {
        navigation.navigate("RestaurantDetail", { restaurantId });
      }
    }
  };

  const renderItem = ({ item }: { item: ApiFavorite }) => {
    const rowKey = `${item.type}:${item.targetId}`;
    const communityId =
      item.type === "community" ? item.targetId : item.communityId;

    const countryCode =
      item.type === "community"
        ? getCommunityCountryCode(item.targetId)
        : (primaryEthnicityCountryCode(item.ethnicities) ??
          (communityId ? getCommunityCountryCode(communityId) : undefined));

    const flag =
      item.type === "community"
        ? getCommunityFlag(item.targetId, item.emoji)
        : item.ethnicities?.length
          ? primaryEthnicityEmoji(item.ethnicities)
          : communityId
            ? getCommunityFlag(communityId, item.emoji)
            : item.emoji;

    const renderRightActions = () => (
      <Pressable
        style={styles.removeAction}
        onPress={() => {
          swipeRefs.current.get(rowKey)?.close();
          void onUnfavorite(item);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.title} from favorites`}
      >
        <Text style={styles.removeActionText}>Remove</Text>
      </Pressable>
    );

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeRefs.current.set(rowKey, ref);
          else swipeRefs.current.delete(rowKey);
        }}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
        renderRightActions={renderRightActions}
        onSwipeableOpen={() => {
          if (openSwipeKey.current && openSwipeKey.current !== rowKey) {
            swipeRefs.current.get(openSwipeKey.current)?.close();
          }
          openSwipeKey.current = rowKey;
        }}
        onSwipeableClose={() => {
          if (openSwipeKey.current === rowKey) openSwipeKey.current = null;
        }}
      >
        <View style={styles.rowBg}>
          <ListRow
            leading={
              <FavoriteThumb
                kind={item.type}
                imageUrl={item.imageUrl}
                countryCode={countryCode}
                flag={flag}
              />
            }
            title={item.title}
            subtitle={`${item.subtitle}${item.savedAt ? ` · Saved ${formatSavedAt(item.savedAt)}` : ""}`}
            onPress={() => onOpen(item)}
          />
        </View>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.count}>{items.length} saved</Text>
      </View>

      <View style={styles.filters}>
        <Chip
          label="All"
          size="sm"
          selected={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <Chip
          label="Communities"
          size="sm"
          selected={filter === "community"}
          onPress={() => setFilter("community")}
        />
        <Chip
          label="Restaurants"
          size="sm"
          selected={filter === "restaurant"}
          onPress={() => setFilter("restaurant")}
        />
        <Chip
          label="Dishes"
          size="sm"
          selected={filter === "dish"}
          onPress={() => setFilter("dish")}
        />
      </View>

      {loading ? (
        <View style={styles.list}>
          <SkeletonListRows count={7} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => `${item.type}:${item.targetId}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <IconHeart size={36} color={colors.grayLight} />
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.empty}>
                Tap the heart on a community or restaurant while you explore.
                Saved spots will show up here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.ink,
  },
  count: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  rowBg: {
    backgroundColor: colors.background,
  },
  removeAction: {
    backgroundColor: colors.heart,
    justifyContent: "center",
    alignItems: "center",
    width: 96,
    marginVertical: 4,
    borderRadius: radii.sm,
  },
  removeActionText: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.white,
  },
  empty: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: 48,
    gap: 10,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
    textAlign: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
