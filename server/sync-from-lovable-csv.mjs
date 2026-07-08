/**
 * Sync org logos + facility insurance contracts from Lovable CSV exports
 * into the current app database. Does NOT touch facility descriptions or image_urls.
 *
 *   node server/sync-from-lovable-csv.mjs           # dry-run summary
 *   node server/sync-from-lovable-csv.mjs --create-missing  # also insert missing facilities (no descriptions/images overwritten)
 *   node server/sync-from-lovable-csv.mjs --apply           # write SQL + execute via Supabase CLI
 */
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { readFileSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_CONTRACTS =
  "/Users/kylewelshman/Downloads/insurance_contracts-export-2026-07-05_15-22-36.csv";
const DEFAULT_FACILITIES =
  "/Users/kylewelshman/Downloads/facilities-export-2026-07-05_15-23-01.csv";
const DEFAULT_ORGS =
  "/Users/kylewelshman/Downloads/organizations-export-2026-07-05_15-24-08.csv";

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
const createMissing = process.argv.includes("--create-missing");
const contractsPath = process.argv.find((a) => a.endsWith("insurance_contracts")) ?? DEFAULT_CONTRACTS;
const facilitiesPath = process.argv.find((a) => a.endsWith("facilities-export")) ?? DEFAULT_FACILITIES;
const orgsPath = process.argv.find((a) => a.endsWith("organizations-export")) ?? DEFAULT_ORGS;

const target = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function norm(s) {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function baseName(name) {
  return norm(name)
    .replace(/\s*[—–-]\s*.+$/, "")
    .replace(/\s*\(.+\)$/, "")
    .trim();
}

function normCity(c) {
  return norm(c).replace(/\./g, "");
}

const STATE_NAMES = {
  pa: "pennsylvania",
  ma: "massachusetts",
  nj: "new jersey",
  co: "colorado",
  fl: "florida",
  tx: "texas",
  oh: "ohio",
  ky: "kentucky",
  tn: "tennessee",
};

function normalizeNameKey(name) {
  let n = norm(name).replace(/\s*[—–-]\s*.+$/, "");
  n = n.replace(/\b(at|the)\b/g, " ").replace(/\s+/g, " ").trim();
  for (const [abbr, full] of Object.entries(STATE_NAMES)) {
    n = n.replace(new RegExp(`\\b${abbr}\\b`, "g"), full);
    n = n.replace(new RegExp(`\\b${full}\\b`, "g"), full);
  }
  return n.replace(/\s+/g, " ").trim();
}

function citiesCompatible(srcCity, tgtCity) {
  const a = normCity(srcCity);
  const b = normCity(tgtCity);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.startsWith(b) || b.startsWith(a);
}

function namesCompatible(srcName, tgtName) {
  const a = normalizeNameKey(srcName);
  const b = normalizeNameKey(tgtName);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aTokens = a.split(" ").filter((t) => t.length > 2);
  const bTokens = new Set(b.split(" ").filter((t) => t.length > 2));
  const overlap = aTokens.filter((t) => bTokens.has(t));
  const minLen = Math.min(aTokens.length, bTokens.size);
  return minLen > 0 && overlap.length >= Math.max(1, minLen - 1);
}

function parseJsonArray(raw) {
  if (!raw?.trim()) return [];
  try {
    return JSON.parse(raw.replace(/""/g, '"'));
  } catch {
    return [];
  }
}

function sqlTextArray(values) {
  if (!values?.length) return "'{}'::text[]";
  return `ARRAY[${values.map((v) => escSql(v)).join(", ")}]::text[]`;
}

function loadOverrides() {
  try {
    return JSON.parse(readFileSync(`${__dirname}/lovable-facility-overrides.json`, "utf8"));
  } catch {
    return { slugPrefixToTargetSlugPrefix: {} };
  }
}

function escSql(v) {
  return `'${String(v).replace(/'/g, "''")}'`;
}

function matchOrg(srcOrg, tgtOrgs) {
  const bySlug = tgtOrgs.find((t) => t.slug === srcOrg.slug);
  if (bySlug) return bySlug;

  const srcName = norm(srcOrg.name);
  const byName = tgtOrgs.find((t) => norm(t.name) === srcName);
  if (byName) return byName;

  const bySlugPrefix = tgtOrgs.find(
    (t) => t.slug?.startsWith(`${srcOrg.slug}-`) || t.slug?.startsWith(`${srcOrg.slug}_`),
  );
  if (bySlugPrefix) return bySlugPrefix;

  return tgtOrgs.find((t) => {
    const tgtSlug = t.slug ?? "";
    return srcOrg.slug.startsWith(tgtSlug) || tgtSlug.startsWith(srcOrg.slug);
  }) ?? null;
}

function parseCsv(filePath) {
  const text = readFileSync(filePath, "utf8");
  const { data, errors } = Papa.parse(text, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
  });
  if (errors.length) {
    throw new Error(`${filePath}: ${errors[0].message}`);
  }
  return data;
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
  console.log("Parsing Lovable CSV exports…");
  const srcOrgs = parseCsv(orgsPath);
  const srcFacs = parseCsv(facilitiesPath).filter((f) => f.verification_status === "approved");
  const srcContracts = parseCsv(contractsPath);

  console.log(
    `  ${srcOrgs.length} orgs, ${srcFacs.length} approved facilities, ${srcContracts.length} contracts`,
  );

  console.log("Loading target (current) data…");
  const [tgtOrgs, tgtFacs, tgtContracts, tgtPayers] = await Promise.all([
    fetchAll(target, "organizations", "id,slug,name,logo_url"),
    fetchAll(target, "facilities", "id,organization_id,name,slug,verification_status").then((r) =>
      r.filter((f) => f.verification_status === "approved"),
    ),
    fetchAll(target, "insurance_contracts", "id,facility_id,payer_name,in_network"),
    fetchAll(target, "payers", "id,name"),
  ]);

  const validPayerIds = new Set(tgtPayers.map((p) => p.id));
  const overrides = loadOverrides();
  const slugPrefixMap = overrides.slugPrefixToTargetSlugPrefix ?? {};

  const srcOrgById = new Map(srcOrgs.map((o) => [o.id, o]));
  const orgPairs = [];
  for (const srcOrg of srcOrgs.filter((o) => o.slug)) {
    const tgtOrg = matchOrg(srcOrg, tgtOrgs);
    if (tgtOrg) orgPairs.push({ srcOrg, tgtOrg });
  }

  const srcFacsByTgtOrgId = new Map();
  for (const f of srcFacs) {
    const srcOrg = srcOrgById.get(f.organization_id);
    if (!srcOrg) continue;
    const pair = orgPairs.find((p) => p.srcOrg.id === srcOrg.id);
    if (!pair) continue;
    if (!srcFacsByTgtOrgId.has(pair.tgtOrg.id)) srcFacsByTgtOrgId.set(pair.tgtOrg.id, []);
    srcFacsByTgtOrgId.get(pair.tgtOrg.id).push(f);
  }

  const tgtFacsByOrgId = new Map();
  for (const f of tgtFacs) {
    if (!tgtFacsByOrgId.has(f.organization_id)) tgtFacsByOrgId.set(f.organization_id, []);
    tgtFacsByOrgId.get(f.organization_id).push(f);
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
      const srcPrefix = srcFac.slug.replace(/-[a-f0-9]{6}$/i, "");
      const mappedPrefix = slugPrefixMap[srcPrefix];
      if (mappedPrefix) {
        const byOverride = tgtList.find((t) => t.slug?.startsWith(mappedPrefix));
        if (byOverride) return byOverride;
      }

      const bySlug = tgtList.find((t) => t.slug === srcFac.slug);
      if (bySlug) return bySlug;
      const byPrefix = tgtList.find((t) => t.slug?.startsWith(srcPrefix));
      if (byPrefix) return byPrefix;
    }

    const srcName = norm(srcFac.name);
    const byName = tgtList.find((t) => norm(t.name) === srcName);
    if (byName) return byName;

    const srcBase = baseName(srcFac.name);
    const byBase = tgtList.find(
      (t) => baseName(t.name) === srcBase || norm(t.name).startsWith(`${srcBase} `),
    );
    if (byBase) return byBase;

    const srcCity = normCity(srcFac.city);
    const srcState = norm(srcFac.state);
    const byCompat = tgtList.filter(
      (t) =>
        norm(t.state) === srcState &&
        citiesCompatible(srcFac.city, t.city) &&
        namesCompatible(srcFac.name, t.name),
    );
    if (byCompat.length === 1) return byCompat[0];
    if (byCompat.length > 1) {
      const byCityExact = byCompat.find((t) => normCity(t.city) === srcCity);
      if (byCityExact) return byCityExact;
    }

    const byLocation = tgtList.filter(
      (t) => normCity(t.city) === srcCity && norm(t.state) === srcState,
    );
    if (byLocation.length === 1) return byLocation[0];

    const byLocName = byLocation.find(
      (t) =>
        norm(t.name).includes(srcBase) ||
        srcBase.includes(baseName(t.name)) ||
        baseName(t.name).includes(srcBase) ||
        namesCompatible(srcFac.name, t.name),
    );
    if (byLocName) return byLocName;

    if (!srcCity && srcState) {
      const byStateOnly = tgtList.filter((t) => norm(t.state) === srcState);
      if (byStateOnly.length === 1) return byStateOnly[0];
    }

    return null;
  }

  function facilityInsertSql(srcFac, tgtOrgId) {
    const srcPrefix = (srcFac.slug ?? `${norm(srcFac.name)}-${normCity(srcFac.city)}`).replace(
      /-[a-f0-9]{6}$/i,
      "",
    );
    const slug = `${srcPrefix}-${(srcFac.id ?? "").slice(0, 6) || "import"}`;
    const levels = sqlTextArray(parseJsonArray(srcFac.levels_of_care));
    const cityVal = srcFac.city?.trim() ?? "";
    const stateVal = srcFac.state?.trim() ?? "";
    const website = srcFac.website?.trim() ? escSql(srcFac.website.trim()) : "NULL";
    const phone = srcFac.phone?.trim() ? escSql(srcFac.phone.trim()) : "NULL";
    return `-- create missing: ${srcFac.name}
INSERT INTO public.facilities (organization_id, name, city, state, slug, website, phone, verification_status, image_urls, levels_of_care, highlights, population_served, specializations, accreditations)
SELECT ${escSql(tgtOrgId)}::uuid, ${escSql(srcFac.name.trim())}, ${cityVal ? escSql(cityVal) : "NULL"}, ${stateVal ? escSql(stateVal) : "NULL"}, ${escSql(slug)}, ${website}, ${phone}, 'approved', '{}'::text[], ${levels}, '{}'::text[], '{}'::text[], '{}'::text[], '{}'::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM public.facilities f
  WHERE f.organization_id = ${escSql(tgtOrgId)}::uuid
    AND lower(trim(f.name)) = lower(trim(${escSql(srcFac.name.trim())}))
    AND lower(coalesce(f.city, '')) = lower(${escSql(cityVal)})
    AND lower(coalesce(f.state, '')) = lower(${escSql(stateVal)})
);`;
  }

  function contractInsertSql(tgtFacId, c) {
    const rawPayerId = c.payer_id?.trim();
    const payerId =
      rawPayerId && validPayerIds.has(rawPayerId) ? `${escSql(rawPayerId)}::uuid` : "NULL";
    const notes = c.notes?.trim() ? escSql(c.notes.trim()) : "NULL";
    return `INSERT INTO public.insurance_contracts (facility_id, payer_name, in_network, payer_id, notes)
SELECT ${escSql(tgtFacId)}::uuid, ${escSql(c.payer_name.trim())}, true, ${payerId}, ${notes}
WHERE NOT EXISTS (
  SELECT 1 FROM public.insurance_contracts ic
  WHERE ic.facility_id = ${escSql(tgtFacId)}::uuid
    AND lower(trim(ic.payer_name)) = lower(trim(${escSql(c.payer_name.trim())}))
);`;
  }

  function contractInsertByLookupSql(tgtOrgId, srcFac, c) {
    const rawPayerId = c.payer_id?.trim();
    const payerId =
      rawPayerId && validPayerIds.has(rawPayerId) ? `${escSql(rawPayerId)}::uuid` : "NULL";
    const notes = c.notes?.trim() ? escSql(c.notes.trim()) : "NULL";
    const cityVal = srcFac.city?.trim() ?? "";
    const stateVal = srcFac.state?.trim() ?? "";
    return `INSERT INTO public.insurance_contracts (facility_id, payer_name, in_network, payer_id, notes)
SELECT f.id, ${escSql(c.payer_name.trim())}, true, ${payerId}, ${notes}
FROM public.facilities f
WHERE f.organization_id = ${escSql(tgtOrgId)}::uuid
  AND lower(trim(f.name)) = lower(trim(${escSql(srcFac.name.trim())}))
  AND lower(coalesce(f.city, '')) = lower(${escSql(cityVal)})
  AND lower(coalesce(f.state, '')) = lower(${escSql(stateVal)})
  AND NOT EXISTS (
    SELECT 1 FROM public.insurance_contracts ic
    WHERE ic.facility_id = f.id
      AND lower(trim(ic.payer_name)) = lower(trim(${escSql(c.payer_name.trim())}))
  );`;
  }

  const sql = [];
  let logoUpdates = 0;
  let contractFacilities = 0;
  let contractInserts = 0;
  let contractUpdates = 0;
  let facilityCreates = 0;
  let unmatchedFacilities = 0;
  const unmatchedSamples = [];
  const unmatchedAll = [];

  for (const { srcOrg, tgtOrg } of orgPairs) {
    if (srcOrg.logo_url?.trim() && !tgtOrg.logo_url) {
      sql.push(
        `UPDATE public.organizations SET logo_url = ${escSql(srcOrg.logo_url.trim())}, updated_at = now() WHERE id = ${escSql(tgtOrg.id)}::uuid AND (logo_url IS NULL OR logo_url = '');`,
      );
      logoUpdates++;
    }

    const srcList = srcFacsByTgtOrgId.get(tgtOrg.id) ?? [];
    const tgtList = tgtFacsByOrgId.get(tgtOrg.id) ?? [];

    for (const srcFac of srcList) {
      const srcCons = (srcContractsByFac.get(srcFac.id) ?? []).filter(
        (c) => c.in_network === "true" || c.in_network === true,
      );
      if (srcCons.length === 0) continue;

      const tgtFac = matchFacility(srcFac, tgtList);
      if (!tgtFac) {
        unmatchedFacilities++;
        unmatchedAll.push({ org: tgtOrg.slug, srcFac, contracts: srcCons.length });
        if (unmatchedSamples.length < 10) {
          unmatchedSamples.push(`${tgtOrg.slug} / ${srcFac.name} (${srcFac.city}, ${srcFac.state})`);
        }

        if (createMissing) {
          sql.push(facilityInsertSql(srcFac, tgtOrg.id));
          facilityCreates++;
          for (const c of srcCons) {
            sql.push(contractInsertByLookupSql(tgtOrg.id, srcFac, c));
            contractInserts++;
          }
          contractFacilities++;
        }
        continue;
      }

      const tgtCons = tgtContractsByFac.get(tgtFac.id) ?? [];
      const tgtByPayer = new Map(tgtCons.map((c) => [norm(c.payer_name), c]));
      let facilityChanged = false;

      for (const c of srcCons) {
        const key = norm(c.payer_name);
        const existing = tgtByPayer.get(key);
        if (!existing) {
          sql.push(contractInsertSql(tgtFac.id, c));
          contractInserts++;
          facilityChanged = true;
        } else if (!existing.in_network) {
          sql.push(
            `UPDATE public.insurance_contracts SET in_network = true, updated_at = now() WHERE id = ${escSql(existing.id)}::uuid;`,
          );
          contractUpdates++;
          facilityChanged = true;
        }
      }

      if (facilityChanged) contractFacilities++;
    }
  }

  console.log("\n=== Sync plan (from CSV) ===");
  console.log(`Org logo updates (only where missing): ${logoUpdates}`);
  console.log(`Facilities to create (missing in target): ${facilityCreates}`);
  console.log(`Facilities getting contract changes: ${contractFacilities}`);
  console.log(`Insurance contract rows to insert: ${contractInserts}`);
  console.log(`Insurance contract rows to mark in-network: ${contractUpdates}`);
  console.log(`Source facilities with contracts but no target match: ${unmatchedFacilities}`);
  if (unmatchedSamples.length) {
    console.log("Unmatched samples:", unmatchedSamples.join("; "));
  }
  if (!createMissing && unmatchedFacilities > 0) {
    console.log("\nRe-run with --create-missing to insert missing facilities + their contracts.");
  }

  const outPath = `${ROOT}/supabase/sync-from-lovable.generated.sql`;
  writeFileSync(
    outPath,
    `-- Generated ${new Date().toISOString()} from Lovable CSV exports\n-- Does NOT modify facility descriptions or image_urls\nBEGIN;\n${sql.join("\n")}\nCOMMIT;\n`,
  );
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
