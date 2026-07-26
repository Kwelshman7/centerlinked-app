import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { socialPreviewPlugin } from "./vite-plugin-social-preview";
import { emailApiPlugin } from "./vite-plugin-email-api";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE || env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.RESEND_API_KEY = env.RESEND_API_KEY;
  process.env.ADMIN_NOTIFY_EMAIL = env.ADMIN_NOTIFY_EMAIL || "admin@centerlinked.com";
  process.env.EMAIL_FROM = env.EMAIL_FROM || "CenterLinked <Admin@centerlinked.com>";
  process.env.SITE_URL = env.SITE_URL || "http://localhost:8080";

  return {
    server: {
      host: "::",
      port: Number(process.env.PORT) || 8080,
      strictPort: true,
    },
    plugins: [react(), socialPreviewPlugin(), emailApiPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
