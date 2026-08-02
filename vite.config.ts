import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { socialPreviewPlugin } from "./vite-plugin-social-preview";
import { emailApiPlugin } from "./vite-plugin-email-api";
import { stripeApiPlugin } from "./vite-plugin-stripe-api";
import { authHookPlugin } from "./vite-plugin-auth-hook";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.VITE_SUPABASE_SERVICE_ROLE) {
    throw new Error(
      "VITE_SUPABASE_SERVICE_ROLE is forbidden: VITE_* values are exposed to browser bundles. Use SUPABASE_SERVICE_ROLE instead.",
    );
  }
  process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE || env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.RESEND_API_KEY = env.RESEND_API_KEY;
  process.env.ADMIN_NOTIFY_EMAIL = env.ADMIN_NOTIFY_EMAIL || "admin@centerlinked.com";
  process.env.EMAIL_FROM = env.EMAIL_FROM || "CenterLinked <Admin@centerlinked.com>";
  process.env.SITE_URL = env.SITE_URL || "http://localhost:8080";
  process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_PRICE_MEMBERSHIP = env.STRIPE_PRICE_MEMBERSHIP;
  process.env.STRIPE_PRICE_SETUP = env.STRIPE_PRICE_SETUP;
  process.env.BEFORE_USER_CREATED_HOOK_SECRET = env.BEFORE_USER_CREATED_HOOK_SECRET;

  return {
    server: {
      host: "::",
      port: Number(process.env.PORT) || 8080,
      strictPort: true,
    },
    plugins: [react(), socialPreviewPlugin(), emailApiPlugin(), stripeApiPlugin(), authHookPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
