import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { updateMe, type UserIntent } from "../api/users";
import { CultureMultiSelect, PrimaryButton } from "../components";
import { INTENT_OPTIONS } from "../data/userPrefs";
import { colors, radii, typography } from "../theme";

type OnboardingScreenProps = {
  onComplete: () => void | Promise<void>;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [intents, setIntents] = useState<UserIntent[]>([]);
  const [cultures, setCultures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinueCultures = () => {
    if (cultures.length < 1 || cultures.length > 2) return;
    setError(null);
    setStep(2);
  };

  const toggleIntent = (id: UserIntent) => {
    setError(null);
    setIntents((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const finish = async (selectedIntents: UserIntent[]) => {
    if (cultures.length < 1 || cultures.length > 2) return;
    setSaving(true);
    setError(null);
    try {
      await updateMe({
        cultures,
        intents: selectedIntents,
      });
      await onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.wordmark}>Sinta</Text>
          <Text style={styles.tagline}>Sit down. Stay a while.</Text>
        </View>

        {step === 1 ? (
          <View style={styles.middle}>
            <Text style={styles.prompt}>Where do you feel at home?</Text>
            <Text style={styles.hint}>
              Choose one or two places that feel like yours. Family roots,
              somewhere you grew up, or a culture you carry with you. Whatever
              fits.
            </Text>
            <CultureMultiSelect
              value={cultures}
              onChange={(next) => {
                setCultures(next);
                setError(null);
              }}
              placeholder="Search and choose up to two"
            />
          </View>
        ) : (
          <View style={styles.middle}>
            <Text style={styles.prompt}>What brings you to Sinta?</Text>
            <Text style={styles.hint}>
              Optional. Choose as many as fit, or skip and explore on your own.
            </Text>
            <View style={styles.intentList}>
              {INTENT_OPTIONS.map((option) => {
                const selected = intents.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggleIntent(option.id)}
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
                    <Text
                      style={[
                        styles.intentDesc,
                        selected && styles.intentDescSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.bottom}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.dots}>
            <View style={[styles.dot, step === 1 && styles.dotActive]} />
            <View style={[styles.dot, step === 2 && styles.dotActive]} />
          </View>
          {step === 1 ? (
            <PrimaryButton
              label="Continue"
              onPress={onContinueCultures}
              disabled={cultures.length < 1}
            />
          ) : (
            <View style={styles.step2Actions}>
              <Pressable
                onPress={() => setStep(1)}
                disabled={saving}
                style={styles.backBtn}
              >
                <Text style={styles.backLabel}>Back</Text>
              </Pressable>
              <View style={styles.finishWrap}>
                <PrimaryButton
                  label={
                    intents.length > 0 ? "Enter Sinta" : "Skip and explore"
                  }
                  onPress={() => finish(intents)}
                  loading={saving}
                />
              </View>
            </View>
          )}
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
    marginTop: 32,
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
    paddingVertical: 16,
  },
  prompt: {
    fontFamily: typography.display,
    fontSize: 22,
    color: colors.ink,
    textAlign: "center",
  },
  hint: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  intentList: {
    gap: 10,
  },
  intentRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  intentRowSelected: {
    borderColor: colors.forest,
    backgroundColor: colors.forest,
  },
  intentLabel: {
    fontFamily: typography.bodySemibold,
    fontSize: 15,
    color: colors.ink,
  },
  intentLabelSelected: {
    color: colors.white,
  },
  intentDesc: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
  },
  intentDescSelected: {
    color: "rgba(255,255,255,0.85)",
  },
  bottom: {
    gap: 12,
    paddingTop: 8,
  },
  error: {
    fontFamily: typography.body,
    fontSize: 13,
    color: "#B42318",
    textAlign: "center",
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
  step2Actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  backLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    color: colors.forest,
  },
  finishWrap: {
    flex: 1,
  },
});
