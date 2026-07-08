import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Server-side check via bootstrap_admin_emails (no client env exposure). */
export async function checkBootstrapAdminCandidate(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_bootstrap_admin_candidate");
  if (error) {
    console.warn("is_bootstrap_admin_candidate:", error.message);
    return false;
  }
  return !!data;
}

/** Grants super_admin when the signed-in email is in bootstrap_admin_emails. */
export async function bootstrapSuperAdmin(_user: User): Promise<boolean> {
  const { data, error } = await supabase.rpc("bootstrap_super_admin");
  if (error) {
    console.warn("bootstrap_super_admin:", error.message);
    return false;
  }
  return !!data;
}
