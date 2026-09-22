import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapSuperAdmin, checkBootstrapAdminCandidate } from "@/lib/bootstrap-admin";
import { emailAuthGate, EMAIL_AUTH_UNAVAILABLE_SIGNED_IN_MESSAGE, PERSONAL_EMAIL_BLOCKED_MESSAGE } from "@/lib/email-domains";
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
      const bootstrapCandidate = await checkBootstrapAdminCandidate();
      if (!stillCurrent()) return;

      // Join/Login already fail-closed on the work-email gate. Do not hold
      // first paint here — sign out in the background if the server blocks.
      if (email && !bootstrapCandidate) {
        const gateGen = gen;
        void emailAuthGate(email).then(async (emailGate) => {
          if (loadGen.current !== gateGen) return;
          if (emailGate === "blocked") {
            toast.error(PERSONAL_EMAIL_BLOCKED_MESSAGE.title, {
              description: PERSONAL_EMAIL_BLOCKED_MESSAGE.description,
            });
            await supabase.auth.signOut();
            if (loadGen.current !== gateGen) return;
            setProfile(null);
            setRoles([]);
            setOrgFacilityAdmin(false);
            setIsBootstrapAdmin(false);
            return;
          }
          if (emailGate === "unavailable") {
            toast.error(EMAIL_AUTH_UNAVAILABLE_SIGNED_IN_MESSAGE.title, {
              description: EMAIL_AUTH_UNAVAILABLE_SIGNED_IN_MESSAGE.description,
            });
          }
        });
      }

      const profileReady = await ensureProfile(authUser);
      if (!stillCurrent()) return;
      if (!profileReady.ok) {
        toast.error("Account setup incomplete", {
          description: profileReady.error,
        });
      }

      const bootstrapped = bootstrapCandidate ? await bootstrapSuperAdmin(authUser) : false;
      if (!stillCurrent()) return;
      setIsBootstrapAdmin(bootstrapCandidate);

      // Do not block first paint on invite claim. Join/Login/Setup still await
      // it; a hung RPC must not keep Search/Members behind the auth spinner.
      const claimGen = gen;
      void claimPendingOrgInvite()
        .then(async (claimed) => {
          if (!claimed.joined || loadGen.current !== claimGen) return;
          const { data: linked } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", authUser.id)
            .maybeSingle();
          if (loadGen.current !== claimGen) return;
          const fromDb = (linked as Profile | null) ?? null;
          const organizationId = fromDb?.organization_id || claimed.organization_id || null;
          if (!organizationId) return;
          // Never write a profile that is missing organization_id — that
          // wiped a membership recover and hid Members / Add Facility.
          setProfile((current) => {
            const base = fromDb ?? current;
            if (!base) return current;
            return { ...base, organization_id: base.organization_id || organizationId };
          });
          const { data: isAdmin } = await supabase.rpc("is_org_facility_admin", {
            _org_id: organizationId,
            _user_id: authUser.id,
          });
          if (loadGen.current !== claimGen || !isAdmin) return;
          setOrgFacilityAdmin(true);
        })
        .catch((inviteError) => {
          console.warn(
            "claimPendingOrgInvite failed:",
            inviteError instanceof Error ? inviteError.message : inviteError,
          );
        });

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
      let loadedProfile = (prof as Profile) ?? null;
      if (loadedProfile && !loadedProfile.organization_id) {
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", authUser.id)
          .limit(1)
          .maybeSingle();
        if (!stillCurrent()) return;
        if (membership?.organization_id) {
          loadedProfile = { ...loadedProfile, organization_id: membership.organization_id };
        }
      }
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
      setProfile((current) => {
        if (
          loadedProfile &&
          !loadedProfile.organization_id &&
          current?.organization_id &&
          current.user_id === loadedProfile.user_id
        ) {
          return { ...loadedProfile, organization_id: current.organization_id };
        }
        return loadedProfile;
      });
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

  const refresh = useCallback(async () => {
    if (!user) return;
    // Bust in-flight reuse so a load started before an org/invite write
    // cannot win and leave organization_id stale.
    inFlight.current = null;
    await loadProfileAndRoles(user);
  }, [user]);

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
