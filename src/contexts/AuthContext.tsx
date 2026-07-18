import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapSuperAdmin, checkBootstrapAdminCandidate } from "@/lib/bootstrap-admin";
import { ensureProfile } from "@/lib/ensure-profile";
import { claimPendingOrgInvite } from "@/lib/org-setup";

type AppRole = "super_admin" | "facility_admin" | "bd_rep";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  organization_id: string | null;
  email: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isSuperAdmin: boolean;
  isBootstrapAdmin: boolean;
  needsSuperAdminSetup: boolean;
  isFacilityAdmin: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isBootstrapAdmin, setIsBootstrapAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef<Promise<void> | null>(null);

  const loadProfileAndRoles = async (authUser: User) => {
    if (loadRef.current) return loadRef.current;

    loadRef.current = (async () => {
      await ensureProfile(authUser);
      const [bootstrapped, bootstrapCandidate] = await Promise.all([
        bootstrapSuperAdmin(authUser),
        checkBootstrapAdminCandidate(),
      ]);
      setIsBootstrapAdmin(bootstrapCandidate);

      try {
        await claimPendingOrgInvite();
      } catch {
        // Invite claim is best-effort; setup page retries if needed.
      }

      const [{ data: prof }, { data: rolesData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", authUser.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", authUser.id),
      ]);
      let nextRoles = ((rolesData as { role: AppRole }[]) ?? []).map((r) => r.role);
      if (bootstrapped && !nextRoles.includes("super_admin")) {
        const { data: retryRoles } = await supabase.from("user_roles").select("role").eq("user_id", authUser.id);
        nextRoles = ((retryRoles as { role: AppRole }[]) ?? []).map((r) => r.role);
      }
      setProfile((prof as Profile) ?? null);
      setRoles(nextRoles);
    })().finally(() => {
      loadRef.current = null;
    });

    return loadRef.current;
  };

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadProfileAndRoles(sess.user).finally(() => mounted && setLoading(false));
      } else {
        setProfile(null);
        setRoles([]);
        setIsBootstrapAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refresh = async () => {
    if (user) await loadProfileAndRoles(user);
  };

  const isSuperAdmin = roles.includes("super_admin");
  const needsSuperAdminSetup = isBootstrapAdmin && !isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        isSuperAdmin,
        isBootstrapAdmin,
        needsSuperAdminSetup,
        isFacilityAdmin: roles.includes("facility_admin") || isSuperAdmin,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
