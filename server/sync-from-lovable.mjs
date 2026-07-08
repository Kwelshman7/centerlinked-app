/**
 * Sync org logos + facility insurance contracts from Lovable Supabase
 * (centerlinked.com) into the current app database.
 * Preserves all program/org description fields.
 *
 *   node server/sync-from-lovable.mjs           # dry-run summary
 *   node server/sync-from-lovable.mjs --apply   # write SQL + execute via psql API
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SOURCE_URL = process.env.LOVABLE_SUPABASE_URL?.trim();
const sourceKey = process.env.LOVABLE_SUPABASE_SERVICE_ROLE?.trim();

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

const env = Object.fromEntries(
  readFileSync(`${ROOT}/.env`, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const apply = process.argv.includes("--apply");
const source = createClient(requireEnv("LOVABLE_SUPABASE_URL", SOURCE_URL), requireEnv("LOVABLE_SUPABASE_SERVICE_ROLE", sourceKey));
const target = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function norm(s) {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function escSql(v) {
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function fetchAll(client, table, select, filters = () => true) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await client.from(table).select(select).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []).filter(filters);
    rows.push(...batch);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function main() {
  console.log("Loading source (Lovable) data…");
  const [srcOrgs, srcFacs, srcContracts] = await Promise.all([
    fetchAll(source, "organizations", "id,slug,name,logo_url"),
    fetchAll(source, "facilities", "id,organization_id,name,slug,verification_status").then((r) =>
      r.filter((f) => f.verification_status === "approved"),
    ),
    fetchAll(source, "insurance_contracts", "facility_id,payer_name,in_network,payer_id,plan_types,notes"),
  ]);

  console.log("Loading target (current) data…");
  const [tgtOrgs, tgtFacs, tgtContracts] = await Promise.all([
    fetchAll(target, "organizations", "id,slug,name,logo_url"),
    fetchAll(target, "facilities", "id,organization_id,name,slug,verification_status").then((r) =>
      r.filter((f) => f.verification_status === "approved"),
    ),
    fetchAll(target, "insurance_contracts", "facility_id,payer_name,in_network"),
  ]);

  const srcOrgBySlug = new Map(srcOrgs.filter((o) => o.slug).map((o) => [o.slug, o]));
  const tgtOrgBySlug = new Map(tgtOrgs.filter((o) => o.slug).map((o) => [o.slug, o]));

  const srcFacsByOrg = new Map();
  for (const f of srcFacs) {
    const org = srcOrgs.find((o) => o.id === f.organization_id);
    if (!org?.slug) continue;
    if (!srcFacsByOrg.has(org.slug)) srcFacsByOrg.set(org.slug, []);
    srcFacsByOrg.get(org.slug).push(f);
  }

  const tgtFacsByOrg = new Map();
  for (const f of tgtFacs) {
    const org = tgtOrgs.find((o) => o.id === f.organization_id);
    if (!org?.slug) continue;
    if (!tgtFacsByOrg.has(org.slug)) tgtFacsByOrg.set(org.slug, []);
    tgtFacsByOrg.get(org.slug).push(f);
  }

  const srcContractsByFac = new Map();
  for (const c of srcContracts) {
    if (!srcContractsByFac.has(c.facility_id)) srcContractsByFac.set(c.facility_id, []);
    srcContractsByFac.get(c.facility_id).push(c);
  }

  const tgtContractsByFac = new Map();
  for (const c of tgtContracts) {
    if (!tgtContractsByFac.has(c.facility_id)) tgtContractsByFac.set(c.facility_id, []);
    tgtContractsByFac.get(c.facility_id).push(c);
  }

  function matchFacility(srcFac, tgtList) {
    if (srcFac.slug) {
      const bySlug = tgtList.find((t) => t.slug === srcFac.slug);
      if (bySlug) return bySlug;
    }
    const srcName = norm(srcFac.name);
    return tgtList.find((t) => norm(t.name) === srcName);
  }

  const sql = [];
  let logoUpdates = 0;
  let contractFacilities = 0;
  let contractRows = 0;
  let unmatchedFacilities = 0;

  for (const [orgSlug, srcOrg] of srcOrgBySlug) {
    const tgtOrg = tgtOrgBySlug.get(orgSlug);
    if (!tgtOrg) continue;

    if (srcOrg.logo_url && !tgtOrg.logo_url) {
      sql.push(
        `UPDATE public.organizations SET logo_url = ${escSql(srcOrg.logo_url)}, updated_at = now() WHERE id = ${escSql(tgtOrg.id)}::uuid AND logo_url IS NULL;`,
      );
      logoUpdates++;
    }

    const srcList = srcFacsByOrg.get(orgSlug) ?? [];
    const tgtList = tgtFacsByOrg.get(orgSlug) ?? [];

    for (const srcFac of srcList) {
      const srcCons = srcContractsByFac.get(srcFac.id) ?? [];
      if (srcCons.length === 0) continue;

      const tgtFac = matchFacility(srcFac, tgtList);
      if (!tgtFac) {
        unmatchedFacilities++;
        continue;
      }

      const tgtCons = tgtContractsByFac.get(tgtFac.id) ?? [];
      const tgtPayers = new Set(tgtCons.map((c) => norm(c.payer_name)));
      const missing = srcCons.filter((c) => !tgtPayers.has(norm(c.payer_name)));
      if (missing.length === 0) continue;

      contractFacilities++;
      for (const c of missing) {
        const planTypes =
          Array.isArray(c.plan_types) && c.plan_types.length
            ? `ARRAY[${c.plan_types.map((p) => escSql(p)).join(", ")}]::text[]`
            : "NULL";
        const payerId = c.payer_id ? `${escSql(c.payer_id)}::uuid` : "NULL";
        const notes = c.notes ? escSql(c.notes) : "NULL";
        sql.push(
          `INSERT INTO public.insurance_contracts (facility_id, payer_name, in_network, payer_id, plan_types, notes) VALUES (${escSql(tgtFac.id)}::uuid, ${escSql(c.payer_name)}, ${c.in_network ? "true" : "false"}, ${payerId}, ${planTypes}, ${notes});`,
        );
        contractRows++;
      }
    }
  }

  console.log("\n=== Sync plan ===");
  console.log(`Org logo updates: ${logoUpdates}`);
  console.log(`Facilities getting new contracts: ${contractFacilities}`);
  console.log(`Insurance contract rows to insert: ${contractRows}`);
  console.log(`Source facilities with contracts but no target match: ${unmatchedFacilities}`);

  const outPath = `${ROOT}/supabase/sync-from-lovable.generated.sql`;
  writeFileSync(outPath, `-- Generated ${new Date().toISOString()}\nBEGIN;\n${sql.join("\n")}\nCOMMIT;\n`);
  console.log(`\nWrote ${sql.length} statements to ${outPath}`);

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to execute against linked Supabase project.");
    return;
  }

  console.log("\nApplying via Supabase CLI…");
  execFileSync("npx", ["supabase", "db", "query", "--linked", "-f", outPath], {
    cwd: ROOT,
    stdio: "inherit",
  });
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
