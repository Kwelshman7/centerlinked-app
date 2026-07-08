/**
 * Adds commonly-used payers missing from the master list, then updates aliases
 * on existing payers so future imports match reliably.
 *
 * Usage: node server/seed-missing-payers.mjs
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

const NEW_PAYERS = [
  { name: "MagnaCare", category: "tpa", aliases: [] },
  { name: "American Behavioral", category: "behavioral", aliases: ["American Behavioral Health"] },
  { name: "AvMed", category: "regional", aliases: [] },
  { name: "Three Rivers Provider Network", category: "tpa", aliases: ["TRPN"] },
  { name: "Quest Behavioral Health", category: "behavioral", aliases: ["Quest Behavioral"] },
  { name: "Zelis", category: "tpa", aliases: [] },
  { name: "Provider Network of America", category: "tpa", aliases: ["PNOA"] },
];

/** payer.name -> aliases to merge onto existing records */
const ALIAS_UPDATES = {
  UnitedHealthcare: ["United Healthcare", "United", "United Health Group"],
  "Blue Cross Blue Shield Association": ["BCBS", "Blue Cross Blue Shield"],
  Tricare: ["TRICARE"],
  "Magellan Health": ["Magellan"],
  "Optum Behavioral Health": ["Optum"],
  "Beacon Health Options": ["Beacon", "Value Options"],
  "Anthem Blue Cross Blue Shield": ["Anthem", "Anthem BCBS"],
  "Elevance Health": ["Anthem/Elevance"],
  "CareFirst BlueCross BlueShield": ["CareFirst"],
  "Horizon Blue Cross Blue Shield of New Jersey": ["Horizon BCBS", "Horizon"],
  "UMR (UnitedHealthcare)": ["UMR"],
  "First Health Network": ["First Health", "First Choice"],
  "Empire Blue Cross Blue Shield": ["Empire BCBS", "NYSHIP"],
};

function uniq(arr) {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env");
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: existing, error } = await supabase
    .from("payers")
    .select("id,name,aliases,status")
    .eq("status", "approved");
  if (error) throw new Error(error.message);

  const byName = new Map((existing ?? []).map((p) => [p.name.toLowerCase(), p]));
  let added = 0;

  for (const row of NEW_PAYERS) {
    if (byName.has(row.name.toLowerCase())) continue;
    const { error: insErr } = await supabase.from("payers").insert({
      name: row.name,
      category: row.category,
      aliases: row.aliases,
      status: "approved",
      active: true,
    });
    if (insErr) {
      console.error(`Failed to add ${row.name}: ${insErr.message}`);
    } else {
      console.log(`Added payer: ${row.name}`);
      added++;
    }
  }

  let aliasUpdates = 0;
  for (const [name, newAliases] of Object.entries(ALIAS_UPDATES)) {
    const payer = (existing ?? []).find((p) => p.name === name);
    if (!payer) continue;
    const merged = uniq([...(payer.aliases ?? []), ...newAliases]);
    if (merged.length === (payer.aliases ?? []).length) continue;
    const { error: upErr } = await supabase
      .from("payers")
      .update({ aliases: merged })
      .eq("id", payer.id);
    if (upErr) {
      console.error(`Failed aliases for ${name}: ${upErr.message}`);
    } else {
      console.log(`Updated aliases: ${name}`);
      aliasUpdates++;
    }
  }

  console.log(`\nAdded ${added} payers, updated ${aliasUpdates} alias sets`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
