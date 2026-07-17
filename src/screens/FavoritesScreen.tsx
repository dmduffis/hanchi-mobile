import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchUserFavorites,
  toggleFavorite,
  type ApiFavorite,
} from "../api/favorites";
import { Chip, ListRow } from "../components";
import type { RootStackParamList } from "../navigation/types";
import { colors, typography } from "../theme";

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
    if (item.type === "restaurant" || item.type === "dish") {
      const restaurantId = item.restaurantId ?? item.targetId;
      if (item.type === "restaurant") {
        navigation.navigate("RestaurantDetail", {
          restaurantId: item.targetId,
        });
        return;
      }
      if (restaurantId) {
        navigation.navigate("RestaurantDetail", { restaurantId });
        return;
      }
    }
    if (item.communityId) {
      navigation.navigate("CommunityProfile", {
        communityId: item.communityId,
      });
    }
  };

  const renderItem = ({ item }: { item: ApiFavorite }) => (
    <ListRow
      thumbnail={item.emoji}
      title={item.title}
      subtitle={`${item.subtitle}${item.savedAt ? ` · Saved ${formatSavedAt(item.savedAt)}` : ""}`}
      onPress={() => onOpen(item)}
      rightElement={
        <Pressable
          hitSlop={8}
          style={styles.heartBtn}
          onPress={() => void onUnfavorite(item)}
          accessibilityLabel="Remove from favorites"
        >
          <Ionicons name="heart" size={16} color={colors.forest} />
        </Pressable>
      }
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.count}>{items.length} saved</Text>
      </View>

      <View style={styles.filters}>
        <Chip
          label="All"
          selected={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <Chip
          label="Communities"
          selected={filter === "community"}
          onPress={() => setFilter("community")}
        />
        <Chip
          label="Restaurants"
          selected={filter === "restaurant"}
          onPress={() => setFilter("restaurant")}
        />
        <Chip
          label="Dishes"
          selected={filter === "dish"}
          onPress={() => setFilter("dish")}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.forest} />
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
              <Ionicons name="heart-outline" size={36} color={colors.grayLight} />
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.empty}>
                Tap the heart on a restaurant or dish while you explore — saved
                spots will show up here.
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
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heartBtn: {
    padding: 4,
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
