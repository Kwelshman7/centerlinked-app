import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const BOOTSTRAP_RPC_TIMEOUT_MS = 8_000;

async function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), BOOTSTRAP_RPC_TIMEOUT_MS);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** Server-side check via bootstrap_admin_emails (no client env exposure). */
export async function checkBootstrapAdminCandidate(): Promise<boolean> {
  try {
    const { data, error } = await withTimeout(
      supabase.rpc("is_bootstrap_admin_candidate"),
      "is_bootstrap_admin_candidate timed out",
    );
    if (error) {
      console.warn("is_bootstrap_admin_candidate:", error.message);
      return false;
    }
    return !!data;
  } catch (err) {
    console.warn("is_bootstrap_admin_candidate:", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Grants super_admin when the signed-in email is in bootstrap_admin_emails. */
export async function bootstrapSuperAdmin(_user: User): Promise<boolean> {
  try {
    const { data, error } = await withTimeout(
      supabase.rpc("bootstrap_super_admin"),
      "bootstrap_super_admin timed out",
    );
    if (error) {
      console.warn("bootstrap_super_admin:", error.message);
      return false;
    }
    return !!data;
  } catch (err) {
    console.warn("bootstrap_super_admin:", err instanceof Error ? err.message : err);
    return false;
  }
}
