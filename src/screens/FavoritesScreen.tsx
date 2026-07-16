import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip, ListRow } from "../components";
import { mockFavorites } from "../data/mockFavorites";
import type { RootStackParamList } from "../navigation/types";
import { colors, typography } from "../theme";
import type { FavoriteItem } from "../types";

type Filter = "all" | "community" | "restaurant" | "dish";

export function FavoritesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<Filter>("all");

  const data = useMemo(() => {
    if (filter === "all") return mockFavorites;
    return mockFavorites.filter((item) => item.type === filter);
  }, [filter]);

  const renderItem = ({ item }: { item: FavoriteItem }) => (
    <ListRow
      thumbnail={item.emoji}
      title={item.title}
      subtitle={`${item.subtitle} · Saved ${item.savedAt}`}
      onPress={() =>
        navigation.navigate("CommunityProfile", {
          communityId: item.communityId,
        })
      }
      rightElement={
        <Pressable hitSlop={8} style={styles.heartBtn}>
          <Feather name="heart" size={16} color={colors.forest} />
        </Pressable>
      }
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.count}>{mockFavorites.length} saved</Text>
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

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nothing saved yet. Heart a community or dish to start.
          </Text>
        }
      />
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
    marginTop: 40,
    lineHeight: 22,
  },
});
