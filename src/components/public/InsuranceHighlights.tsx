import { HelpCircle, Phone, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractRow } from "@/lib/derive-insurance";

interface Props {
  contracts: ContractRow[];
  brand: string;
  orgName: string;
  phone: string | null;
  email: string | null;
}

export function InsuranceHighlights({ contracts, brand, orgName, phone, email }: Props) {
  const payers = Array.from(
    new Set(contracts.filter((c) => c.in_network).map((c) => c.payer_name.trim()).filter(Boolean)),
  ).sort();

  const display = payers.slice(0, 8);
  const extra = payers.length - display.length;

  return (
    <aside
      className="rounded-2xl p-5 sm:p-6 shadow-md text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${brand}, ${brand}dd 55%, #0f172a)`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-5 w-5" />
        <h3 className="font-heading text-lg font-bold">Insurance Highlights</h3>
      </div>
      {payers.length > 0 ? (
        <>
          <p className="text-sm text-white/85 leading-snug">
            In-network with {payers.length} major {payers.length === 1 ? "payer" : "payers"}.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {display.map((p) => (
              <span
                key={p}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur"
              >
                {p}
              </span>
            ))}
            {extra > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20 border border-white/30">
                +{extra} more
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-white/85 leading-snug">
          Contact the team to verify coverage and benefits.
        </p>
      )}

      <div className="mt-5 pt-5 border-t border-white/15">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-4 w-4" />
          <p className="font-semibold text-sm">Have Questions?</p>
        </div>
        <p className="text-xs text-white/80 leading-snug">
          Our team is here to help with referrals and program information.
        </p>
        <div className="mt-3 space-y-2">
          {phone && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white justify-start"
            >
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
            </Button>
          )}
          {email && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white justify-start"
            >
              <a href={`mailto:${email}`}>
                <Mail className="h-3.5 w-3.5" /> Email Our Team
              </a>
            </Button>
          )}
          {!phone && !email && (
            <p className="text-xs text-white/70">Reach {orgName} via the Contact section below.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
