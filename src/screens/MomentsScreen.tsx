import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createJournalEntry,
  deleteJournalEntry,
  fetchUserJournal,
  updateJournalEntry,
  type ApiJournalEntry,
} from "../api/journal";
import { searchAll } from "../api/search";
import {
  createStamp,
  fetchUserStamps,
  type ApiStamp,
} from "../api/stamps";
import { useCommunities } from "../api/useCommunities";
import {
  CircularFlag,
  MomentPhotos,
  PrimaryButton,
  SearchBar,
  SkeletonListRows,
} from "../components";
import { useAuth } from "../auth/AuthContext";
import { getCommunityCountryCode } from "../data/communityFlags";
import { filterCommunities, scoreCommunityQuery } from "../data/cultureFilters";
import {
  primaryEthnicityCountryCode,
  primaryEthnicityEmoji,
} from "../data/ethnicityFlags";
import { mockPeerMoments } from "../data/mockMoments";
import { cultureCountryCode, cultureFlag } from "../data/userPrefs";
import { countryFlagEmoji } from "../data/worldCountries";
import {
  IconEllipsisV,
  IconHeart,
  IconHeartFilled,
  IconImage,
  IconMapPin,
  IconPlus,
  IconX,
} from "../icons";
import { listDishTries, type StoredDishTry } from "../lib/dishTries";
import {
  baseLikeCount,
  getMomentLikesMap,
  toggleMomentLike,
} from "../lib/momentLikes";
import {
  MAX_MOMENT_PHOTOS,
  pickPhotos,
  uploadLocalPhoto,
  type LocalPhoto,
} from "../lib/uploadPhoto";
import type { RootStackParamList } from "../navigation/types";
import type { MomentItem } from "../types";
import { colors, radii, typography } from "../theme";

const AVATAR = 36;
const AVATAR_FLAG = 17;

