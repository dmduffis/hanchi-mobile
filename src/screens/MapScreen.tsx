import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Chip, ListRow, SearchBar } from "../components";
import { CircularFlag } from "../components/CircularFlag";
import { CommunityMap } from "../components/CommunityMap";
import { getCommunityFlag } from "../data/communityFlags";
import {
  CULTURE_FILTERS,
  filterCommunities,
  getAffinityLabels,
  type CultureFilterId,
} from "../data/cultureFilters";
import { mockCommunities } from "../data/mockCommunities";
import { getRestaurantCount } from "../data/mockRestaurants";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";
import type { Community } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_GAP = 12;
const CARD_INSET = (SCREEN_WIDTH - CARD_WIDTH) / 2;

type BottomMode = "cards" | "list";

export function MapScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<BottomMode>("cards");
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [culture, setCulture] = useState<CultureFilterId>("all");
  const listRef = useRef<FlatList<Community>>(null);
  const pendingScrollIndex = useRef<number | null>(null);

  const filtered = useMemo(
    () => filterCommunities(mockCommunities, { culture, query }),
    [culture, query],
  );

  useEffect(() => {
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [culture, query]);

  const openCommunity = (communityId: string) => {
    navigation.navigate("CommunityProfile", { communityId });
  };

  const scrollCarouselToIndex = (index: number, animated = true) => {
    listRef.current?.scrollToOffset({
      offset: index * (CARD_WIDTH + CARD_GAP),
      animated,
    });
  };

  const scrollToCommunity = (communityId: string) => {
    const index = filtered.findIndex((c) => c.id === communityId);
    if (index < 0) return;

    setActiveIndex(index);

    if (mode !== "cards") {
      pendingScrollIndex.current = index;
      setMode("cards");
      return;
    }

    scrollCarouselToIndex(index);
  };

  useEffect(() => {
    if (mode !== "cards" || pendingScrollIndex.current === null) return;
    const index = pendingScrollIndex.current;
    pendingScrollIndex.current = null;
    const id = requestAnimationFrame(() => scrollCarouselToIndex(index));
    return () => cancelAnimationFrame(id);
  }, [mode]);

  const onCardsScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + CARD_GAP));
    setActiveIndex(
      Math.max(0, Math.min(index, Math.max(filtered.length - 1, 0))),
    );
  };

  const filterLabel =
    culture === "all" && !query.trim()
      ? `${filtered.length} enclaves`
      : `${filtered.length} match${filtered.length === 1 ? "" : "es"}`;

  return (
    <View style={styles.root}>
      <CommunityMap
        communities={filtered}
        filterKey={`${culture}|${query.trim().toLowerCase()}`}
        selectedId={filtered[activeIndex]?.id ?? null}
        onMarkerPress={scrollToCommunity}
      />

      <SafeAreaView
        style={styles.topOverlay}
        edges={["top"]}
        pointerEvents="box-none"
      >
        <View style={styles.searchRow}>
          <View style={styles.searchFlex}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search enclaves on the map…"
            />
          </View>
          <Pressable
            style={[styles.modeBtn, mode === "list" && styles.modeBtnActive]}
            onPress={() => setMode((m) => (m === "list" ? "cards" : "list"))}
            hitSlop={4}
          >
            <Feather
              name={mode === "list" ? "map" : "list"}
              size={18}
              color={mode === "list" ? colors.white : colors.forest}
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
          keyboardShouldPersistTaps="handled"
        >
          {CULTURE_FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              tone="overlay"
              selected={culture === f.id}
              onPress={() => setCulture(f.id)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {mode === "cards" ? (
        <View
          style={[
            styles.carouselWrap,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
          pointerEvents="box-none"
        >
          <Text style={styles.carouselLabel}>{filterLabel}</Text>
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No enclaves match</Text>
              <Text style={styles.emptySub}>
                Try another culture pill or clear search
              </Text>
              <Pressable
                onPress={() => {
                  setCulture("all");
                  setQuery("");
                }}
              >
                <Text style={styles.emptyAction}>Clear filters</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={filtered}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + CARD_GAP}
              snapToAlignment="start"
              disableIntervalMomentum
              contentContainerStyle={{
                paddingHorizontal: CARD_INSET,
                gap: CARD_GAP,
              }}
              onMomentumScrollEnd={onCardsScrollEnd}
              renderItem={({ item, index }) => {
                const groups = getAffinityLabels(item);
                return (
                  <Pressable
                    style={[
                      styles.card,
                      index === activeIndex && styles.cardActive,
                      { width: CARD_WIDTH },
                    ]}
                    onPress={() => openCommunity(item.id)}
                  >
                    <CircularFlag
                      flag={getCommunityFlag(item.id, item.emoji)}
                      size={52}
                      selected={index === activeIndex}
                    />
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {item.neighborhood} · {item.heritage}
                      </Text>
                      {groups.length > 0 ? (
                        <View style={styles.cardChips}>
                          {groups.map((label) => (
                            <View key={label} style={styles.cardChip}>
                              <Text style={styles.cardChipText}>{label}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.cardDistance}>
                          {item.station
                            ? `${item.subwayLines?.slice(0, 3).join(" · ") || "Transit"} · ${item.station}`
                            : `${getRestaurantCount(item.id)} spots · ${item.distanceMiles} mi`}
                        </Text>
                      )}
                    </View>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.grayLight}
                    />
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      ) : (
        <View
          style={[
            styles.listSheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Enclaves on the map</Text>
              <Text style={styles.sheetSub}>{filterLabel}</Text>
            </View>
            <Pressable
              style={styles.closeListBtn}
              onPress={() => setMode("cards")}
              hitSlop={8}
            >
              <Feather name="x" size={18} color={colors.ink} />
            </Pressable>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptySub}>
                No enclaves match these filters.
              </Text>
            }
            renderItem={({ item }) => (
              <ListRow
                thumbnail={getCommunityFlag(item.id, item.emoji)}
                title={item.name}
                subtitle={`${item.neighborhood} · ${getAffinityLabels(item).join(" · ") || item.heritage}`}
                onPress={() => openCommunity(item.id)}
              />
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  searchFlex: {
    flex: 1,
  },
  pills: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  modeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modeBtnActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  carouselWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  carouselLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.ink,
    marginBottom: 10,
    marginLeft: CARD_INSET,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  emptyCard: {
    marginHorizontal: CARD_INSET,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
  },
  emptySub: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    textAlign: "center",
  },
  emptyAction: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.forest,
    marginTop: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardActive: {
    borderColor: colors.gold,
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    fontFamily: typography.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  cardMeta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  cardChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  cardChip: {
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardChipText: {
    fontFamily: typography.bodyMedium,
    fontSize: 11,
    color: colors.forest,
  },
  cardDistance: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.forest,
    marginTop: 4,
  },
  listSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "32%",
    zIndex: 30,
    elevation: 30,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
  },
  sheetSub: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  closeListBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 16,
  },
});
