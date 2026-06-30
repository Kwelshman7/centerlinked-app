import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function bootstrapEmails(): string[] {
  const raw = import.meta.env.VITE_BOOTSTRAP_SUPER_ADMIN_EMAILS as string | undefined;
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isBootstrapAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return bootstrapEmails().includes(email.trim().toLowerCase());
}

/** Grants super_admin when the signed-in email is in VITE_BOOTSTRAP_SUPER_ADMIN_EMAILS and DB bootstrap is configured. */
export async function bootstrapSuperAdmin(user: User): Promise<boolean> {
  if (!isBootstrapAdminEmail(user.email)) return false;

  const { data, error } = await supabase.rpc("bootstrap_super_admin");
  if (error) {
    console.warn("bootstrap_super_admin:", error.message);
    return false;
  }
  return !!data;
}
