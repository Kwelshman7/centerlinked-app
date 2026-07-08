/**
 * Approves all facilities so they appear in search and public org pages.
 *
 * Usage: npm run approve-all-facilities
 *        npm run approve-all-facilities -- --dry-run
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SERVICE_ROLE =
  env.SUPABASE_SERVICE_ROLE || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE;

const dryRun = process.argv.includes("--dry-run");
const PAGE_SIZE = 1000;

async function fetchAllFacilities(supabase) {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("facilities")
      .select("id,name,verification_status,verification_frozen,rejection_reason")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env");
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const facilities = await fetchAllFacilities(supabase);
  console.log(`Loaded ${facilities.length} facilities`);

  const now = new Date().toISOString();
  const needsUpdate = facilities.filter(
    (f) =>
      f.verification_status !== "approved" ||
      f.verification_frozen ||
      f.rejection_reason,
  );

  console.log(`Will update ${needsUpdate.length} facilities`);

  const byStatus = facilities.reduce((acc, f) => {
    acc[f.verification_status] = (acc[f.verification_status] ?? 0) + 1;
    return acc;
  }, {});
  console.log("Current status breakdown:", byStatus);
  console.log(`Frozen: ${facilities.filter((f) => f.verification_frozen).length}`);

  if (dryRun) {
    needsUpdate.slice(0, 20).forEach((f) => {
      console.log(`[dry-run] approve ${f.name} (${f.verification_status}${f.verification_frozen ? ", frozen" : ""})`);
    });
    if (needsUpdate.length > 20) console.log(`[dry-run] ... and ${needsUpdate.length - 20} more`);
    return;
  }

  const { error } = await supabase
    .from("facilities")
    .update({
      verification_status: "approved",
      verification_frozen: false,
      rejection_reason: null,
      verified_at: now,
      contracts_verified_at: now,
    })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) throw new Error(error.message);

  const { count: approved } = await supabase
    .from("facilities")
    .select("*", { count: "exact", head: true })
    .eq("verification_status", "approved");

  const { count: frozen } = await supabase
    .from("facilities")
    .select("*", { count: "exact", head: true })
    .eq("verification_frozen", true);

  console.log(`\nDone. Approved facilities: ${approved ?? 0}`);
  console.log(`Still frozen: ${frozen ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
