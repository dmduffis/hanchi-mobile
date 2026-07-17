import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchUserStamps } from "../api/stamps";
import { Badge } from "../components";
import { mockFavorites } from "../data/mockFavorites";
import { colors, radii, typography } from "../theme";

const SETTINGS = [
  { id: "notifications", label: "Notifications", icon: "bell" as const },
  { id: "upgrade", label: "Upgrade", icon: "star" as const },
  { id: "account", label: "Account", icon: "user" as const },
  { id: "help", label: "Help", icon: "help-circle" as const },
];

export function ProfileScreen() {
  const [stamps, setStamps] = useState(0);
  const [cultures, setCultures] = useState(0);
  const favorites = mockFavorites.length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUserStamps();
        if (cancelled) return;
        setStamps(data.length);
        setCultures(new Set(data.map((s) => s.communityId)).size);
      } catch {
        if (!cancelled) {
          setStamps(0);
          setCultures(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <Text style={styles.name}>Alex Rivera</Text>
          <Badge label="Explorer plan" variant="gold" />
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stamps}</Text>
            <Text style={styles.statLabel}>Stamps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{favorites}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{cultures}</Text>
            <Text style={styles.statLabel}>Cultures</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>
        {SETTINGS.map((item) => (
          <Pressable key={item.id} style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <Feather name={item.icon} size={18} color={colors.forest} />
            </View>
            <Text style={styles.settingsLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={18} color={colors.grayLight} />
          </Pressable>
        ))}
      </ScrollView>
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
});
