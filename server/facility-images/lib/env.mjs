import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        const key = l.slice(0, i);
        const val = l.slice(i + 1).replace(/^["']|["']$/g, "");
        return [key, val];
      }),
  );
}

const env = {
  ...parseEnvFile(path.join(ROOT, ".env")),
  ...parseEnvFile(path.join(ROOT, ".env.local")),
  ...process.env,
};

export const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE =
  env.SUPABASE_SERVICE_ROLE || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE;

export const OPENAI_API_KEY = env.OPENAI_API_KEY;

export const MIN_IMAGES = 4;
export const MAX_IMAGES = 7;
export const COVER_SIZE = { width: 1920, height: 1080 };
export const GALLERY_SIZE = { width: 1200, height: 900 };
export const MAX_BYTES = 5 * 1024 * 1024;

export const WORK_DIR = path.join(ROOT, "server/facility-images/.work");
export const REPORT_DIR = path.join(ROOT, "server/facility-images/reports");
