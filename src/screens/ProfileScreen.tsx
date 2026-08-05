import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchUserJournal, type ApiJournalEntry } from "../api/journal";
import { fetchUserStamps, type ApiStamp } from "../api/stamps";
import { fetchMe, updateMe, type ApiUser, type UserIntent } from "../api/users";
import { useAuth } from "../auth/AuthContext";
import {
  Badge,
  CircularFlag,
  CultureMultiSelect,
  PrimaryButton,
  Stamp,
} from "../components";
import { AchievementBadgeTile } from "../components/AchievementBadgeTile";
import { mockBadges } from "../data/mockBadges";
import { METRO_PRESETS } from "../data/mapDefaults";
import {
  cultureCountryCode,
  cultureFlag,
  INTENT_LABELS,
  INTENT_OPTIONS,
  resolveCultureId,
} from "../data/userPrefs";
import {
  IconBell,
  IconChevronRight,
  IconHelpCircle,
  IconLocate,
  IconMapPin,
  IconSetting,
  IconStar,
  IconUser,
  type Icon,
} from "../icons";
import {
  getProfileBio,
  setProfileBio,
  getShowLocationOnProfile,
  setShowLocationOnProfile,
} from "../lib/profileBio";
import { sortStampsNewestFirst, stampToCard } from "../lib/stampDisplay";
import {
  getSavedLocationInfo,
  resolveMapRegion,
  setManualMapRegion,
  type SavedLocationInfo,
} from "../lib/userLocation";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Profile">,
  NativeStackNavigationProp<RootStackParamList>
>;

const SETTINGS: { id: string; label: string; icon: Icon }[] = [
  { id: "notifications", label: "Notifications", icon: IconBell },
  { id: "upgrade", label: "Upgrade", icon: IconStar },
  { id: "account", label: "Sign out", icon: IconUser },
  { id: "help", label: "Help", icon: IconHelpCircle },
];

const PREVIEW_LIMIT = 4;
const MOMENTS_PREVIEW = 5;

