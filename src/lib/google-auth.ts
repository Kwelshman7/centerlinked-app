import { supabase, supabaseConfigured } from "@/integrations/supabase/client";

export function authCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!supabaseConfigured) {
    return { error: "Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env." };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authCallbackUrl(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  return { error: error?.message ?? null };
}
