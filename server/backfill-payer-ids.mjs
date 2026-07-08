/**
 * Links insurance_contracts.payer_id to payers by matching payer_name
 * against payers.name, payers.aliases, and known label mappings.
 *
 * Usage: npm run backfill-payer-ids
 *        npm run backfill-payer-ids -- --dry-run
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolvePayerForContractName } from "./lib/match-payer.mjs";

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

async function fetchAllContracts(supabase) {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("insurance_contracts")
      .select("id,facility_id,payer_id,payer_name,in_network")
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

  const { data: payers, error: payersErr } = await supabase
    .from("payers")
    .select("id,name,aliases,status,active")
    .eq("status", "approved");

  if (payersErr) throw new Error(payersErr.message);

  const approved = (payers ?? []).filter((p) => p.active !== false);
  console.log(`Loaded ${approved.length} approved payers`);

  const contracts = await fetchAllContracts(supabase);
  console.log(`Loaded ${contracts.length} insurance contracts`);

  let linked = 0;
  let renamed = 0;
  let skipped = 0;
  let unmatched = 0;
  const unmatchedNames = new Map();

  const pendingUpdates = [];

  for (const contract of contracts) {
    if (contract.payer_id) {
      skipped++;
      continue;
    }

    const match = resolvePayerForContractName(contract.payer_name, approved);
    if (!match) {
      unmatched++;
      const key = contract.payer_name.trim();
      unmatchedNames.set(key, (unmatchedNames.get(key) ?? 0) + 1);
      continue;
    }

    const patch = {
      payer_id: match.id,
      payer_name: match.name,
    };
    if (patch.payer_name !== contract.payer_name) renamed++;
    pendingUpdates.push({ id: contract.id, patch, from: contract.payer_name, to: match.name });
    linked++;
  }

  if (dryRun) {
    for (const u of pendingUpdates.slice(0, 50)) {
      console.log(`[dry-run] ${u.from} -> ${u.to}`);
    }
    if (pendingUpdates.length > 50) {
      console.log(`[dry-run] ... and ${pendingUpdates.length - 50} more`);
    }
  } else {
    const BATCH = 25;
    for (let i = 0; i < pendingUpdates.length; i += BATCH) {
      const batch = pendingUpdates.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async ({ id, patch }) => {
          const { error } = await supabase.from("insurance_contracts").update(patch).eq("id", id);
          if (error) console.error(`Failed ${id}: ${error.message}`);
        }),
      );
      if ((i + BATCH) % 200 === 0 || i + BATCH >= pendingUpdates.length) {
        console.log(`Updated ${Math.min(i + BATCH, pendingUpdates.length)} / ${pendingUpdates.length}`);
      }
    }
  }

  console.log(`\nAlready linked (skipped): ${skipped}`);
  console.log(`${dryRun ? "Would link" : "Linked"}: ${linked}`);
  console.log(`Canonical name updates: ${renamed}`);
  console.log(`Still unmatched: ${unmatched}`);

  if (unmatchedNames.size) {
    console.log("\nTop unmatched payer_name values:");
    [...unmatchedNames.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .forEach(([name, count]) => console.log(`  ${count}x  ${name}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
