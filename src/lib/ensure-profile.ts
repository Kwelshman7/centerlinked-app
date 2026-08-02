import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type EnsureProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function ensureProfile(user: User): Promise<EnsureProfileResult> {
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    console.warn("Could not load profile:", existingError.message);
    return { ok: false, error: "Could not load your profile" };
  }

  if (existing) return { ok: true };

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name.trim()
        : null;

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    email: user.email ?? null,
    full_name: fullName || null,
  });

  if (error && !/duplicate|unique/i.test(error.message)) {
    console.warn("Could not create profile:", error.message);
    return { ok: false, error: "Could not create your profile" };
  }

  return { ok: true };
}
