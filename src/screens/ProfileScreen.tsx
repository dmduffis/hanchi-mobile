import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchUserStamps } from "../api/stamps";
import { fetchMe, updateMe, type ApiUser, type UserIntent } from "../api/users";
import { useAuth } from "../auth/AuthContext";
import {
  Badge,
  CircularFlag,
  CultureMultiSelect,
  PrimaryButton,
} from "../components";
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
  IconStar,
  IconUser,
  type Icon,
} from "../icons";
import {
  getSavedLocationInfo,
  resolveMapRegion,
  setManualMapRegion,
  type SavedLocationInfo,
} from "../lib/userLocation";
import { colors, radii, typography } from "../theme";

const SETTINGS: { id: string; label: string; icon: Icon }[] = [
  { id: "notifications", label: "Notifications", icon: IconBell },
  { id: "upgrade", label: "Upgrade", icon: IconStar },
  { id: "account", label: "Account", icon: IconUser },
  { id: "help", label: "Help", icon: IconHelpCircle },
];

export function ProfileScreen() {
  const { signOut, profile } = useAuth();
  const [stamps, setStamps] = useState(0);
  const [placesStamped, setPlacesStamped] = useState(0);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationInfo, setLocationInfo] = useState<SavedLocationInfo | null>(
    null,
  );
  const [locationBusy, setLocationBusy] = useState(false);
  const [draftIntents, setDraftIntents] = useState<UserIntent[]>([]);
  const [draftCultures, setDraftCultures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const refreshLocation = async () => {
    const info = await getSavedLocationInfo();
    setLocationInfo(info);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, stampData, location] = await Promise.all([
          fetchMe(),
          fetchUserStamps(),
          getSavedLocationInfo(),
        ]);
        if (cancelled) return;
        setUser(me);
        setStamps(stampData.length);
        setPlacesStamped(new Set(stampData.map((s) => s.communityId)).size);
        setLocationInfo(location);
      } catch {
        if (!cancelled) {
          setUser(null);
          setStamps(0);
          setPlacesStamped(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openEdit = () => {
    const intents = (user?.intents ?? []).filter(
      (id): id is UserIntent => id in INTENT_LABELS,
    );
    setDraftIntents(intents);
    setDraftCultures((user?.cultures ?? []).slice(0, 2).map(resolveCultureId));
    setEditError(null);
    setEditOpen(true);
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
            }
          })();
        },
      },
    ]);
  };
  const locationSubtitle =
    locationInfo == null
      ? "Set where the map opens"
      : locationInfo.mode === "gps"
        ? `${locationInfo.label} · Current location`
        : `${locationInfo.label} · Exploring`;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Badge label="Explorer plan" variant="gold" />
        </View>

        <View style={styles.prefsCard}>
          <View style={styles.prefsHeader}>
            <Text style={styles.prefsTitle}>Your cultures</Text>
            <Pressable onPress={openEdit} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          {cultures.length > 0 ? (
            <View style={styles.cultureRow}>
              {cultures.map((slug) => (
                <CircularFlag
                  key={slug}
                  countryCode={cultureCountryCode(slug)}
                  flag={cultureFlag(slug)}
                  size={36}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.intentLineMuted}>Add 1–2 cultures</Text>
          )}
        </View>

        <Pressable
          style={styles.prefsCard}
          onPress={() => {
            void refreshLocation();
            setLocationOpen(true);
          }}
        >
          <View style={styles.prefsHeader}>
            <Text style={styles.prefsTitle}>Map location</Text>
            <Text style={styles.editLink}>Change</Text>
          </View>
          <View style={styles.locationRow}>
            <View style={styles.settingsIcon}>
              <IconMapPin size={18} color={colors.forest} />
            </View>
            <Text style={styles.locationLabel}>{locationSubtitle}</Text>
            <IconChevronRight size={18} color={colors.grayLight} />
          </View>
        </Pressable>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stamps}</Text>
            <Text style={styles.statLabel}>Stamps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{placesStamped}</Text>
            <Text style={styles.statLabel}>Places stamped</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>
        {SETTINGS.map((item) => {
          const SettingIcon = item.icon;
          return (
            <Pressable
              key={item.id}
              style={styles.settingsRow}
              onPress={item.id === "account" ? onSignOut : undefined}
            >
              <View style={styles.settingsIcon}>
                <SettingIcon size={18} color={colors.forest} />
              </View>
              <Text style={styles.settingsLabel}>
                {item.id === "account" ? "Sign out" : item.label}
              </Text>
              <IconChevronRight size={18} color={colors.grayLight} />
            </Pressable>
          );
        })}
        {signingOut ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: 12 }} />
        ) : null}
      </ScrollView>

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
            <Text style={styles.modalTitle}>Map location</Text>
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
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
    gap: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: typography.bodySemibold,
    color: colors.white,
    fontSize: 28,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.ink,
  },
  prefsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  prefsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prefsTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
  },
  editLink: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.forest,
  },
  intentLineMuted: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.grayLight,
  },
  cultureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationLabel: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
  },
  stats: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: typography.display,
    fontSize: 22,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
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
