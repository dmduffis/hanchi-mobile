import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const ONBOARDED_KEY = "sinta.hasOnboarded";

export async function getHasOnboarded(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDED_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

export async function setHasOnboarded(value: boolean): Promise<void> {
  try {
    if (value) await AsyncStorage.setItem(ONBOARDED_KEY, "1");
    else await AsyncStorage.removeItem(ONBOARDED_KEY);
  } catch {
    // ignore storage failures
  }
}

/** Load persisted onboarded flag once on launch. */
export function useOnboardingGate(): {
  ready: boolean;
  hasOnboarded: boolean;
  completeOnboarding: () => Promise<void>;
} {
  const [ready, setReady] = useState(false);
  const [hasOnboarded, setHasOnboardedState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const value = await getHasOnboarded();
      if (!cancelled) {
        setHasOnboardedState(value);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await setHasOnboarded(true);
    setHasOnboardedState(true);
  }, []);

  return { ready, hasOnboarded, completeOnboarding };
}
