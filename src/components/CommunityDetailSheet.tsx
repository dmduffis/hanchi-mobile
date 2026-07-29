import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  fetchCommunity,
  type ApiCommunityDetail,
} from "../api/communities";
import { mapApiCommunity } from "../api/mappers";
import type { ApiPoi } from "../api/search";
import { IconChevronRight, IconX } from "../icons";
import { colors, radii, typography } from "../theme";
import { Badge } from "./Badge";
import { EnclaveDetailMap } from "./EnclaveDetailMap";
import { EthnicityFlags } from "./EthnicityFlags";

const SHORT_DESC_CHARS = 140;

type CommunityDetailSheetProps = {
  communityId: string;
  onClose: () => void;
  onReadMore: (communityId: string) => void;
  onRestaurantPress: (restaurantId: string) => void;
};

function truncateDescription(text: string): {
  short: string;
  truncated: boolean;
} {
  const trimmed = text.trim();
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
  const rating =
    poi.rating != null && Number.isFinite(poi.rating)
      ? `★ ${poi.rating.toFixed(1)}`
      : null;
  const meta = [poi.category, poi.priceLevel, rating].filter(Boolean).join(" · ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.restaurantCard, pressed && styles.pressed]}
    >
      <View style={styles.restaurantImageWrap}>
        {poi.imageUrl ? (
          <Image
            source={{ uri: poi.imageUrl }}
            style={styles.restaurantImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.restaurantImageFallback}>
            <Text style={styles.restaurantEmoji}>🍽️</Text>
          </View>
        )}
        {poi.ethnicities?.length ? (
          <View style={styles.restaurantFlagBadge}>
            <EthnicityFlags
              ethnicities={poi.ethnicities.slice(0, 1)}
              size={20}
            />
          </View>
        ) : null}
      </View>
      <View style={styles.restaurantBody}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {poi.name}
        </Text>
        {meta ? (
          <Text style={styles.restaurantMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {poi.address ? (
          <Text style={styles.restaurantAddress} numberOfLines={1}>
            {poi.address}
          </Text>
        ) : null}
      </View>
      <IconChevronRight size={18} color={colors.grayLight} />
    </Pressable>
  );
}

export function CommunityDetailSheet({
  communityId,
  onClose,
  onReadMore,
  onRestaurantPress,
}: CommunityDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<ApiCommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
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
    () => truncateDescription(community?.description ?? ""),
    [community?.description],
  );

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
    <View
      style={[
        styles.sheet,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.grabber} />
      <View style={styles.header}>
        <View style={styles.headerText}>
          {community ? (
            <>
              <Text style={styles.title} numberOfLines={2}>
                {community.name}
              </Text>
              <Text style={styles.neighborhood} numberOfLines={1}>
                {community.neighborhood}
              </Text>
            </>
          ) : (
            <Text style={styles.title}>Community</Text>
          )}
        </View>
        <Pressable
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close community details"
        >
          <IconX size={18} color={colors.ink} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.forest} />
        </View>
      ) : error || !community ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? "Community not found"}</Text>
          <Pressable onPress={onClose} style={styles.retryLink}>
            <Text style={styles.readMore}>Close</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {community.tags.length > 0 ? (
            <View style={styles.tags}>
              {community.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} label={tag} />
              ))}
            </View>
          ) : null}

          {short ? (
            <View style={styles.aboutBlock}>
              <Text style={styles.body}>{short}</Text>
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

          <EnclaveDetailMap
            key={community.id}
            centroid={mapCentroid}
            pois={pois}
            onPoiPress={onRestaurantPress}
            height={160}
            style={styles.map}
          />

          <Text style={styles.sectionTitle}>
            {pois.length > 0
              ? `${pois.length} restaurant${pois.length === 1 ? "" : "s"}`
              : "Restaurants"}
          </Text>

          {pois.length === 0 ? (
            <Text style={styles.emptyRestaurants}>
              No restaurants listed for this community yet.
            </Text>
          ) : (
            pois.map((poi) => (
              <RestaurantCard
                key={poi.id}
                poi={poi}
                onPress={() => onRestaurantPress(poi.id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "38%",
    zIndex: 30,
    elevation: 30,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.ink,
  },
  neighborhood: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  aboutBlock: {
    marginBottom: 16,
  },
  body: {
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
  map: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 10,
  },
  emptyRestaurants: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
  },
  restaurantCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
  restaurantImageWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  restaurantImage: {
    width: "100%",
    height: "100%",
  },
  restaurantImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantEmoji: {
    fontSize: 24,
  },
  restaurantFlagBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
  },
  restaurantBody: {
    flex: 1,
    gap: 2,
  },
  restaurantName: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
  },
  restaurantMeta: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.forest,
  },
  restaurantAddress: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
  },
});
