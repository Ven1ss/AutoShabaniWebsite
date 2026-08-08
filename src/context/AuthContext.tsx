"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  isAdmin?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  /** Send a magic-link email */
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  /** @deprecated use signInWithEmail */
  login: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: User, isAdmin = false): AuthUser {
  const metaName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined);
  return {
    id: user.id,
    email: user.email ?? undefined,
    name:
      metaName ||
      user.email?.split("@")[0] ||
      "User",
    isAdmin,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function syncSession(session: Session | null) {
      if (!session?.user) {
        if (!cancelled) setUser(null);
        return;
      }

      let isAdmin = false;
      try {
        const { data } = await supabase!
          .from("profiles")
          .select("is_admin, display_name")
          .eq("id", session.user.id)
          .maybeSingle();
        isAdmin = Boolean(data?.is_admin);
        if (!cancelled) {
          const mapped = mapUser(session.user, isAdmin);
          if (data?.display_name) mapped.name = data.display_name;
          setUser(mapped);
        }
      } catch {
        if (!cancelled) setUser(mapUser(session.user));
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      syncSession(data.session).finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return { error: "Auth is not configured." };

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    return error ? { error: error.message } : {};
  }, []);

  const logout = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase?.auth.signOut();
    setUser(null);
  }, []);

  const login = useCallback((next: AuthUser) => {
    setUser(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      loading,
      signInWithEmail,
      logout,
      login,
    }),
    [user, loading, signInWithEmail, logout, login]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
