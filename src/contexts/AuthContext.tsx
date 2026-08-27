import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapSuperAdmin, checkBootstrapAdminCandidate } from "@/lib/bootstrap-admin";
import { isEmailAuthAllowed, PERSONAL_EMAIL_BLOCKED_MESSAGE } from "@/lib/email-domains";
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
  const [orgFacilityAdmin, setOrgFacilityAdmin] = useState(false);
  const [isBootstrapAdmin, setIsBootstrapAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadGen = useRef(0);
  const inFlight = useRef<{ userId: string; promise: Promise<void> } | null>(null);

  const invalidateLoads = () => {
    loadGen.current += 1;
    inFlight.current = null;
  };

  const loadProfileAndRoles = async (authUser: User) => {
    if (inFlight.current?.userId === authUser.id) return inFlight.current.promise;

    const gen = ++loadGen.current;
    const stillCurrent = () => loadGen.current === gen;

    const promise = (async () => {
      const email = authUser.email?.trim().toLowerCase() || "";
      const [bootstrapCandidate, emailAllowed] = await Promise.all([
        checkBootstrapAdminCandidate(),
        email ? isEmailAuthAllowed(email) : Promise.resolve(false),
      ]);
      if (!stillCurrent()) return;

      if (email && !bootstrapCandidate && !emailAllowed) {
        toast.error(PERSONAL_EMAIL_BLOCKED_MESSAGE.title, {
          description: PERSONAL_EMAIL_BLOCKED_MESSAGE.description,
        });
        await supabase.auth.signOut();
        if (!stillCurrent()) return;
        setProfile(null);
        setRoles([]);
        setOrgFacilityAdmin(false);
        setIsBootstrapAdmin(false);
        return;
      }

      const profileReady = await ensureProfile(authUser);
      if (!stillCurrent()) return;
      if (!profileReady.ok) {
        toast.error("Account setup incomplete", {
          description: profileReady.error,
        });
      }

      const bootstrapped = await bootstrapSuperAdmin(authUser);
      if (!stillCurrent()) return;
      setIsBootstrapAdmin(bootstrapCandidate);

      try {
        await claimPendingOrgInvite();
      } catch (inviteError) {
        console.warn(
          "claimPendingOrgInvite failed:",
          inviteError instanceof Error ? inviteError.message : inviteError,
        );
      }
      if (!stillCurrent()) return;

      const [{ data: prof, error: profError }, { data: rolesData, error: rolesError }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", authUser.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", authUser.id),
        ]);
      if (!stillCurrent()) return;

      if (profError || rolesError) {
        console.warn("profile/roles load failed:", profError?.message || rolesError?.message);
        toast.error("Could not load your account", {
          description: "Refresh the page or sign in again if this continues.",
        });
      }

      let nextRoles = ((rolesData as { role: AppRole }[]) ?? []).map((r) => r.role);
      if (bootstrapped && !nextRoles.includes("super_admin")) {
        const { data: retryRoles } = await supabase.from("user_roles").select("role").eq("user_id", authUser.id);
        if (!stillCurrent()) return;
        nextRoles = ((retryRoles as { role: AppRole }[]) ?? []).map((r) => r.role);
      }
      const loadedProfile = (prof as Profile) ?? null;
      let nextOrgAdmin = nextRoles.includes("super_admin");
      if (!nextOrgAdmin && loadedProfile?.organization_id) {
        const { data: isAdmin } = await supabase.rpc("is_org_facility_admin", {
          _org_id: loadedProfile.organization_id,
          _user_id: authUser.id,
        });
        if (!stillCurrent()) return;
        nextOrgAdmin = Boolean(isAdmin);
      }
      if (!stillCurrent()) return;
      setProfile(loadedProfile);
      setRoles(nextRoles);
      setOrgFacilityAdmin(nextOrgAdmin);
    })().finally(() => {
      if (inFlight.current?.userId === authUser.id && loadGen.current === gen) {
        inFlight.current = null;
      }
    });

    inFlight.current = { userId: authUser.id, promise };
    return promise;
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
        invalidateLoads();
        setProfile(null);
        setRoles([]);
        setOrgFacilityAdmin(false);
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
        isFacilityAdmin: orgFacilityAdmin || isSuperAdmin,
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
