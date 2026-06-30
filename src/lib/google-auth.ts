import { supabase } from "@/integrations/supabase/client";

export function authCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
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
