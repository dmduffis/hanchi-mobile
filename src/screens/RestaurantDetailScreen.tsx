import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchCommunity, type ApiCommunity } from "../api/communities";
import { fetchUserFavorites } from "../api/favorites";
import { fetchPoi, type ApiPoiDetail } from "../api/pois";
import { Badge, CircularFlag, EthnicityFlags, FavoriteHeart, FavoriteThumb, ListRow } from "../components";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import {
  IconArrowLeft,
  IconChevronRight,
  IconClock,
  IconMapPin,
} from "../icons";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";

function formatRating(rating: number | null | undefined): string | null {
  if (rating == null || !Number.isFinite(rating)) return null;
  return rating.toFixed(1);
}

export function RestaurantDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RestaurantDetail">>();
  const restaurantId = route.params.restaurantId;

  const [poi, setPoi] = useState<ApiPoiDetail | null>(null);
  const [community, setCommunity] = useState<ApiCommunity | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [detail, favorites] = await Promise.all([
          fetchPoi(restaurantId),
          fetchUserFavorites().catch(() => []),
        ]);
        if (cancelled) return;
        setPoi(detail);
        setFavoriteIds(
          new Set(favorites.map((f) => `${f.type}:${f.targetId}`)),
        );
        if (detail.communityId) {
          try {
            const parent = await fetchCommunity(detail.communityId);
            if (!cancelled) setCommunity(parent);
          } catch {
            if (!cancelled) setCommunity(null);
          }
        } else if (!cancelled) {
          setCommunity(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const restaurantFavorited = useMemo(
    () => favoriteIds.has(`restaurant:${restaurantId}`),
    [favoriteIds, restaurantId],
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={["top"]}>
        <ActivityIndicator color={colors.forest} />
      </SafeAreaView>
    );
  }

  if (error || !poi) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={["top"]}>
        <Text style={styles.body}>{error ?? "Restaurant not found"}</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.linkText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const ratingLabel = formatRating(poi.rating);
  const metaParts = [
    poi.category,
    poi.priceLevel,
    ratingLabel ? `★ ${ratingLabel}` : null,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <IconArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {poi.name}
        </Text>
        <FavoriteHeart
          type="restaurant"
          targetId={poi.id}
          initialFavorited={restaurantFavorited}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          {poi.imageUrl ? (
            <Image
              source={{ uri: poi.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroEmoji}>🍽️</Text>
            </View>
          )}
          {poi.ethnicities?.length ? (
            <View style={styles.heroFlagBadge}>
              <CircularFlag
                countryCode={primaryEthnicityCountryCode(poi.ethnicities)}
                flag={primaryEthnicityEmoji(poi.ethnicities)}
                size={28}
                elevated
              />
            </View>
          ) : null}
        </View>

        <Text style={styles.name}>{poi.name}</Text>
        <Text style={styles.meta}>{metaParts.join(" · ")}</Text>

        {community ? (
          <Pressable
            onPress={() =>
              navigation.navigate("CommunityProfile", {
                communityId: community.id,
              })
            }
            style={styles.communityLink}
          >
            <IconMapPin size={14} color={colors.forest} />
            <Text style={styles.communityLinkText}>
              {community.name}
              {community.neighborhood ? ` · ${community.neighborhood}` : ""}
            </Text>
            <IconChevronRight size={16} color={colors.grayLight} />
          </Pressable>
        ) : null}

        <View style={styles.infoBlock}>
          {poi.address ? (
            <View style={styles.infoRow}>
              <IconMapPin size={16} color={colors.gray} />
              <Text style={styles.infoText}>{poi.address}</Text>
            </View>
          ) : null}
          {poi.hours ? (
            <View style={styles.infoRow}>
              <IconClock size={16} color={colors.gray} />
              <Text style={styles.infoText}>{poi.hours}</Text>
            </View>
          ) : null}
          <EthnicityFlags
            ethnicities={poi.ethnicities}
            size={22}
            style={styles.flags}
          />
        </View>

        <Text style={styles.sectionTitle}>
          {poi.dishes.length > 0
            ? `Dishes to try · ${poi.dishes.length}`
            : "Dishes to try"}
        </Text>
        {poi.dishes.length === 0 ? (
          <Text style={styles.bodyMuted}>No dish notes yet for this spot.</Text>
        ) : (
          poi.dishes.map((dish) => (
            <ListRow
              key={dish.id}
              leading={
                <FavoriteThumb
                  kind="dish"
                  imageUrl={dish.imageUrl}
                  countryCode={primaryEthnicityCountryCode(
                    dish.ethnicities?.length
                      ? dish.ethnicities
                      : poi.ethnicities,
                  )}
                  flag={primaryEthnicityEmoji(
                    dish.ethnicities?.length
                      ? dish.ethnicities
                      : poi.ethnicities,
                  )}
                  size={44}
                />
              }
              title={dish.name}
              subtitle={dish.description ?? undefined}
              showChevron={false}
              rightElement={
                <View style={styles.dishActions}>
                  {dish.priceRange ? <Badge label={dish.priceRange} /> : null}
                  <FavoriteHeart
                    type="dish"
                    targetId={dish.id}
                    size={18}
                    initialFavorited={favoriteIds.has(`dish:${dish.id}`)}
                  />
                </View>
              }
            />
          ))
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
  heroWrap: {
    width: "100%",
    marginBottom: 16,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: "100%",
    height: 200,
  },
  heroFallback: {
    height: 160,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  heroFlagBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
  },
  heroEmoji: {
    fontSize: 64,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.ink,
  },
  flags: {
    marginTop: 8,
  },
  meta: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.forest,
    marginTop: 6,
  },
  dishActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  communityLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
  },
  communityLinkText: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.forest,
  },
  infoBlock: {
    marginTop: 8,
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginTop: 28,
    marginBottom: 8,
  },
  body: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    textAlign: "center",
    lineHeight: 22,
  },
  bodyMuted: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    lineHeight: 22,
  },
  linkText: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.forest,
  },
});
