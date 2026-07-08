import { supabase } from "@/integrations/supabase/client";
import type { PayerMatchInput } from "@/lib/match-payer";

export async function loadApprovedPayers(): Promise<PayerMatchInput[]> {
  const { data, error } = await supabase
    .from("payers")
    .select("id,name,aliases,active")
    .eq("status", "approved");
  if (error) throw error;
  return ((data ?? []) as Array<PayerMatchInput & { active?: boolean | null }>).filter(
    (p) => p.active !== false,
  );
}
