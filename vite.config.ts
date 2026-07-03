import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { socialPreviewPlugin } from "./vite-plugin-social-preview";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

  return {
    server: {
      host: "::",
      port: Number(process.env.PORT) || 8080,
    },
    plugins: [react(), socialPreviewPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
