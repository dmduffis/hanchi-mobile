import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  getCommunityCountryCode,
  getCommunityFlag,
} from "../data/communityFlags";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import {
  SEARCH_KIND_FILTERS,
  countSearchKinds,
  filterSearchResults,
  type SearchKindFilter,
  type SearchResult,
} from "../lib/searchResults";
import { colors, radii, typography } from "../theme";
import { Chip } from "./Chip";
import { FavoriteThumb } from "./FavoriteThumb";
import { ListRow } from "./ListRow";

function leadingForResult(item: SearchResult) {
  const communityId = item.communityId;
  const countryCode =
    item.kind === "community" && communityId
      ? getCommunityCountryCode(communityId)
      : (primaryEthnicityCountryCode(item.ethnicities) ??
        (communityId ? getCommunityCountryCode(communityId) : undefined));

  const flag =
    item.kind === "community" && communityId
      ? getCommunityFlag(communityId, item.emoji ?? item.thumbnail)
      : item.ethnicities?.length
        ? primaryEthnicityEmoji(item.ethnicities)
        : communityId
          ? getCommunityFlag(communityId, item.emoji ?? item.thumbnail)
          : item.thumbnail;

  return (
    <FavoriteThumb
      kind={item.kind}
      imageUrl={item.imageUrl}
      countryCode={countryCode}
      flag={flag}
    />
  );
}

type SearchResultsPanelProps = {
  results: SearchResult[];
  loading: boolean;
  searchKind: SearchKindFilter;
  onChangeKind: (kind: SearchKindFilter) => void;
  onPressResult: (item: SearchResult) => void;
  /** Cap list height when overlaying the map. */
  maxHeight?: number;
};

export function SearchResultsPanel({
  results,
  loading,
  searchKind,
  onChangeKind,
  onPressResult,
  maxHeight,
}: SearchResultsPanelProps) {
  const counts = countSearchKinds(results);
  const filtered = filterSearchResults(results, searchKind);

  const title = loading
    ? "Searching…"
    : results.length === 0
      ? "No matches"
      : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;

  return (
    <View style={[styles.panel, maxHeight != null && { maxHeight }]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.filterRow}>
        {SEARCH_KIND_FILTERS.map((filter) => {
          const count = counts[filter.id];
          const empty = filter.id !== "all" && count === 0;
          return (
            <Chip
              key={filter.id}
              label={
                loading || results.length === 0
                  ? filter.label
                  : `${filter.label} · ${count}`
              }
              size="sm"
              selected={searchKind === filter.id}
              onPress={empty ? undefined : () => onChangeKind(filter.id)}
            />
          );
        })}
      </View>

      {results.length === 0 && !loading ? (
        <Text style={styles.empty}>
          Try an enclave, restaurant, or dish name.
        </Text>
      ) : filtered.length === 0 && !loading ? (
        <Text style={styles.empty}>
          Nothing in this filter. Try All or another type.
        </Text>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.list}
        >
          {filtered.map((item) => (
            <ListRow
              key={item.id}
              leading={leadingForResult(item)}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => onPressResult(item)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  list: {
    flexGrow: 0,
  },
  empty: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    paddingVertical: 8,
    paddingBottom: 12,
  },
});
