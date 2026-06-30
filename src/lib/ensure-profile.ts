import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export async function ensureProfile(user: User): Promise<void> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return;

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
  }
}
