import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AchievementBadgeTile } from "../components/AchievementBadgeTile";
import { mockBadges } from "../data/mockBadges";
import { IconArrowLeft } from "../icons";
import type { RootStackParamList } from "../navigation/types";
import { colors, typography } from "../theme";

export function BadgeCollectionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const earned = mockBadges.filter((b) => b.earned).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <IconArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Badges</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.count}>
          {earned} of {mockBadges.length} earned
        </Text>
        <View style={styles.grid}>
          {mockBadges.map((badge) => (
            <View key={badge.id} style={styles.cell}>
              <AchievementBadgeTile badge={badge} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.bodySemibold,
    fontSize: 17,
    color: colors.ink,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  count: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 6,
  },
  cell: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 22,
    overflow: "visible" as const,
  },
});
