import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BdProfileView, type ProfileFacility } from "@/components/app/BdProfileView";
import {
  asProfessionalProfile,
  asSharedProfessionalConnections,
  bdProfileMetrics,
  connectShareUrl,
  locationLine,
  type ProfessionalProfileData,
  type SharedProfessionalConnections,
} from "@/lib/professional-network";
import { useProfessionalNetwork } from "@/hooks/useProfessionalNetwork";
import { useSavedProfessionals } from "@/hooks/useSavedProfessionals";
import { isPartnerVisibleFacility } from "@/lib/facility-visibility";

export default function ProfessionalProfile() {
  const { userId, contactId } = useParams<{ userId?: string; contactId?: string }>();
  const { user } = useAuth();
  const { requestConnection, respondToRequest, reload } = useProfessionalNetwork();
  const { isSaved, toggle: toggleSaved, busyId: saveBusyId } = useSavedProfessionals();
  const [profile, setProfile] = useState<ProfessionalProfileData | null>(null);
  const [facilities, setFacilities] = useState<ProfileFacility[]>([]);
  const [shared, setShared] = useState<SharedProfessionalConnections>({ count: 0, people: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const target = parseProfileTarget(userId, contactId);
    if (!target) {
      setProfile(null);
      setFacilities([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const loaded =
      target.kind === "user"
        ? await loadUserProfile(target.id)
        : target.kind === "rep"
          ? await loadRepProfile(target.id)
          : await loadFacilityContactProfile(target.id);

    if (!loaded) {
      setProfile(null);
      setFacilities([]);
      setLoading(false);
      return;
    }

    const orgId = loaded.profile.organization?.id ?? null;
    const orgFacilities = orgId ? await loadOrgFacilities(orgId, loaded.profile.facilities) : loaded.profile.facilities;
    setProfile({ ...loaded.profile, facilities: orgFacilities });
    setFacilities(orgFacilities);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [userId, contactId]);

  const metrics = useMemo(() => (profile ? bdProfileMetrics(profile) : null), [profile]);
  const payers = useMemo(() => {
    if (!profile) return [];
    return Array.from(new Set(profile.facilities.flatMap((facility) => facility.payers))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [profile]);
  useEffect(() => {
    const subjectId = profile?.user_id;
    if (!subjectId || !user?.id || subjectId === user.id) {
      setShared({ count: 0, people: [] });
      return;
    }
    let cancelled = false;
    void supabase.rpc("list_shared_professional_connections", { _user_id: subjectId }).then(({ data }) => {
      if (cancelled) return;
      setShared(asSharedProfessionalConnections(data));
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.user_id, user?.id]);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg space-y-3 py-16 text-center">
        <p className="font-semibold">Professional not found</p>
        <Link to="/app/contacts" className="text-sm text-primary hover:underline">
          Back to Contacts
        </Link>
      </div>
    );
  }

  const isSelf = Boolean(profile.user_id) && (profile.connection_status === "self" || user?.id === profile.user_id);
  const canConnect = Boolean(profile.user_id) && !isSelf;
  const canSave = Boolean(profile.user_id) && !isSelf;
  const connect = async () => {
    setBusy(true);
    const { error } = await requestConnection(profile.user_id);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Connection request sent");
      await load();
      await reload();
    }
  };

  const accept = async () => {
    if (!profile.connection_id) return;
    setBusy(true);
    const { error } = await respondToRequest(profile.connection_id, true);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Connected");
      await load();
      await reload();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(connectShareUrl(window.location.origin, profile.user_id));
      toast.success("Connect link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const save = async () => {
    if (!profile.user_id) return;
    const { error, saved } = await toggleSaved(profile.user_id);
    if (error) toast.error(error);
    else toast.success(saved ? "Saved to Contacts" : "Removed from Saved");
  };

  return (
    <BdProfileView
      profile={profile}
      facilities={facilities}
      payers={payers}
      metrics={metrics ?? { facilities: 0, inNetwork: 0 }}
      isSelf={isSelf}
      canConnect={canConnect}
      canSave={canSave}
      saved={isSaved(profile.user_id)}
      saveBusy={saveBusyId === profile.user_id}
      connectBusy={busy}
      shared={shared}
      onConnect={() => void connect()}
      onAccept={() => void accept()}
      onCopyLink={() => void copyLink()}
      onToggleSave={() => void save()}
    />
  );
}

type ProfileTarget =
  | { kind: "user"; id: string }
  | { kind: "rep"; id: string }
  | { kind: "facility"; id: string };

function parseProfileTarget(userId?: string, contactId?: string): ProfileTarget | null {
  if (userId) return { kind: "user", id: userId };
  if (!contactId) return null;
  const raw = decodeURIComponent(contactId);
  if (raw.startsWith("user:")) return { kind: "user", id: raw.slice(5) };
  if (raw.startsWith("rep:")) return { kind: "rep", id: raw.slice(4) };
  if (raw.startsWith("facility:")) return { kind: "facility", id: raw.slice(9) };
  return { kind: "user", id: raw };
}

function emptyProfile(partial: Partial<ProfessionalProfileData> & Pick<ProfessionalProfileData, "user_id">): ProfessionalProfileData {
  return {
    full_name: null,
    job_title: null,
    avatar_url: null,
    phone: null,
    email: null,
    bio: null,
    city: null,
    state: null,
    organization: null,
    connection_status: "none",
    connection_id: null,
    facilities: [],
    years_in_bh: null,
    ...partial,
  };
}

async function loadUserProfile(id: string): Promise<{ profile: ProfessionalProfileData } | null> {
  const { data, error } = await supabase.rpc("get_professional_profile", { _user_id: id });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const next = asProfessionalProfile(data);
  return next ? { profile: next } : null;
}

async function loadRepProfile(id: string): Promise<{ profile: ProfessionalProfileData } | null> {
  const { data, error } = await supabase
    .from("bd_representatives")
    .select("id,user_id,full_name,title,email,phone,avatar_url,organization_id,organization_name,states_covered")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  if (data.user_id) return loadUserProfile(data.user_id);

  let organization = null;
  if (data.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("id,name,slug,logo_url,hq_city,hq_state,verified")
      .eq("id", data.organization_id)
      .maybeSingle();
    if (org) {
      organization = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo_url: org.logo_url,
        hq_city: org.hq_city,
        hq_state: org.hq_state,
        verified: org.verified,
      };
    }
  } else if (data.organization_name) {
    organization = {
      id: data.organization_id || data.id,
      name: data.organization_name,
      slug: null,
      logo_url: null,
    };
  }

  const state = Array.isArray(data.states_covered) ? data.states_covered.find(Boolean) ?? null : null;
  return {
    profile: emptyProfile({
      user_id: "",
      full_name: data.full_name,
      job_title: data.title,
      avatar_url: data.avatar_url,
      phone: data.phone,
      email: data.email,
      state,
      organization,
    }),
  };
}

async function loadFacilityContactProfile(id: string): Promise<{ profile: ProfessionalProfileData } | null> {
  const { data, error } = await supabase
    .from("facilities")
    .select(
      "id,name,city,state,bd_contact_name,bd_contact_phone,bd_contact_email,bd_contact_title,organization_id,organizations(id,name,slug,logo_url,hq_city,hq_state,verified)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const orgRow = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  const organization = orgRow
    ? {
        id: orgRow.id,
        name: orgRow.name,
        slug: orgRow.slug,
        logo_url: orgRow.logo_url,
        hq_city: orgRow.hq_city,
        hq_state: orgRow.hq_state,
        verified: orgRow.verified,
      }
    : null;
  return {
    profile: emptyProfile({
      user_id: "",
      full_name: data.bd_contact_name,
      job_title: data.bd_contact_title,
      phone: data.bd_contact_phone,
      email: data.bd_contact_email,
      city: data.city,
      state: data.state,
      organization,
    }),
  };
}

async function loadOrgFacilities(orgId: string, existing: ProfileFacility[]): Promise<ProfileFacility[]> {
  const { data: rows } = await supabase
    .from("facilities")
    .select(
      "id,name,slug,city,state,levels_of_care,image_urls,short_description,tagline,description,verification_status,verification_frozen,hidden_from_org_page",
    )
    .eq("organization_id", orgId)
    .eq("verification_status", "approved");
  const visible = (rows ?? []).filter((row) =>
    isPartnerVisibleFacility(row, { honorHiddenFromOrgPage: true }),
  );
  const ids = visible.map((row) => row.id);
  const payersByFacility = new Map<string, string[]>();
  if (ids.length) {
    const { data: contracts } = await supabase
      .from("insurance_contracts")
      .select("facility_id,payer_name,in_network")
      .in("facility_id", ids)
      .eq("in_network", true);
    for (const row of contracts ?? []) {
      const name = row.payer_name?.trim();
      if (!name) continue;
      const list = payersByFacility.get(row.facility_id) ?? [];
      if (!list.some((item) => item.toLowerCase() === name.toLowerCase())) list.push(name);
      payersByFacility.set(row.facility_id, list);
    }
  }
  const byId = new Map(existing.map((facility) => [facility.id, facility]));
  const merged = visible.map((row) => {
    const prev = byId.get(row.id);
    const fromContracts = payersByFacility.get(row.id) ?? [];
    const payers = fromContracts.length ? fromContracts : prev?.payers ?? [];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      city: row.city,
      state: row.state,
      levels_of_care: row.levels_of_care ?? prev?.levels_of_care ?? [],
      payers,
      image_urls: Array.isArray(row.image_urls) ? row.image_urls : prev?.image_urls,
      short_description: row.short_description ?? prev?.short_description ?? null,
      tagline: row.tagline ?? prev?.tagline ?? null,
      description: row.description ?? prev?.description ?? null,
    } satisfies ProfileFacility;
  });
  merged.sort((a, b) => {
    const loc = (locationLine(a.city, a.state) || "").localeCompare(locationLine(b.city, b.state) || "");
    if (loc !== 0) return loc;
    return a.name.localeCompare(b.name);
  });
  return merged;
}