/** Strip em/en dashes from moment copy (display + compose). */
function cleanMomentNote(note: string): string {
  return note
    .replace(/\u2014/g, ". ") // em dash
    .replace(/\u2013/g, ". ") // en dash
    .replace(/\s*\.\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function entryToMoment(
  entry: ApiJournalEntry,
  authorName: string,
  communityName: string | null | undefined,
  placeCountryCode: string | null | undefined,
  authorCountryCode: string | null | undefined,
  authorFlag: string | null | undefined,
): MomentItem {
  const restaurantName = entry.poiName ?? entry.poi?.name ?? null;
  return {
    id: entry.id,
    kind: "own",
    activity: "post",
    authorName,
    note: cleanMomentNote(entry.note),
    createdAt: entry.createdAt,
    communityId: entry.communityId,
    communityName: communityName ?? entry.communityName ?? null,
    placeCountryCode: placeCountryCode ?? null,
    photoUrl: entry.photoUrl,
    photoUrls: entry.photoUrls?.length
      ? entry.photoUrls
      : entry.photoUrl
        ? [entry.photoUrl]
        : [],
    authorCountryCode: authorCountryCode ?? null,
    authorFlag: authorFlag ?? null,
    restaurantId: entry.poiId,
    restaurantName,
  };
}

type PlacePick = {
  key: string;
  kind: "community" | "restaurant";
  id: string;
  name: string;
  subtitle: string;
  communityId: string | null;
  countryCode: string | null;
  ethnicities?: string[];
};

function stampToMoment(
  stamp: ApiStamp,
  authorName: string,
  communityName: string,
  placeCountryCode: string | null,
  authorCountryCode: string | null | undefined,
  authorFlag: string | null | undefined,
): MomentItem {
  return {
    id: `stamp-${stamp.id}`,
    kind: "own",
    activity: "stamp",
    authorName,
    note: "",
    createdAt: stamp.earnedAt,
    communityId: stamp.communityId,
    communityName,
    placeCountryCode,
    authorCountryCode: authorCountryCode ?? null,
    authorFlag: authorFlag ?? null,
  };
}

function dishTryToMoment(
  tryItem: StoredDishTry,
  authorName: string,
  authorCountryCode: string | null | undefined,
  authorFlag: string | null | undefined,
): MomentItem {
  return {
    id: tryItem.id,
    kind: "own",
    activity: "dish_try",
    authorName,
    note: cleanMomentNote(tryItem.note ?? ""),
    createdAt: tryItem.createdAt,
    communityId: tryItem.communityId ?? null,
    communityName: tryItem.communityName ?? null,
    placeCountryCode: tryItem.placeCountryCode ?? null,
    authorCountryCode: authorCountryCode ?? null,
    authorFlag: authorFlag ?? null,
    dishId: tryItem.dishId,
    dishName: tryItem.dishName,
    restaurantId: tryItem.restaurantId ?? null,
    restaurantName: tryItem.restaurantName ?? null,
  };
}

export function MomentsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAuth();
  const { communities } = useCommunities();
  const [entries, setEntries] = useState<ApiJournalEntry[]>([]);
  const [stamps, setStamps] = useState<ApiStamp[]>([]);
  const [dishTries, setDishTries] = useState<StoredDishTry[]>([]);
  const [likes, setLikes] = useState<
    Record<string, { liked: boolean; count: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [draftCommunityId, setDraftCommunityId] = useState<string | null>(null);
  const [draftPoiId, setDraftPoiId] = useState<string | null>(null);
  const [draftPoiName, setDraftPoiName] = useState<string | null>(null);
  const [draftPlaceCountryCode, setDraftPlaceCountryCode] = useState<
    string | null
  >(null);
  const [draftPlaceQuery, setDraftPlaceQuery] = useState("");
  const [placePickerOpen, setPlacePickerOpen] = useState(false);
  const [placeSearchResults, setPlaceSearchResults] = useState<PlacePick[]>([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [draftPhotos, setDraftPhotos] = useState<LocalPhoto[]>([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const communityById = useMemo(() => {
    return new Map(communities.map((c) => [c.id, c]));
  }, [communities]);

  const authorName = profile?.displayName?.trim() || "You";
  const ownCulture = profile?.cultures?.[0];
  const ownCountryCode = ownCulture
    ? (cultureCountryCode(ownCulture) ?? null)
    : null;
  const ownFlag = ownCulture ? cultureFlag(ownCulture) : null;

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [journalData, stampData, tryData] = await Promise.all([
        fetchUserJournal().catch(() => [] as ApiJournalEntry[]),
        fetchUserStamps().catch(() => [] as ApiStamp[]),
        listDishTries().catch(() => [] as StoredDishTry[]),
      ]);
      setEntries(journalData);
      setStamps(stampData);
      setDishTries(tryData);
    } catch (e) {
      setEntries([]);
      setStamps([]);
      setDishTries([]);
      setError(e instanceof Error ? e.message : "Couldn’t load moments");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFeed();
    }, [loadFeed]),
  );

  const feed = useMemo(() => {
    const ownPosts: MomentItem[] = entries.map((e) => {
      const community = e.communityId
        ? communityById.get(e.communityId)
        : undefined;
      const restaurantName = e.poiName ?? e.poi?.name ?? null;
      // Prefer restaurant ethnicity for a place flag when tagging a restaurant.
      const placeCode = restaurantName
        ? (primaryEthnicityCountryCode(e.poi?.ethnicities) ??
          (e.communityId
            ? (getCommunityCountryCode(e.communityId) ?? null)
            : null))
        : e.communityId
          ? (getCommunityCountryCode(e.communityId) ?? null)
          : null;
      return entryToMoment(
        e,
        authorName,
        community?.name ?? e.communityName ?? null,
        placeCode,
        ownCountryCode,
        ownFlag,
      );
    });

    const ownStamps: MomentItem[] = stamps.map((s) => {
      const community = communityById.get(s.communityId);
      const name = s.community?.name ?? community?.name ?? "a place";
      const placeCode = getCommunityCountryCode(s.communityId) ?? null;
      return stampToMoment(
        s,
        authorName,
        name,
        placeCode,
        ownCountryCode,
        ownFlag,
      );
    });

    const ownDishTries: MomentItem[] = dishTries.map((t) =>
      dishTryToMoment(t, authorName, ownCountryCode, ownFlag),
    );

    return [
      ...ownPosts,
      ...ownStamps,
      ...ownDishTries,
      ...mockPeerMoments,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [
    entries,
    stamps,
    dishTries,
    authorName,
    communityById,
    ownCountryCode,
    ownFlag,
  ]);

  // Load / refresh like state for the full visible feed.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const ids = feed.map((m) => m.id);
      if (ids.length === 0) {
        setLikes({});
        return;
      }
      void getMomentLikesMap(ids).then((map) => {
        if (!cancelled) setLikes(map);
      });
      return () => {
        cancelled = true;
      };
    }, [feed]),
  );

  const onToggleLike = useCallback(async (momentId: string) => {
    setLikes((prev) => {
      const cur = prev[momentId] ?? {
        liked: false,
        count: baseLikeCount(momentId),
      };
      const nextLiked = !cur.liked;
      return {
        ...prev,
        [momentId]: {
          liked: nextLiked,
          count: Math.max(0, cur.count + (nextLiked ? 1 : -1)),
        },
      };
    });
    try {
      const result = await toggleMomentLike(momentId);
      setLikes((prev) => ({ ...prev, [momentId]: result }));
    } catch {
      const map = await getMomentLikesMap([momentId]);
      setLikes((prev) => ({ ...prev, ...map }));
    }
  }, []);

  const onDeleteOwnPost = useCallback((item: MomentItem) => {
    if (item.kind !== "own" || item.activity !== "post") return;
    setMenuOpenId(null);
    Alert.alert("Delete moment?", "This can’t be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteJournalEntry(item.id);
              setEntries((prev) => prev.filter((e) => e.id !== item.id));
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Couldn’t delete moment",
              );
            }
          })();
        },
      },
    ]);
  }, []);

  const openEditPost = useCallback((item: MomentItem) => {
    if (item.kind !== "own" || item.activity !== "post") return;
    setMenuOpenId(null);
    setEditingId(item.id);
    setDraftNote(item.note ?? "");
    setDraftCommunityId(item.communityId ?? null);
    setDraftPoiId(item.restaurantId ?? null);
    setDraftPoiName(item.restaurantName ?? null);
    setDraftPlaceCountryCode(item.placeCountryCode ?? null);
    setDraftPlaceQuery("");
    setPlacePickerOpen(false);
    setDraftPhotos([]);
    setExistingPhotoUrls(
      item.photoUrls?.length
        ? item.photoUrls
        : item.photoUrl
          ? [item.photoUrl]
          : [],
    );
    setError(null);
    setComposeOpen(true);
  }, []);

  const draftPlaceName = draftPoiName
    ? draftPoiName
    : draftCommunityId
      ? (communityById.get(draftCommunityId)?.name ?? null)
      : null;
  const draftPlaceCode = draftPlaceCountryCode;

  // Browse communities when empty; search restaurants + communities when typing.
  useEffect(() => {
    if (!placePickerOpen) return;
    let cancelled = false;
    const q = draftPlaceQuery.trim();
    const handle = setTimeout(
      async () => {
        setPlaceSearchLoading(true);
        try {
          if (!q) {
            const local: PlacePick[] = communities.slice(0, 12).map((c) => ({
              key: `c-${c.id}`,
              kind: "community" as const,
              id: c.id,
              name: c.name,
              subtitle: [c.neighborhood, c.heritage]
                .filter(Boolean)
                .join(" · "),
              communityId: c.id,
              countryCode: getCommunityCountryCode(c.id) ?? null,
            }));
            if (!cancelled) setPlaceSearchResults(local);
            return;
          }

          // Local community filter (instant) + API restaurants (live).
          const communityHits = filterCommunities(communities, {
            culture: "all",
            query: q,
          })
            .map((c) => ({ c, score: scoreCommunityQuery(c, q) }))
            .sort(
              (a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name),
            )
            .slice(0, 10)
            .map(
              ({ c }): PlacePick => ({
                key: `c-${c.id}`,
                kind: "community",
                id: c.id,
                name: c.name,
                subtitle: [c.neighborhood, c.heritage]
                  .filter(Boolean)
                  .join(" · "),
                communityId: c.id,
                countryCode: getCommunityCountryCode(c.id) ?? null,
              }),
            );

          let restaurantHits: PlacePick[] = [];
          try {
            const data = await searchAll(q);
            restaurantHits = data.pois.slice(0, 15).map((p) => {
              const communityName = p.communityId
                ? (communityById.get(p.communityId)?.name ?? null)
                : null;
              const sub = [p.category, communityName]
                .filter(Boolean)
                .join(" · ");
              return {
                key: `r-${p.id}`,
                kind: "restaurant" as const,
                id: p.id,
                name: p.name,
                subtitle: sub || "Restaurant",
                communityId: p.communityId,
                countryCode:
                  primaryEthnicityCountryCode(p.ethnicities) ??
                  (p.communityId
                    ? (getCommunityCountryCode(p.communityId) ?? null)
                    : null),
                ethnicities: p.ethnicities,
              };
            });
          } catch {
            // Communities still useful offline / on API error.
          }

          if (!cancelled) {
            setPlaceSearchResults([...restaurantHits, ...communityHits]);
          }
        } finally {
          if (!cancelled) setPlaceSearchLoading(false);
        }
      },
      q ? 250 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [placePickerOpen, draftPlaceQuery, communities, communityById]);

  const selectPlace = (place: PlacePick) => {
    if (place.kind === "restaurant") {
      setDraftPoiId(place.id);
      setDraftPoiName(place.name);
      setDraftCommunityId(place.communityId);
      setDraftPlaceCountryCode(place.countryCode);
    } else {
      setDraftPoiId(null);
      setDraftPoiName(null);
      setDraftCommunityId(place.id);
      setDraftPlaceCountryCode(place.countryCode);
    }
    setDraftPlaceQuery("");
    setPlacePickerOpen(false);
  };

  const clearDraftPlace = () => {
    setDraftCommunityId(null);
    setDraftPoiId(null);
    setDraftPoiName(null);
    setDraftPlaceCountryCode(null);
    setPlacePickerOpen(false);
  };

  const resetCompose = () => {
    setEditingId(null);
    setDraftNote("");
    setDraftCommunityId(null);
    setDraftPoiId(null);
    setDraftPoiName(null);
    setDraftPlaceCountryCode(null);
    setDraftPlaceQuery("");
    setPlacePickerOpen(false);
    setPlaceSearchResults([]);
    setDraftPhotos([]);
    setExistingPhotoUrls([]);
    setError(null);
  };

  const publish = async () => {
    const note = cleanMomentNote(draftNote);
    if (!note) {
      setError("Write a short note about where you’ve been.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let stampedCommunityId: string | null = draftCommunityId;

      if (editingId) {
        const updated = await updateJournalEntry(editingId, {
          note,
          communityId: draftCommunityId,
          poiId: draftPoiId,
        });
        stampedCommunityId =
          updated.communityId ?? draftCommunityId ?? null;
        setEntries((prev) =>
          prev.map((e) => (e.id === editingId ? updated : e)),
        );
      } else {
        const mediaIds: string[] = [];
        for (const photo of draftPhotos) {
          const uploaded = await uploadLocalPhoto("moment", photo.uri);
          if (!uploaded.mediaId || uploaded.status !== "approved") {
            throw new Error("A photo didn’t pass review. Try another.");
          }
          mediaIds.push(uploaded.mediaId);
        }
        const created = await createJournalEntry({
          note,
          communityId: draftCommunityId,
          poiId: draftPoiId,
          mediaIds,
        });
        stampedCommunityId =
          created.communityId ?? draftCommunityId ?? null;
        setEntries((prev) => [created, ...prev]);
      }

      // Tagging a community (or its restaurant) counts as being there → stamp passport.
      if (stampedCommunityId) {
        try {
          const stamp = await createStamp(stampedCommunityId);
          setStamps((prev) => {
            if (prev.some((s) => s.communityId === stampedCommunityId)) {
              return prev;
            }
            return [stamp, ...prev];
          });
        } catch {
          // Moment stays posted even if stamp fails.
        }
      }

      resetCompose();
      setComposeOpen(false);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : editingId
            ? "Couldn’t save moment"
            : "Couldn’t post moment",
      );
    } finally {
      setSaving(false);
    }
  };

  const onAttachPhoto = async () => {
    setError(null);
    const remaining = MAX_MOMENT_PHOTOS - draftPhotos.length;
    if (remaining <= 0) {
      setError(`You can add up to ${MAX_MOMENT_PHOTOS} photos`);
      return;
    }
    try {
      const photos = await pickPhotos(remaining);
      if (photos.length) {
        setDraftPhotos((prev) =>
          [...prev, ...photos].slice(0, MAX_MOMENT_PHOTOS),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t open photos");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setMenuOpenId(null)}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Moments</Text>
            <Text style={styles.subtitle}>
              Posts, check-ins, stamps, and dishes from your wanderings.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              resetCompose();
              setComposeOpen(true);
            }}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Add a moment"
          >
            <IconPlus size={22} color={colors.white} />
          </Pressable>
        </View>

        {loading ? (
          <SkeletonListRows count={5} />
        ) : feed.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No moments yet</Text>
            <Text style={styles.empty}>
              Share a short note about a place you visited. When friends join
              Hanchi, their check-ins will land here too.
            </Text>
            <PrimaryButton
              label="Write a moment"
              onPress={() => {
                resetCompose();
                setComposeOpen(true);
              }}
            />
          </View>
        ) : (
          <>
            {feed.map((item) => {
              const displayName = item.kind === "own" ? "You" : item.authorName;
              const initial = (
                item.kind === "own" ? displayName : item.authorName
              )
                .charAt(0)
                .toUpperCase();
              const isStamp = item.activity === "stamp";
              const isDishTry = item.activity === "dish_try";
              const placeLabel =
                item.restaurantName ?? item.communityName ?? null;
              const checkedIn = !isStamp && !isDishTry && Boolean(placeLabel);
              const placeFlag = item.placeCountryCode
                ? `${countryFlagEmoji(item.placeCountryCode)} `
                : "";
              const venueLabel = isDishTry
                ? (item.restaurantName ?? item.communityName ?? null)
                : null;

              const onPressCard = () => {
                if (isDishTry && item.restaurantId) {
                  navigation.navigate("RestaurantDetail", {
                    restaurantId: item.restaurantId,
                  });
                  return;
                }
                if (!isStamp && !isDishTry && item.restaurantId) {
                  navigation.navigate("RestaurantDetail", {
                    restaurantId: item.restaurantId,
                  });
                  return;
                }
                if (item.communityId) {
                  navigation.navigate("CommunityProfile", {
                    communityId: item.communityId,
                  });
                }
              };
              const disabled = isDishTry
                ? !item.restaurantId && !item.communityId
                : !item.restaurantId && !item.communityId;

              const likeState = likes[item.id] ?? {
                liked: false,
                count: baseLikeCount(item.id),
              };

              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    menuOpenId === item.id ? styles.cardMenuOpen : null,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <Pressable
                      onPress={() => {
                        setMenuOpenId(null);
                        onPressCard();
                      }}
                      disabled={disabled}
                      style={styles.cardTopMain}
                    >
                      <View style={styles.avatarWrap}>
                        <View
                          style={[
                            styles.avatar,
                            item.kind === "own" && styles.avatarOwn,
                          ]}
                        >
                          <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        {item.authorCountryCode || item.authorFlag ? (
                          <View style={styles.flagBadge}>
                            <CircularFlag
                              countryCode={item.authorCountryCode}
                              flag={item.authorFlag ?? undefined}
                              size={AVATAR_FLAG}
                            />
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.cardMeta}>
                        {isStamp ? (
                          <Text style={styles.headline}>
                            <Text style={styles.author}>{displayName}</Text>
                            <Text style={styles.verb}> stamped </Text>
                            {placeFlag}
                            <Text style={styles.placeName}>
                              {item.communityName ?? "a place"}
                            </Text>
                          </Text>
                        ) : isDishTry ? (
                          <Text style={styles.headline}>
                            <Text style={styles.author}>{displayName}</Text>
                            <Text style={styles.verb}> tried </Text>
                            <Text style={styles.placeName}>
                              {item.dishName ?? "a dish"}
                            </Text>
                            {venueLabel ? (
                              <>
                                <Text style={styles.verb}> at </Text>
                                {placeFlag}
                                <Text style={styles.placeName}>
                                  {venueLabel}
                                </Text>
                              </>
                            ) : null}
                          </Text>
                        ) : checkedIn ? (
                          <Text style={styles.headline}>
                            <Text style={styles.author}>{displayName}</Text>
                            <Text style={styles.verb}> at </Text>
                            {placeFlag}
                            <Text style={styles.placeName}>{placeLabel}</Text>
                          </Text>
                        ) : (
                          <Text style={styles.author}>{displayName}</Text>
                        )}
                        <Text style={styles.time}>
                          {formatRelativeTime(item.createdAt)}
                        </Text>
                      </View>
                    </Pressable>
                    {item.kind === "own" && item.activity === "post" ? (
                      <View style={styles.cardMenuWrap}>
                        <Pressable
                          onPress={() =>
                            setMenuOpenId((id) =>
                              id === item.id ? null : item.id,
                            )
                          }
                          hitSlop={10}
                          style={styles.cardMenuBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Moment options"
                          accessibilityState={{
                            expanded: menuOpenId === item.id,
                          }}
                        >
                          <IconEllipsisV size={20} color={colors.gray} />
                        </Pressable>
                        {menuOpenId === item.id ? (
                          <View style={styles.cardDropdown}>
                            <Pressable
                              style={styles.cardDropdownItem}
                              onPress={() => openEditPost(item)}
                              accessibilityRole="button"
                              accessibilityLabel="Edit moment"
                            >
                              <Text style={styles.cardDropdownText}>Edit</Text>
                            </Pressable>
                            <View style={styles.cardDropdownDivider} />
                            <Pressable
                              style={styles.cardDropdownItem}
                              onPress={() => onDeleteOwnPost(item)}
                              accessibilityRole="button"
                              accessibilityLabel="Delete moment"
                            >
                              <Text
                                style={[
                                  styles.cardDropdownText,
                                  styles.cardDropdownDanger,
                                ]}
                              >
                                Delete
                              </Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => {
                      setMenuOpenId(null);
                      onPressCard();
                    }}
                    disabled={disabled}
                    style={styles.cardPress}
                  >
                    {item.note ? (
                      <Text style={styles.note}>
                        {cleanMomentNote(item.note)}
                      </Text>
                    ) : null}
                    {(() => {
                      const urls = item.photoUrls?.length
                        ? item.photoUrls
                        : item.photoUrl
                          ? [item.photoUrl]
                          : [];
                      return urls.length ? (
                        <MomentPhotos urls={urls} indent={AVATAR + 9} />
                      ) : null;
                    })()}
                  </Pressable>
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => void onToggleLike(item.id)}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.likeBtn,
                        pressed && styles.likeBtnPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={
                        likeState.liked ? "Unlike moment" : "Like moment"
                      }
                      accessibilityState={{ selected: likeState.liked }}
                    >
                      {likeState.liked ? (
                        <IconHeartFilled size={18} color={colors.heart} />
                      ) : (
                        <IconHeart size={18} color={colors.gray} />
                      )}
                      <Text
                        style={[
                          styles.likeCount,
                          likeState.liked && styles.likeCountActive,
                        ]}
                      >
                        {likeState.count}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <Modal
        visible={composeOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setComposeOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => {
                setComposeOpen(false);
                resetCompose();
              }}
              hitSlop={8}
              accessibilityLabel="Close"
            >
              <IconX size={22} color={colors.ink} />
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit moment" : "New moment"}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.input}
              placeholder="What stayed with you?"
              placeholderTextColor={colors.grayLight}
              value={draftNote}
              onChangeText={setDraftNote}
              multiline
              textAlignVertical="top"
              autoFocus
            />

            {editingId && existingPhotoUrls.length === 1 ? (
              <View style={styles.draftSinglePhotoWrap}>
                <Image
                  source={{ uri: existingPhotoUrls[0] }}
                  style={styles.draftSinglePhoto}
                  resizeMode="cover"
                />
              </View>
            ) : editingId && existingPhotoUrls.length > 1 ? (
              <View style={styles.draftGrid}>
                {existingPhotoUrls.map((uri, i) => (
                  <View key={`${uri}-${i}`} style={styles.draftGridCell}>
                    <Image
                      source={{ uri }}
                      style={styles.draftGridImage}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
            ) : null}

            {!editingId && draftPhotos.length === 1 ? (
              <View style={styles.draftSinglePhotoWrap}>
                <Image
                  source={{ uri: draftPhotos[0].uri }}
                  style={[
                    styles.draftSinglePhoto,
                    {
                      aspectRatio:
                        draftPhotos[0].width && draftPhotos[0].height
                          ? draftPhotos[0].width / draftPhotos[0].height
                          : 4 / 3,
                    },
                  ]}
                  resizeMode="cover"
                />
                <Pressable
                  style={styles.photoRemoveBtn}
                  onPress={() => setDraftPhotos([])}
                  hitSlop={8}
                  accessibilityLabel="Remove photo"
                >
                  <IconX size={16} color={colors.white} />
                </Pressable>
              </View>
            ) : !editingId && draftPhotos.length > 1 ? (
              <View style={styles.draftGrid}>
                {draftPhotos.map((p, i) => (
                  <View key={`${p.uri}-${i}`} style={styles.draftGridCell}>
                    <Image
                      source={{ uri: p.uri }}
                      style={styles.draftGridImage}
                      resizeMode="cover"
                    />
                    <Pressable
                      style={styles.draftGridRemove}
                      onPress={() =>
                        setDraftPhotos((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      hitSlop={6}
                      accessibilityLabel="Remove photo"
                    >
                      <IconX size={12} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {draftPlaceName && !placePickerOpen ? (
              <View style={styles.selectedPlaceChip}>
                <IconMapPin size={16} color={colors.forest} />
                {draftPlaceCode ? (
                  <CircularFlag countryCode={draftPlaceCode} size={16} bare />
                ) : null}
                <Text style={styles.selectedPlaceText} numberOfLines={1}>
                  {draftPlaceName}
                </Text>
                <Pressable
                  onPress={clearDraftPlace}
                  hitSlop={8}
                  accessibilityLabel="Remove location"
                >
                  <IconX size={16} color={colors.gray} />
                </Pressable>
              </View>
            ) : null}

            {placePickerOpen ? (
              <View style={styles.placePicker}>
                <SearchBar
                  placeholder="Search restaurants or communities"
                  value={draftPlaceQuery}
                  onChangeText={setDraftPlaceQuery}
                  autoFocus
                />
                <View style={styles.placeResults}>
                  {placeSearchLoading ? (
                    <Text style={styles.placeEmpty}>Searching…</Text>
                  ) : null}
                  {!placeSearchLoading &&
                    placeSearchResults.map((place) => {
                      const countryCode =
                        place.countryCode ??
                        (place.kind === "restaurant"
                          ? primaryEthnicityCountryCode(place.ethnicities)
                          : null);
                      const flagEmoji =
                        place.kind === "restaurant"
                          ? primaryEthnicityEmoji(place.ethnicities)
                          : undefined;
                      const kindLabel =
                        place.kind === "restaurant"
                          ? "Restaurant"
                          : "Community";
                      return (
                        <Pressable
                          key={place.key}
                          style={styles.placeRow}
                          onPress={() => selectPlace(place)}
                        >
                          {countryCode || flagEmoji ? (
                            <View style={styles.placeRowFlag}>
                              <CircularFlag
                                countryCode={countryCode}
                                flag={flagEmoji}
                                size={22}
                                bare
                              />
                            </View>
                          ) : (
                            <View style={styles.placeRowIcon}>
                              <IconMapPin size={18} color={colors.forest} />
                            </View>
                          )}
                          <View style={styles.placeRowText}>
                            <Text
                              style={styles.placeRowTitle}
                              numberOfLines={1}
                            >
                              {place.name}
                            </Text>
                            <Text style={styles.placeRowSub} numberOfLines={1}>
                              {place.subtitle
                                ? `${place.subtitle} · ${kindLabel}`
                                : kindLabel}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  {!placeSearchLoading &&
                  draftPlaceQuery.trim() &&
                  placeSearchResults.length === 0 ? (
                    <Text style={styles.placeEmpty}>
                      No restaurants or communities match “
                      {draftPlaceQuery.trim()}”
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.attachRow}>
              {!editingId ? (
                <Pressable
                  style={[
                    styles.attachIconBtn,
                    draftPhotos.length > 0 ? styles.attachIconBtnOn : null,
                  ]}
                  onPress={() => void onAttachPhoto()}
                  accessibilityRole="button"
                  accessibilityLabel="Add photo"
                >
                  <IconImage
                    size={20}
                    color={draftPhotos.length > 0 ? colors.forest : colors.gray}
                  />
                  <Text
                    style={[
                      styles.attachIconLabel,
                      draftPhotos.length > 0 ? styles.attachIconLabelOn : null,
                    ]}
                  >
                    {draftPhotos.length > 0
                      ? `Add photo (${draftPhotos.length}/${MAX_MOMENT_PHOTOS})`
                      : "Add photo"}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[
                  styles.attachIconBtn,
                  draftPlaceName || placePickerOpen
                    ? styles.attachIconBtnOn
                    : null,
                ]}
                onPress={() => {
                  setPlacePickerOpen((open) => !open);
                  setDraftPlaceQuery("");
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  draftPlaceName ? "Edit location" : "Add location"
                }
              >
                <IconMapPin
                  size={20}
                  color={
                    draftPlaceName || placePickerOpen
                      ? colors.forest
                      : colors.gray
                  }
                />
                <Text
                  style={[
                    styles.attachIconLabel,
                    draftPlaceName || placePickerOpen
                      ? styles.attachIconLabelOn
                      : null,
                  ]}
                >
                  {draftPlaceName ? "Edit location" : "Add location"}
                </Text>
              </Pressable>
            </View>
            <PrimaryButton
              label={editingId ? "Save changes" : "Post moment"}
              onPress={publish}
              loading={saving}
              disabled={!draftNote.trim()}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 26,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
    lineHeight: 18,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 10,
    gap: 8,
    overflow: "visible",
    zIndex: 1,
  },
  cardMenuOpen: {
    zIndex: 20,
    elevation: 8,
  },
  cardPress: {
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    zIndex: 2,
  },
  cardTopMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minWidth: 0,
  },
  cardMenuWrap: {
    position: "relative",
    zIndex: 30,
  },
  cardMenuBtn: {
    paddingTop: 2,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  cardDropdown: {
    position: "absolute",
    top: 28,
    right: 0,
    minWidth: 148,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    overflow: "hidden",
  },
  cardDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cardDropdownText: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
  cardDropdownDanger: {
    color: colors.heart,
  },
  cardDropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.grayLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOwn: {
    backgroundColor: colors.forest,
  },
  flagBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.background,
    backgroundColor: colors.background,
  },
  avatarText: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.white,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  /** Shared size for all head lines (at / stamped / tried) */
  headline: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 19,
  },
  author: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.ink,
  },
  verb: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
  },
  placeName: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.forest,
  },
  time: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
  },
  note: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
    // Align under headline when avatar is present
    marginLeft: AVATAR + 9,
  },
  momentPhoto: {
    marginLeft: AVATAR + 9,
    marginTop: 6,
    width: "100%",
    maxWidth: 320,
    height: 180,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  draftSinglePhotoWrap: {
    marginBottom: 12,
    position: "relative",
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderRadius: radii.md,
    overflow: "hidden",
  },
  draftSinglePhoto: {
    width: "100%",
    maxWidth: 320,
    maxHeight: 280,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  draftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  draftGridCell: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: radii.sm,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.surface,
  },
  draftGridImage: {
    width: "100%",
    height: "100%",
  },
  draftGridRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPreviewWrap: {
    marginBottom: 12,
    position: "relative",
  },
  photoPreview: {
    width: "100%",
    height: 180,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  photoRemoveBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedPlaceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedPlaceText: {
    flexShrink: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: AVATAR + 9,
    marginTop: 0,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 2,
    paddingRight: 8,
  },
  likeBtnPressed: {
    opacity: 0.7,
  },
  likeCount: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    minWidth: 12,
  },
  likeCountActive: {
    color: colors.heart,
    fontFamily: typography.bodySemibold,
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: 36,
    gap: 12,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontFamily: typography.display,
    fontSize: 19,
    color: colors.ink,
    textAlign: "center",
  },
  empty: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  input: {
    minHeight: 140,
    borderWidth: 0,
    backgroundColor: "transparent",
    padding: 0,
    fontFamily: typography.body,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 12,
  },
  placePicker: {
    gap: 10,
    marginBottom: 8,
  },
  placeResults: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
    maxHeight: 280,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  placeRowFlag: {
    width: 28,
    alignItems: "center",
  },
  placeRowIcon: {
    width: 28,
    alignItems: "center",
  },
  placeRowFlagSpacer: {
    width: 28,
  },
  placeRowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  placeRowTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.ink,
  },
  placeRowSub: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
  },
  placeEmpty: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    padding: 14,
  },
  error: {
    fontFamily: typography.body,
    fontSize: 13,
    color: "#B42318",
    marginTop: 12,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 12,
  },
  attachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  attachIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  attachIconBtnOn: {
    borderColor: colors.forest,
    backgroundColor: colors.white,
  },
  attachIconLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.gray,
  },
  attachIconLabelOn: {
    color: colors.forest,
  },
});
