import { useNavigation } from "@react-navigation/native";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { mockNotifications } from "../data/mockPassport";
import {
  IconArrowLeft,
  IconAward,
  IconBell,
  IconCoffee,
  IconMapPin,
  type Icon,
} from "../icons";
import { colors, typography } from "../theme";
import type { AppNotification } from "../types";

const iconMap: Record<AppNotification["icon"], Icon> = {
  bell: IconBell,
  "map-pin": IconMapPin,
  award: IconAward,
  coffee: IconCoffee,
};

export function NotificationsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <IconArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={mockNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const NotificationIcon = iconMap[item.icon];
          return (
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <NotificationIcon size={18} color={colors.forest} />
              </View>
              <View style={styles.content}>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.timestamp}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
  title: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.ink,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  message: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
  time: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.grayLight,
    marginTop: 6,
  },
});
