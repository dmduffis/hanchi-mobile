import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Linking } from "react-native";

import { fetchMe, type ApiUser } from "../api/users";
import {
  AUTH_REDIRECT_URL,
  isSupabaseConfigured,
  parseAuthRedirectParams,
  supabase,
} from "../lib/supabase";

type AuthContextValue = {
  ready: boolean;
  /** False while /users/me is loading for the current session. */
  profileReady: boolean;
  session: Session | null;
  user: User | null;
  profile: ApiUser | null;
  /** Last /users/me failure message, when profile is missing. */
  profileError: string | null;
  needsOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  resendSignupEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<ApiUser | null>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profileReady, setProfileReady] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [onboardedOverride, setOnboardedOverride] = useState(false);

  const loadProfile = useCallback(async (active: Session | null) => {
    if (!active?.access_token) {
      setProfile(null);
      setProfileError(null);
      setProfileReady(true);
      return null;
    }
    setProfileReady(false);
    setProfileError(null);
    try {
      const me = await fetchMe();
      setProfile(me);
      setProfileError(null);
      return me;
    } catch (err) {
      setProfile(null);
      setProfileError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading your account.",
      );
      return null;
    } finally {
      setProfileReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setSession(null);
          setReady(true);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (!cancelled) setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        void loadProfile(nextSession);
      },
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const handleAuthRedirect = useCallback(async (url: string) => {
    if (!url.includes("auth/callback") && !url.includes("access_token")) {
      return;
    }
    const params = parseAuthRedirectParams(url);
    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (error) throw error;
      return;
    }
    if (params.access_token && params.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (error) throw error;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const onUrl = ({ url }: { url: string }) => {
      void handleAuthRedirect(url).catch((err) => {
        console.warn("Auth redirect failed", err);
      });
    };

    const sub = Linking.addEventListener("url", onUrl);
    void Linking.getInitialURL().then((url) => {
      if (url) onUrl({ url });
    });

    return () => sub.remove();
  }, [handleAuthRedirect]);

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: AUTH_REDIRECT_URL,
          data: displayName?.trim()
            ? { display_name: displayName.trim() }
            : undefined,
        },
      });
      if (error) throw error;
      // Existing account: Supabase returns a user with no identities and no session.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        throw new Error(
          "An account with this email already exists. Sign in, or use Resend on the confirm screen.",
        );
      }
      return { needsEmailConfirmation: !data.session };
    },
    [],
  );

  const resendSignupEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: AUTH_REDIRECT_URL },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    setOnboardedOverride(false);
    setProfile(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    return loadProfile(session);
  }, [loadProfile, session]);

  const completeOnboarding = useCallback(async () => {
    setOnboardedOverride(true);
    await loadProfile(session);
  }, [loadProfile, session]);

  const needsOnboarding = useMemo(() => {
    if (!session || !profileReady || !profile) return false;
    if (onboardedOverride) return false;
    return (profile.cultures?.length ?? 0) < 1;
  }, [session, profileReady, profile, onboardedOverride]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      profileReady,
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      needsOnboarding,
      signIn,
      signUp,
      resendSignupEmail,
      signOut,
      refreshProfile,
      completeOnboarding,
    }),
    [
      ready,
      profileReady,
      session,
      profile,
      profileError,
      needsOnboarding,
      signIn,
      signUp,
      resendSignupEmail,
      signOut,
      refreshProfile,
      completeOnboarding,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
