import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fetchCommunity, type ApiCommunityDetail } from "../api/communities";
import { pointToLatLng, type LatLng } from "../api/geo";
import { mapApiCommunity } from "../api/mappers";
import type { ApiPoi } from "../api/search";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import { IconArrowsMaximize, IconX } from "../icons";
import { displayDescription, displayNeighborhood } from "../lib/communityCopy";
import { colors, radii, typography } from "../theme";
import { Chip } from "./Chip";
import { EnclaveDetailMap } from "./EnclaveDetailMap";
import { FavoriteHeart } from "./FavoriteHeart";
import { FavoriteThumb } from "./FavoriteThumb";
import { ListRow } from "./ListRow";
import { PassportStampButton } from "./PassportStampButton";
import { PriceRatingRow } from "./PriceRatingRow";
import { SkeletonSheet } from "./Skeleton";

const SHORT_DESC_CHARS = 140;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.85;

function ethnicityLabel(id: string): string {
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type CommunityDetailSheetProps = {
  communityId: string;
  onClose: () => void;
  onReadMore: (communityId: string) => void;
  onRestaurantPress: (restaurantId: string) => void;
  /** Expand mini-map → zoom main map into this community's restaurants. */
  onExpandRestaurants?: (payload: {
    communityId: string;
    communityName: string;
    centroid: LatLng;
    restaurantCoords: LatLng[];
  }) => void;
};

function truncateDescription(text: string): {
  short: string;
  truncated: boolean;
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return { short: "", truncated: false };
  }
  if (trimmed.length <= SHORT_DESC_CHARS) {
    return { short: trimmed, truncated: false };
  }
  const slice = trimmed.slice(0, SHORT_DESC_CHARS);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 80 ? slice.slice(0, lastSpace) : slice;
  return { short: `${cut.trimEnd()}…`, truncated: true };
}

function RestaurantCard({
  poi,
  onPress,
}: {
  poi: ApiPoi;
  onPress: () => void;
}) {
  return (
    <ListRow
      leading={
        <FavoriteThumb
          kind="restaurant"
          imageUrl={poi.imageUrl}
          countryCode={primaryEthnicityCountryCode(poi.ethnicities)}
          flag={primaryEthnicityEmoji(poi.ethnicities)}
          size={56}
        />
      }
      title={poi.name}
      onPress={onPress}
      belowElement={
        <View>
          <PriceRatingRow
            priceLevel={poi.priceLevel}
            rating={poi.rating}
            compact
          />
          {poi.category ? (
            <Text style={styles.restaurantPlaceType} numberOfLines={1}>
              {poi.category}
            </Text>
          ) : null}
        </View>
      }
      rightElement={
        <FavoriteHeart type="restaurant" targetId={poi.id} size={16} circled />
      }
    />
  );
}

