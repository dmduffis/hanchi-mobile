import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createJournalEntry,
  fetchUserJournal,
  type ApiJournalEntry,
} from "../api/journal";
import { fetchUserStamps, type ApiStamp } from "../api/stamps";
import { useCommunities } from "../api/useCommunities";
import { CircularFlag, PrimaryButton, SkeletonListRows } from "../components";
import { PostageStampIcon } from "../components/stamp/PostageStampIcon";
import { useAuth } from "../auth/AuthContext";
import { getCommunityCountryCode } from "../data/communityFlags";
import { mockPeerMoments } from "../data/mockMoments";
import { cultureCountryCode, cultureFlag } from "../data/userPrefs";
import { countryFlagEmoji } from "../data/worldCountries";
import { IconPlus, IconX } from "../icons";
import type { RootStackParamList } from "../navigation/types";
import type { MomentItem } from "../types";
import { colors, radii, typography } from "../theme";

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
  return {
    id: entry.id,
    kind: "own",
    activity: "post",
    authorName,
    note: cleanMomentNote(entry.note),
    createdAt: entry.createdAt,
    communityId: entry.communityId,
    communityName: communityName ?? null,
    placeCountryCode: placeCountryCode ?? null,
    photoUrl: entry.photoUrl,
    authorCountryCode: authorCountryCode ?? null,
    authorFlag: authorFlag ?? null,
  };
}

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

