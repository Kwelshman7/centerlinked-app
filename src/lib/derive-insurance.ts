// Derive a single, friendly insurance-status label per facility.
// Used on the org page facility cards instead of raw "0 in-network contracts".

export interface ContractRow {
  facility_id: string;
  payer_name: string;
  in_network: boolean;
}

export type InsuranceTone = "in-network" | "out-of-network" | "verify" | "neutral";

export interface InsuranceBadge {
  label: string;
  tone: InsuranceTone;
}

export function deriveInsuranceBadge(
  facilityId: string,
  contracts: ContractRow[],
  opts: {
    /** Optional admin override; if set, used verbatim with neutral tone. */
    statusOverride?: string | null;
    /** Featured payer to prefer in the badge text when in-network. */
    featuredPayer?: string | null;
  } = {},
): InsuranceBadge {
  if (opts.statusOverride && opts.statusOverride.trim()) {
    const v = opts.statusOverride.trim();
    const lc = v.toLowerCase();
    const tone: InsuranceTone =
      lc.includes("in-network") || lc.includes("in network")
        ? "in-network"
        : lc.includes("out")
          ? "out-of-network"
          : lc.includes("verif")
            ? "verify"
            : "neutral";
    return { label: v, tone };
  }

  const mine = contracts.filter((c) => c.facility_id === facilityId);
  const inNet = mine.filter((c) => c.in_network);

  if (inNet.length > 0) {
    const featured =
      opts.featuredPayer &&
      inNet.find((c) => c.payer_name.toLowerCase() === opts.featuredPayer!.toLowerCase());
    if (featured) {
      return { label: `In-Network with ${featured.payer_name}`, tone: "in-network" };
    }
    if (inNet.length === 1) {
      return { label: `In-Network with ${inNet[0].payer_name}`, tone: "in-network" };
    }
    return { label: `In-Network with ${inNet[0].payer_name} +${inNet.length - 1}`, tone: "in-network" };
  }
  if (mine.length > 0) {
    return { label: "Out-of-Network", tone: "out-of-network" };
  }
  return { label: "Insurance Verification Required", tone: "verify" };
}

export function insuranceBadgeClasses(tone: InsuranceTone): string {
  switch (tone) {
    case "in-network":
      return "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800";
    case "out-of-network":
      return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
    case "verify":
      return "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
  }
}
