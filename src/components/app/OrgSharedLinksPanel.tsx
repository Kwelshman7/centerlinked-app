import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink, Link2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { orgDisplayPath, orgPublicPath, programDisplayPath, programPublicPath } from "@/lib/public-urls";

interface FacilityLink {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
}

interface Props {
  organizationId: string;
  orgName: string;
  orgSlug: string | null;
}

export function OrgSharedLinksPanel({ organizationId, orgName, orgSlug }: Props) {
  const [facilities, setFacilities] = useState<FacilityLink[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("facilities")
        .select("id,name,slug,city,state,verification_status")
        .eq("organization_id", organizationId)
        .order("name");
      setFacilities((data as FacilityLink[]) ?? []);
    })();
  }, [organizationId]);

  const copy = async (key: string, url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success(`${label} copied`);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.centerlinked.com";
  const orgUrl = orgSlug ? `${origin}${orgPublicPath(orgSlug)}` : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-heading text-xl font-bold flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" /> Shared links
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Copy these URLs for {orgName}. Org links use branded preview cards with your logo.
        </p>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Organization page</p>
            <p className="font-semibold mt-1">{orgName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {orgSlug ? orgDisplayPath(orgSlug) : "No slug — set in Branding tab"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {orgUrl && (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to={orgPublicPath(orgSlug!)} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy("org", orgUrl, "Organization link")}
                >
                  {copiedKey === "org" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Program sheets ({facilities.length})
        </p>
        {facilities.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No facilities yet. Add programs in the Facilities tab.
          </Card>
        ) : (
          facilities.map((f) => {
            const path = f.slug ? programPublicPath(f.slug, orgSlug) : null;
            const url = path ? `${origin}${path}` : null;
            const display = f.slug ? programDisplayPath(f.slug, orgSlug) : null;
            const key = f.id;
            return (
              <Card key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{f.name}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {f.verification_status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {[f.city, f.state].filter(Boolean).join(", ") || "No location"}
                  </p>
                  {display ? (
                    <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{display}</p>
                  ) : (
                    <p className="text-xs text-amber-700 mt-1">Missing slug — open facility to generate link</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {url ? (
                    <>
                      <Button asChild size="sm" variant="ghost">
                        <Link to={path!} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copy(key, url, f.name)}
                      >
                        {copiedKey === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        Copy
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/app/facilities/${f.id}`}>Edit</Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/app/facilities/${f.id}`}>Generate link</Link>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
