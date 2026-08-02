import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCommunities } from "../api/useCommunities";
import { PrimaryButton, Skeleton } from "../components";
import { IconX } from "../icons";
import type { RootStackParamList } from "../navigation/types";
import { colors, typography } from "../theme";

export function DropInScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { communities, loading, error } = useCommunities();
  const [index, setIndex] = useState(0);
  const community =
    communities.length > 0 ? communities[index % communities.length] : null;

  const tryAnother = () => {
    if (communities.length === 0) return;
    setIndex((i) => (i + 1) % communities.length);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.close}
          hitSlop={8}
        >
          <IconX size={24} color={colors.white} />
        </Pressable>

        <View style={styles.center}>
          {loading ? (
            <View style={styles.dropSkeleton}>
              <Skeleton width={80} height={12} />
              <Skeleton circle={72} style={{ marginTop: 20 }} />
              <Skeleton width={180} height={22} style={{ marginTop: 20 }} />
              <Skeleton width={140} height={14} style={{ marginTop: 10 }} />
              <Skeleton width={100} height={12} style={{ marginTop: 8 }} />
            </View>
          ) : error || !community ? (
            <Text style={styles.meta}>{error ?? "No communities yet"}</Text>
          ) : (
            <>
              <Text style={styles.label}>Drop In found</Text>
              <Text style={styles.emoji}>{community.emoji}</Text>
              <Text style={styles.name}>{community.name}</Text>
              <Text style={styles.meta}>
                {community.neighborhood} · {community.distanceMiles} mi away
              </Text>
              <Text style={styles.heritage}>{community.heritage}</Text>

              <PrimaryButton
                label="Start exploring"
                onPress={() =>
                  navigation.replace("CommunityProfile", {
                    communityId: community.id,
                  })
                }
                style={styles.cta}
              />
              <Pressable onPress={tryAnother} style={styles.tryAnother}>
                <Text style={styles.tryAnotherText}>Try another</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.forestDark,
  },
  safe: {
    flex: 1,
  },
  close: {
    alignSelf: "flex-end",
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  dropSkeleton: {
    alignItems: "center",
    width: "100%",
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.gold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 36,
    color: colors.white,
    textAlign: "center",
  },
  meta: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.grayLight,
    marginTop: 10,
    textAlign: "center",
  },
  heritage: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.gold,
    marginTop: 6,
  },
  cta: {
    marginTop: 40,
    alignSelf: "stretch",
  },
  tryAnother: {
    marginTop: 20,
    padding: 8,
  },
  tryAnotherText: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.gold,
    textDecorationLine: "underline",
  },
});
