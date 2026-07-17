import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchCommunities } from "../api/communities";
import { searchAll } from "../api/search";
import { ListRow, PromoBanner, SearchBar } from "../components";
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

function mapLiveResults(
  communities: {
    id: string;
    name: string;
    neighborhood: string;
    city: string;
    heroEmoji: string | null;
  }[],
  pois: { id: string; communityId: string; name: string; category: string }[],
  dishes: {
    id: string;
    poiId: string;
    name: string;
    poiName?: string;
  }[],
): SearchResult[] {
  const poiCommunity = new Map(pois.map((p) => [p.id, p.communityId]));
  const fallbackCommunityId = communities[0]?.id ?? "";

  return [
    ...communities.map((c) => ({
      id: `c-${c.id}`,
      title: c.name,
      subtitle: `${c.neighborhood}${c.city ? ` · ${c.city}` : ""}`,
      thumbnail: c.heroEmoji ?? "📍",
      communityId: c.id,
      kind: "community" as const,
    })),
    ...pois.map((p) => ({
      id: `r-${p.id}`,
      title: p.name,
      subtitle: `${p.category} · Place`,
      thumbnail: "🍽️",
      communityId: p.communityId,
      kind: "restaurant" as const,
    })),
    ...dishes.map((d) => ({
      id: `d-${d.id}`,
      title: d.name,
      subtitle: d.poiName ? `${d.poiName} · Dish` : "Dish",
      thumbnail: "🥢",
      communityId: poiCommunity.get(d.poiId) ?? fallbackCommunityId,
      kind: "dish" as const,
    })),
  ];
}

export function SearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(
      async () => {
        setLoading(true);
        setError(null);
        try {
          const q = query.trim();
          if (!q) {
            const communities = await fetchCommunities();
            if (cancelled) return;
            setResults(mapLiveResults(communities, [], []).slice(0, 10));
          } else {
            const data = await searchAll(q);
            if (cancelled) return;
            setResults(
              mapLiveResults(data.communities, data.pois, data.dishes),
            );
          }
        } catch (err) {
          if (cancelled) return;
          setResults([]);
          setError(
            err instanceof Error ? err.message : "Failed to load search",
          );
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      query.trim() ? 250 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.empty}>
            Set EXPO_PUBLIC_API_URL in .env to your Railway URL, then restart
            Expo.
          </Text>
        </View>
      ) : (
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
                {query ? `Results for "${query}"` : "From the Sinta API"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ListRow
              thumbnail={item.thumbnail}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => {
                if (!item.communityId) return;
                navigation.navigate("CommunityProfile", {
                  communityId: item.communityId,
                });
              }}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No matches. Try a neighborhood or dish name.
            </Text>
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
    paddingHorizontal: 24,
  },
  error: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
