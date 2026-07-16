import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "../components";
import { mockFavorites } from "../data/mockFavorites";
import { mockPassportStamps } from "../data/mockPassport";
import { colors, radii, typography } from "../theme";

const SETTINGS = [
  { id: "notifications", label: "Notifications", icon: "bell" as const },
  { id: "upgrade", label: "Upgrade", icon: "star" as const },
  { id: "account", label: "Account", icon: "user" as const },
  { id: "help", label: "Help", icon: "help-circle" as const },
];

export function ProfileScreen() {
  const stamps = mockPassportStamps.filter((s) => s.earned).length;
  const favorites = mockFavorites.length;
  const cultures = new Set(
    mockPassportStamps.filter((s) => s.earned).map((s) => s.communityId),
  ).size;

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
    marginTop: 16,
    marginBottom: 28,
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontFamily: typography.display,
    fontSize: 32,
    color: colors.white,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 26,
    color: colors.ink,
  },
  stats: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.forest,
  },
  statLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
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
