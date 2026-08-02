import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  "";

/**
 * SecureStore has a size limit; fall back to AsyncStorage on web / large values.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Deep link for email confirm / magic-link redirects.
 * Must also be listed under Supabase Auth → URL Configuration → Redirect URLs.
 */
export const AUTH_REDIRECT_URL = "hanchi://auth/callback";

/**
 * Placeholder values keep createClient from throwing when .env is incomplete.
 * AuthScreen gates on isSupabaseConfigured() before real sign-in.
 */
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

/** Parse tokens/code from a Supabase auth redirect deep link. */
export function parseAuthRedirectParams(url: string): Record<string, string> {
  const hash = url.includes("#") ? url.split("#")[1] : "";
  const query = url.includes("?")
    ? (url.split("?")[1] ?? "").split("#")[0]
    : "";
  const raw = hash || query;
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split("&")) {
    const [k, v] = part.split("=");
    if (k && v != null) out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}
