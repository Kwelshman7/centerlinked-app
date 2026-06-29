import { supabase } from "@/integrations/supabase/client";

export type VerificationTier = "fresh" | "recent" | "stale" | "frozen" | "never";

export interface VerificationState {
  tier: VerificationTier;
  label: string;
  daysAgo: number | null;
}

// Monthly cadence: fresh ≤30d, recent 31-60d, stale 61-90d, frozen >90d (server-flipped)
export function verificationState(
  verifiedAt: string | null | undefined,
  frozen: boolean | null | undefined,
): VerificationState {
  if (frozen) return { tier: "frozen", label: "Frozen — needs verification", daysAgo: null };
  if (!verifiedAt) return { tier: "never", label: "Not yet verified", daysAgo: null };
  const days = Math.floor((Date.now() - new Date(verifiedAt).getTime()) / 86_400_000);
  if (days <= 30) return { tier: "fresh", label: "Verified this month", daysAgo: days };
  if (days <= 60) return { tier: "recent", label: `Verified ${days}d ago`, daysAgo: days };
  return { tier: "stale", label: "Needs confirmation", daysAgo: days };
}

export async function stampVerified(facilityId: string, userId: string) {
  return supabase
    .from("facilities")
    .update({
      contracts_verified_at: new Date().toISOString(),
      contracts_verified_by: userId,
      verification_frozen: false,
    })
    .eq("id", facilityId);
}
