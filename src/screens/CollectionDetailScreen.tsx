import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchCollection,
  fetchCollectionBySlug,
  followCollection,
  removeCollectionItem,
  unfollowCollection,
  type ApiCollectionDetail,
  type ApiCollectionItem,
} from "../api/collections";
import { FavoriteThumb, ListRow } from "../components";
import {
  getCommunityCountryCode,
  getCommunityFlag,
} from "../data/communityFlags";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import { IconArrowLeft } from "../icons";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";

export function CollectionDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CollectionDetail">>();
  const collectionId = route.params.collectionId;
  const shareSlug = route.params.shareSlug;

  const [detail, setDetail] = useState<ApiCollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyFollow, setBusyFollow] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = shareSlug
        ? await fetchCollectionBySlug(shareSlug)
        : await fetchCollection(collectionId as string);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load collection");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [collectionId, shareSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const onOpenItem = (item: ApiCollectionItem) => {
    if (item.type === "community") {
      navigation.navigate("CommunityProfile", { communityId: item.targetId });
      return;
    }
    if (item.type === "restaurant") {
      navigation.navigate("RestaurantDetail", {
        restaurantId: item.targetId,
      });
      return;
    }
    if (item.restaurantId) {
      navigation.navigate("RestaurantDetail", {
        restaurantId: item.restaurantId,
      });
    }
  };

  const onRemove = async (item: ApiCollectionItem) => {
    if (!detail?.isOwner) return;
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter(
              (i) => !(i.type === item.type && i.targetId === item.targetId),
            ),
            itemCount: Math.max(0, prev.itemCount - 1),
          }
        : prev,
    );
    try {
      await removeCollectionItem(detail.id, item.type, item.targetId);
    } catch {
      void load();
    }
  };

  const onShare = async () => {
    if (!detail) return;
    const url = `hanchi://collections/${detail.shareSlug}`;
    try {
      await Share.share({
        message: `Check out my Hanchi collection "${detail.name}": ${url}`,
      });
    } catch {
      Alert.alert("Share link", url);
    }
  };

  const onToggleFollow = async () => {
    if (!detail || detail.isOwner) return;
    setBusyFollow(true);
    const next = !detail.following;
    setDetail({ ...detail, following: next });
    try {
      if (next) await followCollection(detail.id);
      else await unfollowCollection(detail.id);
    } catch {
      setDetail({ ...detail, following: !next });
    } finally {
      setBusyFollow(false);
    }
  };

  const renderItem = ({ item }: { item: ApiCollectionItem }) => {
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

    return (
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
        subtitle={item.subtitle}
        onPress={() => onOpenItem(item)}
        rightElement={
          detail?.isOwner ? (
            <Pressable
              onPress={() => {
                Alert.alert("Remove from collection?", item.title, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => void onRemove(item),
                  },
                ]);
              }}
              hitSlop={8}
            >
              <Text style={styles.removeLink}>Remove</Text>
            </Pressable>
          ) : undefined
        }
        showChevron={!detail?.isOwner}
      />
    );
  };

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
          {detail?.name ?? "Collection"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : error || !detail ? (
        <Text style={styles.muted}>{error ?? "Not found"}</Text>
      ) : (
        <FlatList
          data={detail.items}
          keyExtractor={(item) => `${item.type}:${item.targetId}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.title}>{detail.name}</Text>
              {detail.description ? (
                <Text style={styles.desc}>{detail.description}</Text>
              ) : null}
              <Text style={styles.meta}>
                By {detail.owner.displayName} ·{" "}
                {detail.visibility === "public" ? "Public" : "Private"} ·{" "}
                {detail.itemCount} places
                {detail.followerCount != null
                  ? ` · ${detail.followerCount} followers`
                  : ""}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => void onShare()}
                >
                  <Text style={styles.actionBtnText}>Share link</Text>
                </Pressable>
                {!detail.isOwner && detail.visibility === "public" ? (
                  <Pressable
                    style={[
                      styles.actionBtn,
                      detail.following && styles.actionBtnSecondary,
                    ]}
                    disabled={busyFollow}
                    onPress={() => void onToggleFollow()}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        detail.following && styles.actionBtnTextSecondary,
                      ]}
                    >
                      {detail.following ? "Following" : "Follow collection"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.muted}>No places in this collection yet.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  muted: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    padding: 20,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  headerBlock: { paddingBottom: 16, gap: 8 },
  title: {
    fontFamily: typography.display,
    fontSize: 26,
    color: colors.ink,
  },
  desc: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
  meta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  actionBtn: {
    backgroundColor: colors.forest,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
  },
  actionBtnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.white,
  },
  actionBtnTextSecondary: { color: colors.ink },
  removeLink: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.heart,
  },
});