export function MomentsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAuth();
  const { communities } = useCommunities();
  const [entries, setEntries] = useState<ApiJournalEntry[]>([]);
  const [stamps, setStamps] = useState<ApiStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const [draftCommunityId, setDraftCommunityId] = useState<string | null>(null);
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
      const [journalData, stampData] = await Promise.all([
        fetchUserJournal().catch(() => [] as ApiJournalEntry[]),
        fetchUserStamps().catch(() => [] as ApiStamp[]),
      ]);
      setEntries(journalData);
      setStamps(stampData);
    } catch (e) {
      setEntries([]);
      setStamps([]);
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
      const placeCode = e.communityId
        ? (getCommunityCountryCode(e.communityId) ?? null)
        : null;
      return entryToMoment(
        e,
        authorName,
        community?.name ?? null,
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

    return [...ownPosts, ...ownStamps, ...mockPeerMoments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [entries, stamps, authorName, communityById, ownCountryCode, ownFlag]);

  const draftPlaceName = draftCommunityId
    ? (communityById.get(draftCommunityId)?.name ?? null)
    : null;
  const draftPlaceCode = draftCommunityId
    ? (getCommunityCountryCode(draftCommunityId) ?? null)
    : null;

  const publish = async () => {
    const note = cleanMomentNote(draftNote);
    if (!note) {
      setError("Write a short note about where you’ve been.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createJournalEntry({
        note,
        communityId: draftCommunityId,
      });
      setEntries((prev) => [created, ...prev]);
      setDraftNote("");
      setDraftCommunityId(null);
      setComposeOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t post moment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Moments</Text>
            <Text style={styles.subtitle}>
              Posts, check-ins, and stamps from your wanderings.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setError(null);
              setComposeOpen(true);
            }}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Add a moment"
          >
            <IconPlus size={21} color={colors.white} />
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
              onPress={() => setComposeOpen(true)}
            />
          </View>
        ) : (
          <>
            {feed.map((item) => {
              const displayName = item.kind === "own" ? "You" : item.authorName;
              const initial = item.authorName.charAt(0).toUpperCase();
              const isStamp = item.activity === "stamp";
              const checkedIn = !isStamp && Boolean(item.communityName);

              if (isStamp) {
                return (
                  <Pressable
                    key={item.id}
                    style={styles.stampCard}
                    onPress={() => {
                      if (item.communityId) {
                        navigation.navigate("CommunityProfile", {
                          communityId: item.communityId,
                        });
                      }
                    }}
                    disabled={!item.communityId}
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
                            size={17}
                          />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.stampBody}>
                      <Text style={styles.stampLine}>
                        <Text style={styles.stampAuthor}>{displayName}</Text>
                        <Text style={styles.stampVerb}> stamped </Text>
                        {item.placeCountryCode
                          ? `${countryFlagEmoji(item.placeCountryCode)} `
                          : ""}
                        <Text style={styles.stampPlace}>
                          {item.communityName ?? "a place"}
                        </Text>
                      </Text>
                      <View style={styles.stampMetaRow}>
                        <PostageStampIcon size={12} color={colors.gold} />
                        <Text style={styles.time}>
                          {formatRelativeTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => {
                    if (item.communityId) {
                      navigation.navigate("CommunityProfile", {
                        communityId: item.communityId,
                      });
                    }
                  }}
                  disabled={!item.communityId}
                >
                  <View style={styles.cardTop}>
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
                            size={17}
                          />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.cardMeta}>
                      {checkedIn ? (
                        <Text style={styles.atLine}>
                          <Text style={styles.author}>{displayName}</Text>
                          <Text style={styles.atWord}> at </Text>
                          {item.placeCountryCode
                            ? `${countryFlagEmoji(item.placeCountryCode)} `
                            : ""}
                          <Text style={styles.placeNameInline}>
                            {item.communityName}
                          </Text>
                        </Text>
                      ) : (
                        <Text style={styles.author}>{displayName}</Text>
                      )}
                      <Text style={styles.time}>
                        {formatRelativeTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  {item.note ? (
                    <Text style={styles.note}>
                      {cleanMomentNote(item.note)}
                    </Text>
                  ) : null}
                </Pressable>
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
              onPress={() => setComposeOpen(false)}
              hitSlop={8}
              accessibilityLabel="Close"
            >
              <IconX size={22} color={colors.ink} />
            </Pressable>
            <Text style={styles.modalTitle}>New moment</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalHint}>
              Write what stayed with you. Check in at a place so your moment
              shows as you at that neighborhood, with its flag.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="What stayed with you?"
              placeholderTextColor={colors.grayLight}
              value={draftNote}
              onChangeText={setDraftNote}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Check in</Text>
            {draftPlaceName ? (
              <View style={styles.checkInPreview}>
                <Text style={styles.checkInPreviewLabel}>Preview</Text>
                <Text style={styles.atLine}>
                  <Text style={styles.author}>You</Text>
                  <Text style={styles.atWord}> at </Text>
                  {draftPlaceCode ? `${countryFlagEmoji(draftPlaceCode)} ` : ""}
                  <Text style={styles.placeNameInline}>{draftPlaceName}</Text>
                </Text>
              </View>
            ) : null}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <Pressable
                onPress={() => setDraftCommunityId(null)}
                style={[
                  styles.chip,
                  draftCommunityId === null && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    draftCommunityId === null && styles.chipTextSelected,
                  ]}
                >
                  No place
                </Text>
              </Pressable>
              {communities.slice(0, 20).map((c) => {
                const selected = draftCommunityId === c.id;
                const placeCode = getCommunityCountryCode(c.id);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setDraftCommunityId(c.id)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    {placeCode ? (
                      <View style={styles.chipFlag}>
                        <CircularFlag countryCode={placeCode} size={16} bare />
                      </View>
                    ) : null}
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <PrimaryButton
              label="Post moment"
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
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 6,
    marginBottom: 14,
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
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 14,
    gap: 7,
  },
  stampCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 11,
    marginBottom: 10,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stampBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  stampLine: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    lineHeight: 19,
  },
  stampMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 0,
  },
  stampVerb: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
  },
  stampAuthor: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.ink,
  },
  stampPlace: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.forest,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  avatarWrap: {
    width: 36,
    height: 36,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  avatarText: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.white,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  author: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.ink,
  },
  atLine: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 19,
  },
  atWord: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
  },
  placeNameInline: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.forest,
  },
  time: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 1,
  },
  note: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
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
    lineHeight: 21,
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
  modalHint: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: 14,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 10,
  },
  checkInPreview: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  checkInPreviewLabel: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.grayLight,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: 220,
  },
  chipFlag: {
    marginRight: 0,
  },
  chipSelected: {
    borderColor: colors.forest,
    backgroundColor: colors.forest,
  },
  chipText: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.ink,
    flexShrink: 1,
  },
  chipTextSelected: {
    color: colors.white,
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
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
