import { useEffect, useState } from "react";
import {
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
import {
  Badge,
  CircularFlag,
  CultureMultiSelect,
  PrimaryButton,
} from "../components";
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
  IconStar,
  IconUser,
  type Icon,
} from "../icons";
import { colors, radii, typography } from "../theme";

const SETTINGS: { id: string; label: string; icon: Icon }[] = [
  { id: "notifications", label: "Notifications", icon: IconBell },
  { id: "upgrade", label: "Upgrade", icon: IconStar },
  { id: "account", label: "Account", icon: IconUser },
  { id: "help", label: "Help", icon: IconHelpCircle },
];

export function ProfileScreen() {
  const [stamps, setStamps] = useState(0);
  const [placesStamped, setPlacesStamped] = useState(0);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [draftIntents, setDraftIntents] = useState<UserIntent[]>([]);
  const [draftCultures, setDraftCultures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, stampData] = await Promise.all([
          fetchMe(),
          fetchUserStamps(),
        ]);
        if (cancelled) return;
        setUser(me);
        setStamps(stampData.length);
        setPlacesStamped(new Set(stampData.map((s) => s.communityId)).size);
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

  const displayName = user?.displayName ?? "Alex Rivera";
  const initial = displayName.charAt(0).toUpperCase();
  const cultures = user?.cultures ?? [];

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
            <Pressable key={item.id} style={styles.settingsRow}>
              <View style={styles.settingsIcon}>
                <SettingIcon size={18} color={colors.forest} />
              </View>
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <IconChevronRight size={18} color={colors.grayLight} />
            </Pressable>
          );
        })}
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
              What brings you to Sinta?
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
