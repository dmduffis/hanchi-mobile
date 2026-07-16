import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip, PrimaryButton } from "../components";
import { colors, typography } from "../theme";

const INTERESTS = [
  "Food markets",
  "Street food",
  "Festivals",
  "History",
  "Music",
  "Bakeries",
  "Late night",
  "Family-friendly",
  "Coffee & tea",
  "Spicy",
];

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [selected, setSelected] = useState<string[]>([
    "Food markets",
    "Street food",
  ]);

  const toggle = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.wordmark}>Sinta</Text>
          <Text style={styles.tagline}>Sit down. Stay a while.</Text>
        </View>

        <View style={styles.middle}>
          <Text style={styles.prompt}>What are you curious about?</Text>
          <View style={styles.chips}>
            {INTERESTS.map((interest) => (
              <Chip
                key={interest}
                label={interest}
                selected={selected.includes(interest)}
                onPress={() => toggle(interest)}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <PrimaryButton
            label="Continue"
            onPress={onComplete}
            disabled={selected.length === 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  top: {
    alignItems: "center",
    marginTop: 48,
  },
  wordmark: {
    fontFamily: typography.display,
    fontSize: 48,
    color: colors.forest,
  },
  tagline: {
    fontFamily: typography.body,
    fontSize: 16,
    color: colors.gray,
    marginTop: 8,
  },
  middle: {
    flex: 1,
    justifyContent: "center",
  },
  prompt: {
    fontFamily: typography.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 20,
    textAlign: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  bottom: {
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.forest,
    width: 20,
  },
});
