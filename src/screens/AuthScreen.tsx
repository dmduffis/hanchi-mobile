import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../auth/AuthContext";
import { Stamp } from "../components";
import { getCommunityCountryCode } from "../data/communityFlags";
import { isSupabaseConfigured } from "../lib/supabase";
import { colors, radii, typography } from "../theme";

type Mode = "signIn" | "signUp";

const AUTH = {
  cream: "#F6F0E6",
  ink: "#141414",
  muted: "#8A847A",
};

/**
 * From the board palette (#FD5F00, #FFD8C5, #6025E1, #0C2972, #E4F4F4).
 * Soft mint deepened from #E4F4F4 so it still reads as ink.
 */
const FAN = [
  {
    communityId: "little-guyana-queens",
    name: "Little Guyana",
    ink: "#6025E1",
    tilt: -12,
    x: -56,
    y: 18,
    z: 1,
  },
  {
    communityId: "chinatown-flushing",
    name: "Chinatown · Flushing",
    ink: "#FD5F00",
    tilt: 10,
    x: 56,
    y: 14,
    z: 2,
  },
  {
    communityId: "koreatown-manhattan",
    name: "Koreatown",
    ink: "#2A8A8A",
    tilt: -2,
    x: 0,
    y: 0,
    z: 3,
  },
] as const;

function FanStamp({
  communityId,
  name,
  ink,
  tilt,
  x,
  y,
  z,
  delayMs,
}: {
  communityId: string;
  name: string;
  ink: string;
  tilt: number;
  x: number;
  y: number;
  z: number;
  delayMs: number;
}) {
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-5, {
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [bob, delayMs]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x },
      { translateY: y + bob.value },
      { rotate: `${tilt}deg` },
      { scale: z === 3 ? 1 : 0.92 },
    ],
    zIndex: z,
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(delayMs).duration(650)}
      style={[styles.fanItem, animStyle]}
      pointerEvents="none"
    >
      <Stamp
        communityId={communityId}
        name={name}
        countryCode={getCommunityCountryCode(communityId)}
        size="sm"
        earned
        tiltDeg={0}
        inkColor={ink}
      />
    </Animated.View>
  );
}

