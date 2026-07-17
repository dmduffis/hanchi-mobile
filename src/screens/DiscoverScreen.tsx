import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchRoutes, type ApiRouteSummary } from "../api/routes";
import { PrimaryButton, PromoBanner } from "../components";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme";

export function DiscoverScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [routes, setRoutes] = useState<ApiRouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRoutes();
        if (!cancelled) setRoutes(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load routes");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const aiRoute = useMemo(
    () => routes.find((r) => r.type === "ai_generated") ?? routes[0],
    [routes],
  );
  const curated = useMemo(
    () => routes.filter((r) => r.type !== "ai_generated"),
    [routes],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.navTitle}>Discover</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.routeSub}>{error}</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Made for you</Text>
            {aiRoute ? (
              <View style={styles.aiCard}>
                <View style={styles.aiBadge}>
                  <Feather name="zap" size={12} color={colors.goldText} />
                  <Text style={styles.aiBadgeText}>AI suggested</Text>
                </View>
                <Text style={styles.aiTitle}>{aiRoute.title}</Text>
                <Text style={styles.aiSub}>
                  {aiRoute.description ?? "A suggested walk through the city."}
                </Text>
                <Text style={styles.aiMeta}>
                  {aiRoute.stopCount ?? 0} stops · {aiRoute.type.replace("_", " ")}
                </Text>
                <PrimaryButton label="Start this route" style={{ marginTop: 16 }} />
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Curated routes</Text>
            {curated.map((route) => (
              <Pressable key={route.id} style={styles.routeRow}>
                <View style={styles.routeIcon}>
                  <Feather name="navigation" size={18} color={colors.forest} />
                </View>
                <View style={styles.routeContent}>
                  <Text style={styles.routeTitle}>{route.title}</Text>
                  <Text style={styles.routeSub}>
                    {route.description ?? "Explore this route"}
                  </Text>
                  <Text style={styles.routeMeta}>
                    {route.stopCount ?? 0} stops · {route.type}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.grayLight} />
              </Pressable>
            ))}

            <View style={{ marginTop: 24 }}>
              <PromoBanner
                text="Seasonal challenge: Taste of Queens — stamp 4 communities by Sunday"
                icon="award"
              />
            </View>
          </>
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
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 14,
    marginTop: 8,
  },
  aiCard: {
    backgroundColor: colors.forestDark,
    borderRadius: radii.lg,
    padding: 20,
    marginBottom: 28,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: 12,
  },
  aiBadgeText: {
    fontFamily: typography.bodyMedium,
    fontSize: 11,
    color: colors.goldText,
  },
  aiTitle: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.white,
  },
  aiSub: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.grayLight,
    marginTop: 8,
    lineHeight: 20,
  },
  aiMeta: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.gold,
    marginTop: 12,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  routeContent: {
    flex: 1,
  },
  routeTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
  },
  routeSub: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  routeMeta: {
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    color: colors.forest,
    marginTop: 4,
  },
});
