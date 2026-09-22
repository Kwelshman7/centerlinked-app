import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fullNameFromAuthUser } from "@/lib/auth-user";

export type EnsureProfileResult =
  | { ok: true }
  | { ok: false; error: string };

const ENSURE_PROFILE_TIMEOUT_MS = 12_000;

async function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ENSURE_PROFILE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function ensureProfile(user: User): Promise<EnsureProfileResult> {
  let existing: { id: string; full_name: string | null } | null = null;
  try {
    const { data, error: existingError } = await withTimeout(
      supabase.from("profiles").select("id, full_name").eq("user_id", user.id).maybeSingle(),
      "Could not load your profile",
    );
    if (existingError) {
      console.warn("Could not load profile:", existingError.message);
      return { ok: false, error: "Could not load your profile" };
    }
    existing = data as { id: string; full_name: string | null } | null;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not load your profile" };
  }

  const fullName = fullNameFromAuthUser(user);

  if (existing) {
    if (fullName && !existing.full_name?.trim()) {
      try {
        const { error } = await withTimeout(
          supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id),
          "Could not save your profile name",
        );
        if (error) console.warn("Could not save profile name:", error.message);
      } catch (err) {
        console.warn("Could not save profile name:", err instanceof Error ? err.message : err);
      }
    }
    return { ok: true };
  }

  try {
    const { error } = await withTimeout(
      supabase.from("profiles").insert({
        user_id: user.id,
        email: user.email ?? null,
        full_name: fullName,
      }),
      "Could not create your profile",
    );
    if (error && !/duplicate|unique/i.test(error.message)) {
      console.warn("Could not create profile:", error.message);
      return { ok: false, error: "Could not create your profile" };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create your profile" };
  }

  return { ok: true };
}