export function AuthScreen() {
  const { signIn, signUp, resendSignupEmail } = useAuth();
  const [mode, setMode] = useState<Mode>("signUp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  const configured = isSupabaseConfigured();
  const isSignUp = mode === "signUp";

  const openEmailApp = () => {
    const url = Platform.OS === "ios" ? "message://" : "mailto:";
    void Linking.openURL(url).catch(() => {
      setError("Couldn’t open your email app — check it manually.");
    });
  };

  const onResendConfirm = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email to resend");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await resendSignupEmail(trimmedEmail);
      setInfo("Confirmation email sent again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t resend email");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter email and password");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signIn") {
        await signIn(trimmedEmail, password);
      } else {
        const result = await signUp(
          trimmedEmail,
          password,
          displayName.trim() || undefined,
        );
        if (result.needsEmailConfirmation) {
          setAwaitingEmailConfirm(true);
          setMode("signIn");
          setPassword("");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.hero}>
              <View style={styles.fan}>
                {FAN.map((stamp, i) => (
                  <FanStamp
                    key={stamp.communityId}
                    {...stamp}
                    delayMs={80 + i * 100}
                  />
                ))}
              </View>

              <Animated.View
                entering={FadeInDown.delay(120).duration(550)}
                style={styles.heroCopy}
              >
                <Text style={styles.wordmark}>Hanchi</Text>
                <Text style={styles.tagline}>Every alley holds a story.</Text>
              </Animated.View>
            </View>

            <Animated.View
              entering={FadeInUp.delay(180).duration(550)}
              style={styles.formSheet}
            >
              {!configured ? (
                <Text style={styles.error}>
                  Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
                  to your .env, then restart Expo.
                </Text>
              ) : awaitingEmailConfirm ? (
                <View style={styles.form}>
                  <Text style={styles.confirmTitle}>Confirm your email</Text>
                  <Text style={styles.confirmBody}>
                    We sent a link to{" "}
                    <Text style={styles.confirmEmail}>
                      {email.trim() || "your inbox"}
                    </Text>
                    . Open it to activate your account, then come back to sign
                    in.
                  </Text>

                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  {info ? <Text style={styles.info}>{info}</Text> : null}

                  <Pressable
                    onPress={openEmailApp}
                    style={({ pressed }) => [
                      styles.cta,
                      pressed && styles.ctaPressed,
                    ]}
                  >
                    <Text style={styles.ctaLabel}>Open email app</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => void onResendConfirm()}
                    disabled={busy}
                    style={styles.switch}
                  >
                    <Text style={styles.switchText}>
                      {busy ? "Sending…" : "Resend confirmation email"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setAwaitingEmailConfirm(false);
                      setMode("signIn");
                      setError(null);
                      setInfo(null);
                    }}
                    style={styles.switch}
                  >
                    <Text style={styles.switchText}>
                      I’ve confirmed — sign in
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.form}>
                  {isSignUp ? (
                    <TextInput
                      style={styles.input}
                      placeholder="Display name"
                      placeholderTextColor={AUTH.muted}
                      autoCapitalize="words"
                      value={displayName}
                      onChangeText={setDisplayName}
                    />
                  ) : null}
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={AUTH.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={AUTH.muted}
                    secureTextEntry
                    textContentType={isSignUp ? "newPassword" : "password"}
                    autoComplete={isSignUp ? "password-new" : "password"}
                    value={password}
                    onChangeText={setPassword}
                  />

                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  {info ? <Text style={styles.info}>{info}</Text> : null}

                  <Pressable
                    onPress={() => void submit()}
                    disabled={busy}
                    style={({ pressed }) => [
                      styles.cta,
                      (busy || pressed) && styles.ctaPressed,
                    ]}
                  >
                    <Text style={styles.ctaLabel}>
                      {busy ? "…" : isSignUp ? "Create account" : "Sign in"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setMode((m) => (m === "signUp" ? "signIn" : "signUp"));
                      setAwaitingEmailConfirm(false);
                      setError(null);
                      setInfo(null);
                    }}
                    style={styles.switch}
                  >
                    <Text style={styles.switchText}>
                      {isSignUp
                        ? "Already have an account? Sign in"
                        : "New here? Create an account"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH.cream,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  hero: {
    paddingTop: 20,
    paddingBottom: 8,
    overflow: "visible",
  },
  fan: {
    height: 168,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  fanItem: {
    position: "absolute",
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroCopy: {
    alignItems: "center",
    paddingHorizontal: 28,
    marginTop: 20,
    paddingTop: 6,
    zIndex: 2,
    overflow: "visible",
  },
  wordmark: {
    fontFamily: typography.display,
    fontSize: 44,
    lineHeight: 54,
    paddingTop: 2,
    color: colors.forestDark,
    textAlign: "center",
  },
  tagline: {
    marginTop: -4,
    maxWidth: 280,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 20,
    color: AUTH.muted,
    textAlign: "center",
  },
  formSheet: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
    shadowColor: "#1A1A2E",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  form: {
    gap: 12,
  },
  confirmTitle: {
    fontFamily: typography.bodySemibold,
    fontSize: 20,
    color: AUTH.ink,
    textAlign: "center",
  },
  confirmBody: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: AUTH.muted,
    textAlign: "center",
    marginBottom: 4,
  },
  confirmEmail: {
    fontFamily: typography.bodySemibold,
    color: colors.forestDark,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: typography.body,
    fontSize: 16,
    color: AUTH.ink,
  },
  cta: {
    marginTop: 4,
    backgroundColor: colors.forest,
    borderRadius: radii.full,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaLabel: {
    fontFamily: typography.bodySemibold,
    fontSize: 16,
    color: colors.white,
  },
  switch: {
    alignItems: "center",
    paddingVertical: 10,
  },
  switchText: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.forest,
  },
  error: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.heart,
  },
  info: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.forestDark,
  },
});