export function CommunityDetailSheet({
  communityId,
  onClose,
  onReadMore,
  onRestaurantPress,
  onExpandRestaurants,
}: CommunityDetailSheetProps) {
  const [detail, setDetail] = useState<ApiCommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ethnicityFilter, setEthnicityFilter] = useState<string | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onCloseRef.current();
    });
  }, [translateY]);

  const finishPan = useCallback(
    (dy: number, vy: number) => {
      if (dy > DISMISS_DISTANCE || vy > DISMISS_VELOCITY) {
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 180,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) onCloseRef.current();
        });
        return;
      }
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    },
    [translateY],
  );

  // Grabber: always claims the gesture so swipe-down close is reliable.
  const grabberPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => finishPan(g.dy, g.vy),
      onPanResponderTerminate: () => finishPan(0, 0),
    }),
  ).current;

  // Do NOT use capture here — it steals the list's downward scroll and
  // makes the restaurant list look clipped. Dismiss via the grabber instead.

  useEffect(() => {
    translateY.setValue(0);
  }, [communityId, translateY]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    setEthnicityFilter(null);
    fetchCommunity(communityId)
      .then((res) => {
        if (!cancelled) setDetail(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const community = detail ? mapApiCommunity(detail) : null;
  const pois = detail?.pois ?? [];
  const { short, truncated } = useMemo(
    () => truncateDescription(displayDescription(community?.description ?? "")),
    [community?.description],
  );
  const neighborhoodLine = community
    ? displayNeighborhood(
        community.name,
        community.neighborhood,
        community.heritage,
      )
    : "";

  const ethnicityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    pois.forEach((p) => {
      (p.ethnicities ?? []).forEach((id) => {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([id]) => id);
  }, [pois]);

  const visiblePois = useMemo(() => {
    if (!ethnicityFilter) return pois;
    return pois.filter((p) => (p.ethnicities ?? []).includes(ethnicityFilter));
  }, [pois, ethnicityFilter]);

  const mapCentroid = useMemo(() => {
    if (!community) return null;
    if (
      !Number.isFinite(community.latitude) ||
      !Number.isFinite(community.longitude)
    ) {
      return null;
    }
    return {
      latitude: community.latitude,
      longitude: community.longitude,
    };
  }, [community]);

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
      <View {...grabberPan.panHandlers} style={styles.grabberHit}>
        <View style={styles.grabber} />
      </View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          {community ? (
            <>
              <Text style={styles.title} numberOfLines={2}>
                {community.name}
              </Text>
              {neighborhoodLine ? (
                <Text style={styles.neighborhood} numberOfLines={1}>
                  {neighborhoodLine}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.title}>Community</Text>
          )}
        </View>
        {community ? (
          <View style={styles.headerActions}>
            <FavoriteHeart type="community" targetId={community.id} size={20} />
            <PassportStampButton communityId={community.id} size={20} compact />
          </View>
        ) : null}
        <Pressable
          style={styles.closeBtn}
          onPress={dismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close community details"
        >
          <IconX size={16} color={colors.ink} />
        </Pressable>
      </View>

      {loading ? (
        <SkeletonSheet />
      ) : error || !community ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? "Community not found"}</Text>
          <Pressable onPress={dismiss} style={styles.retryLink}>
            <Text style={styles.readMore}>Close</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces
            nestedScrollEnabled
          >
            {short ? (
              <View style={styles.aboutBlock}>
                <Text style={styles.bodyText}>{short}</Text>
                <Pressable
                  onPress={() => onReadMore(community.id)}
                  hitSlop={6}
                  style={styles.readMoreBtn}
                >
                  <Text style={styles.readMore}>
                    {truncated ? "Read more" : "View full profile"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => onReadMore(community.id)}
                hitSlop={6}
                style={styles.readMoreBtn}
              >
                <Text style={styles.readMore}>View full profile</Text>
              </Pressable>
            )}

            <View style={styles.mapWrap}>
              <EnclaveDetailMap
                key={`${community.id}|${visiblePois.map((p) => p.id).join(",")}`}
                centroid={mapCentroid}
                pois={visiblePois}
                onPoiPress={onRestaurantPress}
                height={160}
              />
              {onExpandRestaurants && mapCentroid ? (
                <Pressable
                  style={styles.expandBtn}
                  onPress={() => {
                    const restaurantCoords = visiblePois
                      .map((p) => pointToLatLng(p.location))
                      .filter((c): c is LatLng => c != null);
                    onExpandRestaurants({
                      communityId: community.id,
                      communityName: community.name,
                      centroid: mapCentroid,
                      restaurantCoords,
                    });
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Show restaurants on map"
                >
                  <IconArrowsMaximize size={16} color={colors.forest} />
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>
              {pois.length > 0
                ? `${visiblePois.length}${
                    ethnicityFilter ? ` of ${pois.length}` : ""
                  } restaurant${visiblePois.length === 1 ? "" : "s"}`
                : "Restaurants"}
            </Text>

            {ethnicityOptions.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                keyboardShouldPersistTaps="handled"
              >
                <Chip
                  label="All"
                  selected={ethnicityFilter === null}
                  onPress={() => setEthnicityFilter(null)}
                />
                {ethnicityOptions.map((id) => (
                  <Chip
                    key={id}
                    label={ethnicityLabel(id)}
                    selected={ethnicityFilter === id}
                    onPress={() =>
                      setEthnicityFilter(id === ethnicityFilter ? null : id)
                    }
                  />
                ))}
              </ScrollView>
            ) : null}

            {pois.length === 0 ? (
              <Text style={styles.emptyRestaurants}>
                No restaurants listed for this community yet.
              </Text>
            ) : visiblePois.length === 0 ? (
              <Text style={styles.emptyRestaurants}>
                No restaurants match this filter.
              </Text>
            ) : (
              visiblePois.map((poi) => (
                <RestaurantCard
                  key={poi.id}
                  poi={poi}
                  onPress={() => onRestaurantPress(poi.id)}
                />
              ))
            )}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "30%",
    bottom: 0,
    zIndex: 30,
    elevation: 30,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    overflow: "hidden",
  },
  grabberHit: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginBottom: 2,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingBottom: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 24,
    lineHeight: 26,
    color: colors.ink,
  },
  neighborhood: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    marginTop: 0,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
  },
  retryLink: {
    paddingVertical: 4,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  aboutBlock: {
    marginBottom: 16,
  },
  bodyText: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
  },
  readMoreBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  readMore: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.forest,
  },
  mapWrap: {
    marginBottom: 18,
  },
  expandBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 10,
  },
  chipRow: {
    gap: 8,
    marginBottom: 12,
    paddingRight: 4,
  },
  emptyRestaurants: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
  },
  restaurantPlaceType: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 3,
  },
});
