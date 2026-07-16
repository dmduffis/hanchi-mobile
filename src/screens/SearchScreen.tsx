import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListRow, PromoBanner, SearchBar } from "../components";
import { mockCommunities } from "../data/mockCommunities";
import { mockDishes } from "../data/mockDishes";
import { mockRestaurants } from "../data/mockRestaurants";
import type { RootStackParamList } from "../navigation/types";
import { colors, typography } from "../theme";

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  communityId: string;
  kind: "community" | "restaurant" | "dish";
};

export function SearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const communityResults: SearchResult[] = mockCommunities.map((c) => ({
      id: `c-${c.id}`,
      title: c.name,
      subtitle: `${c.neighborhood} · ${c.heritage}`,
      thumbnail: c.emoji,
      communityId: c.id,
      kind: "community",
    }));
    const restaurantResults: SearchResult[] = mockRestaurants.map((r) => ({
      id: `r-${r.id}`,
      title: r.name,
      subtitle: `${r.communityName} · ${r.cuisine} · Restaurant`,
      thumbnail: r.emoji,
      communityId: r.communityId,
      kind: "restaurant",
    }));
    const dishResults: SearchResult[] = mockDishes.map((d) => ({
      id: `d-${d.id}`,
      title: d.name,
      subtitle: `${d.restaurantName} · ${d.communityName}`,
      thumbnail: d.emoji,
      communityId: d.communityId,
      kind: "dish",
    }));
    const all = [...communityResults, ...restaurantResults, ...dishResults];
    if (!q) return all.slice(0, 10);
    return all.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.searchFlex}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Search communities, restaurants…"
          />
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.tip}>
            <PromoBanner
              text="While you're there — try the weekend market on Main Street"
              icon="map-pin"
            />
            <Text style={styles.resultsLabel}>
              {query ? `Results for "${query}"` : "Popular near you"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ListRow
            thumbnail={item.thumbnail}
            title={item.title}
            subtitle={item.subtitle}
            onPress={() =>
              navigation.navigate("CommunityProfile", {
                communityId: item.communityId,
              })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No matches. Try a neighborhood or dish name.
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
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  tip: {
    marginBottom: 8,
    gap: 20,
  },
  resultsLabel: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.gray,
  },
  empty: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    marginTop: 24,
    textAlign: "center",
  },
});
