// Replaced Lovable cloud auth with native Supabase OAuth
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft", opts?: SignInOptions) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google" | "apple",
        options: {
          redirectTo: opts?.redirect_uri ?? `${window.location.origin}/app`,
        },
      });
      if (error) return { error, redirected: false };
      return { error: null, redirected: true };
    },
  },
};
