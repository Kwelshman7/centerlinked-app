import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Mail, Phone, Share2, MapPin, MessageSquare, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectButton } from "@/components/app/network/ConnectButton";
import { orgPublicPath, programPublicPath } from "@/lib/public-urls";
import { sanitizePhone, formatPhoneDisplay } from "@/lib/phone";
import {
  asProfessionalProfile,
  connectShareUrl,
  initialsFromName,
  locationLine,
  type ProfessionalProfileData,
} from "@/lib/professional-network";
import { useProfessionalNetwork } from "@/hooks/useProfessionalNetwork";

export default function ProfessionalProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { requestConnection, respondToRequest, reload } = useProfessionalNetwork();
  const [profile, setProfile] = useState<ProfessionalProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_professional_profile", { _user_id: userId });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      setProfile(null);
      return;
    }
    setProfile(asProfessionalProfile(data));
  };

  useEffect(() => {
    void load();
  }, [userId]);

  if (loading) {
    return (
      <div className="py-20 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-2">
        <p className="font-semibold">Professional not found</p>
        <Link to="/app/network" className="text-sm text-primary hover:underline">
          Back to Network
        </Link>
      </div>
    );
  }

  const name = profile.full_name || "CenterLinked professional";
  const place = locationLine(profile.city || profile.organization?.hq_city, profile.state || profile.organization?.hq_state);
  const tel = sanitizePhone(profile.phone);
  const payers = Array.from(new Set(profile.facilities.flatMap((facility) => facility.payers))).sort((a, b) =>
    a.localeCompare(b),
  );

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

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to="/app/network" className="text-sm text-primary hover:underline">
        Back to Network
      </Link>

      <Card className="p-5 sm:p-6 space-y-5 overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary overflow-hidden grid place-items-center text-lg font-semibold shrink-0 ring-1 ring-primary/10">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initialsFromName(name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold leading-tight">{name}</h1>
            {profile.job_title ? <p className="text-sm text-muted-foreground mt-0.5">{profile.job_title}</p> : null}
            {profile.organization ? (
              <p className="text-sm mt-1">
                {profile.organization.slug ? (
                  <Link to={orgPublicPath(profile.organization.slug)} className="font-medium text-primary hover:underline">
                    {profile.organization.name}
                  </Link>
                ) : (
                  <span className="font-medium">{profile.organization.name}</span>
                )}
              </p>
            ) : null}
            {place ? (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {place}
              </p>
            ) : null}
          </div>
        </div>

        {profile.bio ? <p className="text-sm leading-relaxed">{profile.bio}</p> : null}

        <div className="flex flex-wrap gap-2">
          {profile.connection_status !== "self" ? (
            <ConnectButton
              status={profile.connection_status}
              busy={busy}
              onConnect={connect}
              onAccept={accept}
            />
          ) : (
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
          {user?.id === profile.user_id ? null : (
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Share2 className="h-4 w-4" />
              Copy link
            </Button>
          )}
          {tel ? (
            <>
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${tel}`}>
                  <Phone className="h-4 w-4" />
                  {formatPhoneDisplay(profile.phone) || "Call"}
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`sms:${tel}`}>
                  <MessageSquare className="h-4 w-4" />
                  Text
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void copyValue(profile.phone || tel, "Phone")}>
                <Copy className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          {profile.email ? (
            <>
              <Button asChild variant="outline" size="sm">
                <a href={`mailto:${profile.email}`}>
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void copyValue(profile.email || "", "Email")}>
                <Copy className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      </Card>

      {payers.length ? (
        <Card className="p-5 sm:p-6 space-y-3">
          <h2 className="font-heading font-semibold">Insurance</h2>
          <div className="flex flex-wrap gap-2">
            {payers.map((payer) => (
              <span
                key={payer}
                className="rounded-full bg-primary/8 text-foreground px-2.5 py-1 text-xs font-medium ring-1 ring-primary/15"
              >
                {payer}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {profile.facilities.length ? (
        <Card className="p-5 sm:p-6 space-y-3">
          <h2 className="font-heading font-semibold">Programs</h2>
          <div className="divide-y divide-border/60">
            {profile.facilities.map((facility) => (
              <div key={facility.id} className="py-3 first:pt-0 last:pb-0">
                {facility.slug && profile.organization?.slug ? (
                  <Link
                    to={programPublicPath(facility.slug, profile.organization.slug)}
                    className="font-medium text-sm hover:text-primary"
                  >
                    {facility.name}
                  </Link>
                ) : (
                  <p className="font-medium text-sm">{facility.name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {[locationLine(facility.city, facility.state), ...(facility.levels_of_care.slice(0, 3))].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
