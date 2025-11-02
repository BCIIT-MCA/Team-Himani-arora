import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthResult = {
  success: boolean;
  error?: string;
};

const ADMIN_ROLES = ["admin", "super_admin"];

const buildSiteOrigin = () => {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return import.meta.env.VITE_SITE_URL ?? "";
};

const buildRedirectUrl = (path = "/auth") => {
  const origin = buildSiteOrigin();
  if (!origin) return undefined;
  return `${origin}${path}`;
};

const anonymousCredentials = () => {
  const email = import.meta.env.VITE_ANON_USER_EMAIL as string | undefined;
  const password = import.meta.env.VITE_ANON_USER_PASSWORD as
    | string
    | undefined;
  if (!email || !password) {
    return null;
  }
  return { email, password };
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const anonCreds = useMemo(() => anonymousCredentials(), []);

  const handleProfileUpdate = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const role = (data as { role?: string | null } | null)?.role ?? null;
      setUserRole(role);
      setIsAdmin(role ? ADMIN_ROLES.includes(role) : false);
    } catch (profileError) {
      console.warn("Failed to load user profile role:", profileError);
      setUserRole(null);
      setIsAdmin(false);
    }
  }, []);

  const applySession = useCallback(
    (nextSession: Session | null) => {
      setSession(nextSession);
      const authUser = nextSession?.user ?? null;
      setUser(authUser);
      if (authUser) {
        void handleProfileUpdate(authUser.id);
      } else {
        setUserRole(null);
        setIsAdmin(false);
      }
    },
    [handleProfileUpdate]
  );

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("Error retrieving session:", error);
        }

        applySession(initialSession ?? null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      if (!isMounted) return;
      applySession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<AuthResult> => {
      setSignUpLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: buildRedirectUrl("/auth"),
            data: {
              display_name: displayName || "Anonymous User",
            },
          },
        });

        if (error) {
          throw error;
        }

        return {
          success: true,
        };
      } catch (error: any) {
        return {
          success: false,
          error:
            error?.message ??
            "We couldn't create your account. Please try again.",
        };
      } finally {
        setSignUpLoading(false);
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setSignInLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          await handleProfileUpdate(data.user.id);
        }

        return {
          success: true,
        };
      } catch (error: any) {
        return {
          success: false,
          error:
            error?.message ??
            "We couldn't sign you in. Please double-check your credentials.",
        };
      } finally {
        setSignInLoading(false);
      }
    },
    [handleProfileUpdate]
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setSignInLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildRedirectUrl("/auth"),
          queryParams: {
            prompt: "consent",
            access_type: "offline",
          },
        },
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message ?? "Google sign-in failed. Please try again.",
      };
    } finally {
      setSignInLoading(false);
    }
  }, []);

  const signInAnonymously = useCallback(
    async (captchaToken?: string | null): Promise<AuthResult> => {
      if (!anonCreds) {
        return {
          success: false,
          error:
            "Anonymous access isn't configured yet. Please set VITE_ANON_USER_EMAIL and VITE_ANON_USER_PASSWORD in your environment.",
        };
      }

      setSignInLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: anonCreds.email,
          password: anonCreds.password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          await handleProfileUpdate(data.user.id);
        }

        return {
          success: true,
        };
      } catch (error: any) {
        return {
          success: false,
          error:
            error?.message ??
            "Anonymous sign-in is currently unavailable. Please try again later.",
        };
      } finally {
        setSignInLoading(false);
      }
    },
    [anonCreds, handleProfileUpdate]
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsAdmin(false);
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message ?? "Sign-out failed. Please try again.",
      };
    }
  }, []);

  return {
    user,
    session,
    loading,
    signInLoading,
    signUpLoading,
    userRole,
    isAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signInAnonymously,
    signOut,
  };
};