type ProfileLowerTab = "passport" | "moments";

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { signOut, profile } = useAuth();
  const [stampList, setStampList] = useState<ApiStamp[]>([]);
  const [journal, setJournal] = useState<ApiJournalEntry[]>([]);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [bio, setBio] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [draftBio, setDraftBio] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationInfo, setLocationInfo] = useState<SavedLocationInfo | null>(
    null,
  );
  const [locationBusy, setLocationBusy] = useState(false);
  const [draftIntents, setDraftIntents] = useState<UserIntent[]>([]);
  const [draftCultures, setDraftCultures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [lowerTab, setLowerTab] = useState<ProfileLowerTab>("passport");
  const [showLocationOnProfile, setShowLocationOnProfileState] = useState(true);
  /** How others will see this profile once follow exists. */
  const [publicPreview, setPublicPreview] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, stampData, location, journalData, savedBio, showLocation] =
        await Promise.all([
          fetchMe(),
          fetchUserStamps().catch(() => [] as ApiStamp[]),
          getSavedLocationInfo(),
          fetchUserJournal().catch(() => [] as ApiJournalEntry[]),
          getProfileBio(),
          getShowLocationOnProfile(),
        ]);
      setUser(me);
      setStampList(sortStampsNewestFirst(stampData));
      setLocationInfo(location);
      setJournal(
        [...journalData].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
      setBio(savedBio);
      setShowLocationOnProfileState(showLocation);
    } catch {
      setUser(null);
      setStampList([]);
      setJournal([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openEdit = () => {
    const intents = (user?.intents ?? []).filter(
      (id): id is UserIntent => id in INTENT_LABELS,
    );
    setDraftIntents(intents);
    setDraftCultures((user?.cultures ?? []).slice(0, 2).map(resolveCultureId));
    setEditError(null);
    setEditOpen(true);
  };

  const openBio = () => {
    setDraftBio(bio);
    setBioOpen(true);
  };

  const toggleDraftIntent = (id: UserIntent) => {
    setEditError(null);
    setDraftIntents((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const savePrefs = async () => {
    if (draftCultures.length < 1) {
      setEditError("Choose at least one place that feels like home");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const updated = await updateMe({
        intents: draftIntents,
        cultures: draftCultures,
      });
      setUser(updated);
      setEditOpen(false);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Couldn’t save");
    } finally {
      setSaving(false);
    }
  };

  const saveBio = async () => {
    setBioSaving(true);
    try {
      await setProfileBio(draftBio);
      setBio(draftBio.trim().slice(0, 280));
      setBioOpen(false);
    } catch {
      Alert.alert("Couldn’t save bio", "Try again in a moment.");
    } finally {
      setBioSaving(false);
    }
  };

  const useCurrentLocation = async () => {
    if (locationBusy) return;
    setLocationBusy(true);
    try {
      const { region, granted, label } = await resolveMapRegion({
        requestPermission: true,
        forceGps: true,
      });
      if (!granted) {
        Alert.alert(
          "Location needed",
          "Allow location access to use where you are on the map and Home.",
        );
        return;
      }
      setLocationInfo({
        region,
        mode: "gps",
        label: label ?? "Current location",
      });
      setLocationOpen(false);
    } catch {
      Alert.alert(
        "Couldn't find you",
        "Check that location services are on, then try again.",
      );
    } finally {
      setLocationBusy(false);
    }
  };

  const pickMetro = async (id: string) => {
    const metro = METRO_PRESETS.find((m) => m.id === id);
    if (!metro || locationBusy) return;
    setLocationBusy(true);
    try {
      const info = await setManualMapRegion(metro.region, metro.label);
      setLocationInfo(info);
      setLocationOpen(false);
    } finally {
      setLocationBusy(false);
    }
  };

  const displayName = user?.displayName ?? profile?.displayName ?? "Explorer";
  const initial = displayName.charAt(0).toUpperCase();
  const cultures = user?.cultures ?? profile?.cultures ?? [];
  const stampCards = stampList.map((s) => stampToCard(s));
  const previewStamps = stampCards.slice(0, PREVIEW_LIMIT);
  const previewBadges = mockBadges.slice(0, PREVIEW_LIMIT);
  const previewMoments = journal.slice(0, MOMENTS_PREVIEW);
  const badgesEarned = mockBadges.filter((b) => b.earned).length;
  const passportCount = stampList.length + badgesEarned;
  const momentsCount = journal.length;

  const mapLocationLabel =
    locationInfo == null
      ? "Set where the map opens"
      : locationInfo.mode === "gps"
        ? `${locationInfo.label} · Current location`
        : `${locationInfo.label} · Exploring`;

  /** Short place line for the public profile header. */
  const publicLocationLine = !showLocationOnProfile
    ? "Somewhere out exploring"
    : locationInfo?.label
      ? locationInfo.label
      : "Exploring the city";

  const toggleShowLocation = async () => {
    const next = !showLocationOnProfile;
    setShowLocationOnProfileState(next);
    try {
      await setShowLocationOnProfile(next);
    } catch {
      setShowLocationOnProfileState(!next);
    }
  };

  const onSignOut = () => {
    Alert.alert("Sign out", "Sign out of Hanchi on this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setSigningOut(true);
            try {
              await signOut();
            } catch (e) {
              Alert.alert(
                "Couldn’t sign out",
                e instanceof Error ? e.message : "Try again",
              );
            } finally {
              setSigningOut(false);
              setSettingsOpen(false);
            }
          })();
        },
      },
    ]);
  };

  const goMoments = () => {
    navigation.navigate("Moments");
  };

  /** Own tab is always self; publicPreview simulates a visitor (follow-ready). */
  const isOwnProfile = !publicPreview;
  const bioText = bio.trim();
  const hasBio = bioText.length > 0;
  /** Empty About is omitted for visitors — only the owner sees the add prompt. */
  const showAboutSection = hasBio || isOwnProfile;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Top actions */}
        <View style={styles.topBar}>
          {publicPreview ? (
            <Pressable
              onPress={() => setPublicPreview(false)}
              hitSlop={8}
              style={styles.previewBanner}
            >
              <Text style={styles.previewBannerText}>
                Viewing as others · Done
              </Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {isOwnProfile ? (
            <Pressable
              onPress={() => setSettingsOpen(true)}
              hitSlop={10}
              style={styles.settingsBtn}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <IconSetting size={22} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.settingsBtn} />
          )}
        </View>

        {/* Header */}
        <Pressable
          style={styles.headerRow}
          onPress={isOwnProfile ? openEdit : undefined}
          disabled={!isOwnProfile}
          accessibilityRole={isOwnProfile ? "button" : undefined}
          accessibilityLabel={
            isOwnProfile ? "Edit profile preferences" : undefined
          }
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>

          <View style={styles.headerMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Badge label="Explorer" variant="gold" />
              {isOwnProfile ? (
                <IconChevronRight size={18} color={colors.grayLight} />
              ) : null}
            </View>

            {cultures.length > 0 ? (
              <View style={styles.cultureRowCompact}>
                {cultures.map((slug) => (
                  <CircularFlag
                    key={slug}
                    countryCode={cultureCountryCode(slug)}
                    flag={cultureFlag(slug)}
                    size={22}
                  />
                ))}
              </View>
            ) : isOwnProfile ? (
              <Text style={styles.mutedPrompt}>Add your cultures</Text>
            ) : null}

            <Pressable
              style={styles.locationLine}
              onPress={() => {
                if (!isOwnProfile) return;
                if (showLocationOnProfile) {
                  setLocationOpen(true);
                } else {
                  setSettingsOpen(true);
                }
              }}
              disabled={!isOwnProfile}
              hitSlop={4}
              accessibilityLabel={
                showLocationOnProfile
                  ? `Location ${publicLocationLine}`
                  : "Location hidden on profile"
              }
            >
              <IconMapPin
                size={13}
                color={
                  showLocationOnProfile && locationInfo
                    ? colors.gray
                    : colors.grayLight
                }
              />
              <Text
                style={[
                  styles.locationText,
                  (!showLocationOnProfile || !locationInfo) &&
                    styles.locationTextTemplate,
                ]}
                numberOfLines={1}
              >
                {publicLocationLine}
              </Text>
              {isOwnProfile && showLocationOnProfile ? (
                <Text style={styles.editLinkSmall}>Edit</Text>
              ) : null}
            </Pressable>
          </View>
        </Pressable>

        {/* About — hidden entirely for visitors when empty */}
        {showAboutSection ? (
          <View style={styles.block}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>ABOUT</Text>
              {isOwnProfile ? (
                <Pressable onPress={openBio} hitSlop={8}>
                  <Text style={styles.editLink}>{hasBio ? "Edit" : "Add"}</Text>
                </Pressable>
              ) : (
                <View />
              )}
            </View>
            {hasBio ? (
              <Pressable
                onPress={isOwnProfile ? openBio : undefined}
                disabled={!isOwnProfile}
              >
                <Text style={styles.bioText}>{bioText}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={openBio}>
                <Text style={styles.mutedPrompt}>
                  Write a short intro about yourself (optional)
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {/* Passport | Moments */}
        <View style={styles.segmented}>
          <Pressable
            style={[
              styles.segment,
              lowerTab === "passport" && styles.segmentActive,
            ]}
            onPress={() => setLowerTab("passport")}
            accessibilityRole="tab"
            accessibilityState={{ selected: lowerTab === "passport" }}
          >
            <Text
              style={[
                styles.segmentLabel,
                lowerTab === "passport" && styles.segmentLabelActive,
              ]}
            >
              Passport{" "}
              <Text
                style={[
                  styles.segmentCount,
                  lowerTab === "passport" && styles.segmentCountActive,
                ]}
              >
                {passportCount}
              </Text>
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segment,
              lowerTab === "moments" && styles.segmentActive,
            ]}
            onPress={() => setLowerTab("moments")}
            accessibilityRole="tab"
            accessibilityState={{ selected: lowerTab === "moments" }}
          >
            <Text
              style={[
                styles.segmentLabel,
                lowerTab === "moments" && styles.segmentLabelActive,
              ]}
            >
              Moments{" "}
              <Text
                style={[
                  styles.segmentCount,
                  lowerTab === "moments" && styles.segmentCountActive,
                ]}
              >
                {momentsCount}
              </Text>
            </Text>
          </Pressable>
        </View>

        {lowerTab === "passport" ? (
          <>
            <Pressable
              style={styles.sectionHeader}
              onPress={() => navigation.navigate("StampCollection")}
              accessibilityRole="button"
              accessibilityLabel="See all stamps"
            >
              <Text style={styles.sectionEyebrow}>STAMPS</Text>
              <IconChevronRight size={20} color={colors.gray} />
            </Pressable>
            {previewStamps.length === 0 ? (
              <Text style={styles.sectionEmpty}>
                Visit communities and stamp them. They show here.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stampRow}
                style={styles.stampScroll}
              >
                {previewStamps.map((stamp) => (
                  <Stamp
                    key={stamp.stampId}
                    communityId={stamp.id}
                    name={stamp.communityName}
                    subtitle={stamp.subtitle}
                    meta={stamp.meta}
                    countryCode={stamp.countryCode}
                    earned
                    size="sm"
                    onPress={() =>
                      navigation.navigate("CommunityProfile", {
                        communityId: stamp.id,
                      })
                    }
                  />
                ))}
              </ScrollView>
            )}

            <Pressable
              style={[styles.sectionHeader, styles.sectionHeaderSpaced]}
              onPress={() => navigation.navigate("BadgeCollection")}
              accessibilityRole="button"
              accessibilityLabel="See all badges"
            >
              <Text style={styles.sectionEyebrow}>BADGES</Text>
              <IconChevronRight size={20} color={colors.gray} />
            </Pressable>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgeRow}
              style={styles.badgeScroll}
            >
              {previewBadges.map((badge) => (
                <AchievementBadgeTile
                  key={badge.id}
                  badge={badge}
                  compact
                  onPress={() => navigation.navigate("BadgeCollection")}
                />
              ))}
            </ScrollView>
          </>
        ) : (
          <>
            <Pressable
              style={styles.sectionHeader}
              onPress={goMoments}
              accessibilityRole="button"
              accessibilityLabel="Open Moments tab"
            >
              <Text style={styles.sectionEyebrow}>YOUR MOMENTS</Text>
              <IconChevronRight size={20} color={colors.gray} />
            </Pressable>
            {previewMoments.length === 0 ? (
              <Pressable onPress={goMoments}>
                <Text style={styles.sectionEmpty}>
                  Notes from places you’ve been show up here and in Moments.
                </Text>
              </Pressable>
            ) : (
              <View style={styles.momentsList}>
                {previewMoments.map((entry) => (
                  <Pressable
                    key={entry.id}
                    style={styles.momentCard}
                    onPress={goMoments}
                  >
                    <Text style={styles.momentNote} numberOfLines={2}>
                      {entry.note}
                    </Text>
                    <Text style={styles.momentMeta}>
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Settings sheet */}
      <Modal
        visible={settingsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSettingsOpen(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Settings</Text>
            <View style={{ width: 56 }} />
          </View>

          <Pressable
            style={styles.settingsRow}
            onPress={() => {
              setSettingsOpen(false);
              setLocationOpen(true);
            }}
          >
            <View style={styles.settingsIcon}>
              <IconMapPin size={18} color={colors.forest} />
            </View>
            <View style={styles.settingsCopy}>
              <Text style={styles.settingsLabel}>Map location</Text>
              <Text style={styles.settingsSublabel} numberOfLines={1}>
                {mapLocationLabel}
              </Text>
            </View>
            <IconChevronRight size={18} color={colors.grayLight} />
          </Pressable>

          <Pressable style={styles.settingsRow} onPress={toggleShowLocation}>
            <View style={styles.settingsIcon}>
              <IconMapPin size={18} color={colors.forest} />
            </View>
            <View style={styles.settingsCopy}>
              <Text style={styles.settingsLabel}>Show location on profile</Text>
              <Text style={styles.settingsSublabel}>
                {showLocationOnProfile
                  ? "Visible · tap to hide"
                  : "Hidden · “Somewhere out exploring”"}
              </Text>
            </View>
            <Text
              style={[
                styles.togglePill,
                showLocationOnProfile && styles.togglePillOn,
              ]}
            >
              {showLocationOnProfile ? "On" : "Off"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.settingsRow}
            onPress={() => {
              setSettingsOpen(false);
              setPublicPreview(true);
            }}
          >
            <View style={styles.settingsIcon}>
              <IconUser size={18} color={colors.forest} />
            </View>
            <View style={styles.settingsCopy}>
              <Text style={styles.settingsLabel}>
                Preview as others see you
              </Text>
              <Text style={styles.settingsSublabel}>
                Empty About hidden. Edits stay private.
              </Text>
            </View>
            <IconChevronRight size={18} color={colors.grayLight} />
          </Pressable>

          {SETTINGS.map((item) => {
            const SettingIcon = item.icon;
            return (
              <Pressable
                key={item.id}
                style={styles.settingsRow}
                onPress={
                  item.id === "account"
                    ? onSignOut
                    : () => Alert.alert(item.label, "Coming soon.")
                }
              >
                <View style={styles.settingsIcon}>
                  <SettingIcon size={18} color={colors.forest} />
                </View>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <IconChevronRight size={18} color={colors.grayLight} />
              </Pressable>
            );
          })}
          {signingOut ? (
            <ActivityIndicator
              color={colors.forest}
              style={{ marginTop: 16 }}
            />
          ) : null}
        </SafeAreaView>
      </Modal>

      {/* Bio */}
      <Modal
        visible={bioOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBioOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setBioOpen(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>About you</Text>
            <View style={{ width: 56 }} />
          </View>
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalHint}>
              Optional. A short note others could see on your profile someday.
            </Text>
            <TextInput
              style={styles.bioInput}
              placeholder="What do you love exploring?"
              placeholderTextColor={colors.grayLight}
              value={draftBio}
              onChangeText={setDraftBio}
              multiline
              maxLength={280}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{draftBio.length}/280</Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <PrimaryButton label="Save" onPress={saveBio} loading={bioSaving} />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Cultures / intents */}
      <Modal
        visible={editOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditOpen(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Preferences</Text>
            <View style={{ width: 56 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalSection}>Where do you feel at home?</Text>
            <Text style={styles.modalHint}>
              Choose one or two places that feel like yours.
            </Text>
            <CultureMultiSelect
              value={draftCultures}
              onChange={(next) => {
                setDraftCultures(next);
                setEditError(null);
              }}
              placeholder="Search and choose up to two"
            />

            <Text style={[styles.modalSection, { marginTop: 24 }]}>
              What brings you to Hanchi?
            </Text>
            <Text style={styles.modalHint}>
              Optional. Choose as many as fit.
            </Text>
            <View style={styles.intentList}>
              {INTENT_OPTIONS.map((option) => {
                const selected = draftIntents.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggleDraftIntent(option.id)}
                    style={[
                      styles.intentRow,
                      selected && styles.intentRowSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.intentLabel,
                        selected && styles.intentLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            {editError ? (
              <Text style={styles.editError}>{editError}</Text>
            ) : null}
            <PrimaryButton
              label="Save"
              onPress={savePrefs}
              loading={saving}
              disabled={draftCultures.length < 1}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Location */}
      <Modal
        visible={locationOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLocationOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setLocationOpen(false)}
              disabled={locationBusy}
            >
              <Text style={styles.modalCancel}>Close</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Location</Text>
            <View style={{ width: 56 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalHint}>
              This is where Home nearby and the map open. Pick a metro to
              explore, or use where you are.
            </Text>

            <Pressable
              style={[styles.intentRow, styles.gpsRow]}
              onPress={useCurrentLocation}
              disabled={locationBusy}
            >
              <View style={styles.settingsIcon}>
                {locationBusy ? (
                  <ActivityIndicator size="small" color={colors.forest} />
                ) : (
                  <IconLocate size={18} color={colors.forest} />
                )}
              </View>
              <View style={styles.gpsCopy}>
                <Text style={styles.intentLabel}>Use my current location</Text>
                <Text style={styles.modalHintInline}>
                  Clears any metro override
                </Text>
              </View>
            </Pressable>

            <Text style={[styles.modalSection, { marginTop: 24 }]}>
              Explore a metro
            </Text>
            <View style={styles.intentList}>
              {METRO_PRESETS.map((metro) => {
                const selected =
                  locationInfo?.mode === "manual" &&
                  locationInfo.label === metro.label;
                return (
                  <Pressable
                    key={metro.id}
                    onPress={() => pickMetro(metro.id)}
                    disabled={locationBusy}
                    style={[
                      styles.intentRow,
                      selected && styles.intentRowSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.intentLabel,
                        selected && styles.intentLabelSelected,
                      ]}
                    >
                      {metro.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
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
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
    marginBottom: 8,
    gap: 8,
  },
  previewBanner: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.forest,
  },
  previewBannerText: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.white,
    textAlign: "center",
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 20,
  },
  avatarWrap: {
    width: 88,
    height: 88,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: typography.bodySemibold,
    color: colors.white,
    fontSize: 32,
  },
  headerMeta: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingTop: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  name: {
    fontFamily: typography.display,
    fontSize: 22,
    color: colors.ink,
    maxWidth: "55%",
  },
  cultureRowCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  locationLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    flexShrink: 1,
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
  },
  locationTextTemplate: {
    fontStyle: "italic",
    color: colors.grayLight,
  },
  editLinkSmall: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.forest,
    marginLeft: 2,
  },
  block: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionHeaderSpaced: {
    marginTop: 22,
  },
  sectionEyebrow: {
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    color: colors.gray,
    letterSpacing: 0.8,
  },
  editLink: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.forest,
  },
  mutedPrompt: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.grayLight,
    lineHeight: 20,
  },
  bioText: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginTop: 18,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.full,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.gray,
  },
  segmentLabelActive: {
    fontFamily: typography.bodySemibold,
    color: colors.ink,
  },
  segmentCount: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.grayLight,
  },
  segmentCountActive: {
    color: colors.forest,
    fontFamily: typography.bodySemibold,
  },
  sectionEmpty: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
    marginBottom: 4,
  },
  stampScroll: {
    overflow: "visible",
    marginHorizontal: -20,
  },
  stampRow: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  badgeScroll: {
    overflow: "visible",
    marginHorizontal: -20,
  },
  badgeRow: {
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  momentsList: {
    gap: 8,
  },
  momentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 4,
  },
  momentNote: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
  momentMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  settingsCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  settingsSublabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
  },
  togglePill: {
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    color: colors.gray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  togglePillOn: {
    color: colors.forest,
    borderColor: colors.forest,
    backgroundColor: colors.white,
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
  modalCancel: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.forest,
    width: 56,
  },
  modalTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalSection: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 6,
  },
  modalHint: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginBottom: 12,
    lineHeight: 18,
  },
  modalHintInline: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.grayLight,
    marginTop: 2,
  },
  bioInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: 14,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.ink,
  },
  charCount: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.grayLight,
    textAlign: "right",
    marginTop: 6,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gpsCopy: {
    flex: 1,
  },
  intentList: {
    gap: 8,
  },
  intentRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  intentRowSelected: {
    borderColor: colors.forest,
    backgroundColor: colors.forest,
  },
  intentLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
  intentLabelSelected: {
    color: colors.white,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 8,
  },
  editError: {
    fontFamily: typography.body,
    fontSize: 13,
    color: "#B42318",
    textAlign: "center",
  },
});
