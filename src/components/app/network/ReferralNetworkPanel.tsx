import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, ExternalLink, Trash2, Star } from "lucide-react";
import { useReferralNetwork } from "@/hooks/useReferralNetwork";
import { AddPartnerOrgDialog } from "./AddPartnerOrgDialog";
import { GetInTouchSheet } from "@/components/public/GetInTouchSheet";
import { toast } from "sonner";

export function ReferralNetworkPanel() {
  const { partners, partnerOrgIds, addPartner, removePartner } = useReferralNetwork();

  const handleRemove = async (rowId: string, name: string) => {
    const { error } = await removePartner(rowId);
    if (error) toast.error(error);
    else toast.success(`${name} removed`);
  };

  return (
    <Card className="border-border/60">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" /> Your Referral Network
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Preferred partner organizations — only you can see this</p>
        </div>
        <AddPartnerOrgDialog excludeIds={partnerOrgIds} onAdd={addPartner} />
      </div>
      <div className="px-5 pb-5">
        {partners.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">No partner organizations yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add orgs you trust — they'll show "Preferred" in your searches.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {partners.map((p) => (
              <li key={p.rowId} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                <div className="h-10 w-10 rounded-lg border bg-white grid place-items-center overflow-hidden shrink-0">
                  {p.logo_url ? <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain p-1" /> : <Building2 className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{[p.hq_city, p.hq_state].filter(Boolean).join(", ") || "—"}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <GetInTouchSheet
                    orgName={p.name}
                    contactName={p.bd_contact_name}
                    phone={p.bd_contact_phone}
                    email={p.bd_contact_email}
                    triggerLabel="Contact"
                  />
                  {p.slug && (
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/o/${p.slug}`} target="_blank" rel="noreferrer" aria-label="View org page">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(p.rowId, p.name)} aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
