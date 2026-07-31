/**
 * Reconcile insurance_contracts against facility_data.csv.
 *
 * Source of truth: CSV `insurance_networks` (comma-separated).
 * Resolves each label to the cleaned `payers` master list via match-payer.
 *
 * Usage:
 *   node server/reconcile-facility-contracts.mjs
 *   node server/reconcile-facility-contracts.mjs --csv=/path/to/facility_data.csv
 *   node server/reconcile-facility-contracts.mjs --org=Flyland
 *   node server/reconcile-facility-contracts.mjs --apply
 *   node server/reconcile-facility-contracts.mjs --org=Flyland --apply
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";
import {
  resolvePayerForContractName,
  isNonPayerLabel,
  normalizePayerName,
} from "./lib/match-payer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        const key = l.slice(0, i).trim();
        const val = l.slice(i + 1).replace(/^["']|["']$/g, "").trim();
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

const apply = process.argv.includes("--apply");
const orgFilterArg = process.argv.find((a) => a.startsWith("--org="));
const orgFilter = orgFilterArg ? orgFilterArg.slice("--org=".length).trim().toLowerCase() : null;
const csvArg = process.argv.find((a) => a.startsWith("--csv="));
const csvPath =
  csvArg?.slice("--csv=".length) ||
  path.join(process.env.HOME || "", "Downloads/facility_data.csv");

/** Extra CSV labels that mean "no in-network contracts". */
function isOonOnlyLabel(name) {
  const n = normalizePayerName(name);
  return [
    "oon",
    "oon only",
    "all oon",
    "out of network",
    "out-of-network",
    "out of network only",
    "out-of-network only",
  ].includes(n);
}

function splitNetworks(raw) {
  if (!raw?.trim()) return [];
  const out = [];
  let buf = "";
  let depth = 0;
  for (const ch of raw) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === ";" || ch === "|" || ch === "," || ch === "\n")) {
      const t = buf.trim().replace(/\.$/, "");
      if (t) out.push(t);
      buf = "";
    } else {
      buf += ch;
    }
  }
  const t = buf.trim().replace(/\.$/, "");
  if (t) out.push(t);
  return out;
}

/** Strip parenthetical noise like "(certified provider)". */
function cleanCsvPayerLabel(raw) {
  return raw
    .replace(/\s*\(certified provider\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normName(s) {
  return (s || "")
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAll(supabase, table, select, extra = (q) => q) {
  const PAGE = 1000;
  const all = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table).select(select).range(from, from + PAGE - 1);
    q = extra(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

function resolveExpected(labels, payers) {
  const expected = [];
  const unresolved = [];
  const skipped = [];
  const seenIds = new Set();
  const seenNames = new Set();

  for (const raw of labels) {
    const label = cleanCsvPayerLabel(raw);
    if (!label) continue;
    if (isOonOnlyLabel(label) || isNonPayerLabel(label)) {
      skipped.push(label);
      continue;
    }
    // Combined cells like "Ambetter of KS and VACCN"
    if (/\band\b/i.test(label) && !resolvePayerForContractName(label, payers)) {
      const parts = label.split(/\band\b/i).map((p) => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        const nested = resolveExpected(parts, payers);
        expected.push(...nested.expected);
        unresolved.push(...nested.unresolved);
        skipped.push(...nested.skipped);
        continue;
      }
    }
    const resolved = resolvePayerForContractName(label, payers);
    if (!resolved) {
      const key = normalizePayerName(label);
      if (!seenNames.has(key)) {
        seenNames.add(key);
        unresolved.push(label);
        // Keep unmatched CSV labels so we don't drop real networks not yet in master list.
        expected.push({
          payer_id: null,
          payer_name: label,
          source_label: label,
          unresolved: true,
        });
      }
      continue;
    }
    if (seenIds.has(resolved.id)) continue;
    seenIds.add(resolved.id);
    seenNames.add(normalizePayerName(resolved.name));
    expected.push({
      payer_id: resolved.id,
      payer_name: resolved.name,
      source_label: label,
    });
  }

  return { expected, unresolved, skipped };
}

function matchFacility(csvRow, facilities, orgsById) {
  const target = normName(csvRow.facility_name);
  if (!target) return null;

  const parent = normName(csvRow.parent_company);
  const city = normName(csvRow.city);

  const candidates = facilities.filter((f) => {
    const n = normName(f.name);
    if (n === target) return true;
    if (n.includes(target) || target.includes(n)) return true;
    return false;
  });

  if (!candidates.length) return null;

  const scored = candidates.map((f) => {
    let score = 0;
    const n = normName(f.name);
    if (n === target) score += 100;
    else if (n.startsWith(target) || target.startsWith(n)) score += 60;
    else score += 30;

    if (parent) {
      const orgName = normName(orgsById.get(f.organization_id)?.name);
      if (orgName && (orgName.includes(parent) || parent.includes(orgName))) score += 40;
      // CSV parent "Flyland" vs org "Flyland Recovery Network"
      if (orgName && parent.split(" ").some((p) => p.length > 3 && orgName.includes(p))) score += 20;
    }
    if (city && normName(f.city) === city) score += 25;
    return { f, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (best.score < 60) return null;
  // Ambiguous exact ties
  if (scored[1] && scored[1].score === best.score && normName(scored[1].f.name) !== normName(best.f.name)) {
    return { facility: best.f, ambiguous: scored.filter((s) => s.score === best.score).map((s) => s.f.name) };
  }
  return { facility: best.f, ambiguous: null };
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env");
  }
  if (!existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  console.log(`CSV: ${csvPath}`);
  console.log(`Mode: ${apply ? "APPLY (will rewrite contracts)" : "DRY-RUN"}`);
  if (orgFilter) console.log(`Org filter: ${orgFilter}`);

  const parsed = Papa.parse(readFileSync(csvPath, "utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors?.length) {
    console.warn(`CSV parse warnings: ${parsed.errors.length} (showing first 3)`);
    for (const e of parsed.errors.slice(0, 3)) console.warn(" ", e.message);
  }

  const rawCsvRows = parsed.data
    .map((r) => ({
      facility_name: (r.facility_name || r.Name || r.name || "").trim(),
      city: (r.city || "").trim(),
      state: (r.state || "").trim(),
      parent_company: (r.parent_company || "").trim(),
      insurance_networks: (r.insurance_networks || r["In Network Payers"] || "").trim(),
    }))
    .filter((r) => r.facility_name);

  // Dedupe duplicate facility rows — prefer the row that actually lists networks.
  // Empty insurance_networks means "unknown in this row", NOT "wipe contracts".
  const byKey = new Map();
  for (const row of rawCsvRows) {
    const key = `${normName(row.parent_company)}|${normName(row.facility_name)}|${normName(row.city)}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, row);
      continue;
    }
    if (!prev.insurance_networks && row.insurance_networks) byKey.set(key, row);
  }
  const csvRows = [...byKey.values()].filter((r) => r.insurance_networks);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const [facilities, orgs, payers, contracts] = await Promise.all([
    fetchAll(supabase, "facilities", "id,name,city,state,organization_id,verification_status"),
    fetchAll(supabase, "organizations", "id,name,slug"),
    fetchAll(supabase, "payers", "id,name,aliases,status,active", (q) =>
      q.eq("status", "approved"),
    ),
    fetchAll(
      supabase,
      "insurance_contracts",
      "id,facility_id,payer_id,payer_name,in_network",
      (q) => q.eq("in_network", true),
    ),
  ]);

  const approvedPayers = (payers ?? []).filter((p) => p.active !== false);
  const orgsById = new Map(orgs.map((o) => [o.id, o]));
  const contractsByFacility = new Map();
  for (const c of contracts) {
    const list = contractsByFacility.get(c.facility_id) ?? [];
    list.push(c);
    contractsByFacility.set(c.facility_id, list);
  }

  console.log(
    `Loaded CSV rows=${csvRows.length} facilities=${facilities.length} payers=${approvedPayers.length} in-network contracts=${contracts.length}`,
  );

  const report = {
    matched_ok: [],
    mismatched: [],
    unmatched_csv: [],
    ambiguous: [],
    unresolved_labels: new Map(),
  };

  for (const row of csvRows) {
    if (orgFilter) {
      const parent = row.parent_company.toLowerCase();
      if (!parent.includes(orgFilter) && !orgFilter.includes(parent)) {
        // also allow matching via facility name path later
        const m = matchFacility(row, facilities, orgsById);
        const orgName = m?.facility
          ? normName(orgsById.get(m.facility.organization_id)?.name)
          : "";
        if (!parent.includes(orgFilter) && !orgName.includes(orgFilter)) continue;
      }
    }

    const match = matchFacility(row, facilities, orgsById);
    if (!match) {
      report.unmatched_csv.push(row);
      continue;
    }
    if (match.ambiguous) {
      report.ambiguous.push({ row, candidates: match.ambiguous });
      continue;
    }

    const fac = match.facility;
    const org = orgsById.get(fac.organization_id);
    if (orgFilter) {
      const orgName = normName(org?.name);
      const parent = normName(row.parent_company);
      if (!orgName.includes(orgFilter) && !parent.includes(orgFilter)) continue;
    }

    const labels = splitNetworks(row.insurance_networks);
    const { expected, unresolved, skipped } = resolveExpected(labels, approvedPayers);
    for (const u of unresolved) {
      report.unresolved_labels.set(u, (report.unresolved_labels.get(u) || 0) + 1);
    }

    const actual = (contractsByFacility.get(fac.id) ?? []).filter((c) => c.in_network);
    const expectedIds = new Set(expected.map((e) => e.payer_id).filter(Boolean));
    const actualIds = new Set(actual.map((c) => c.payer_id).filter(Boolean));
    // Also compare by cleaned payer_name when payer_id missing on actual
    const expectedNames = new Set(expected.map((e) => normalizePayerName(e.payer_name)));
    const actualNames = new Set(actual.map((c) => normalizePayerName(c.payer_name)));

    const linkedExpected = expected.filter((e) => e.payer_id);
    const linkedExpectedIds = new Set(linkedExpected.map((e) => e.payer_id));
    const idMatch =
      linkedExpectedIds.size > 0 &&
      unresolved.length === 0 &&
      setsEqual(linkedExpectedIds, actualIds);
    const nameMatch = setsEqual(expectedNames, actualNames);
    const ok =
      (expected.length === 0 && actual.length === 0) ||
      idMatch ||
      nameMatch;

    const entry = {
      facility_id: fac.id,
      facility_name: fac.name,
      org_name: org?.name ?? "?",
      csv_name: row.facility_name,
      csv_networks: row.insurance_networks,
      csv_labels: labels,
      skipped,
      unresolved,
      expected,
      actual: actual.map((c) => ({
        id: c.id,
        payer_id: c.payer_id,
        payer_name: c.payer_name,
      })),
    };

    if (ok) report.matched_ok.push(entry);
    else report.mismatched.push(entry);
  }

  console.log("\n=== SUMMARY ===");
  console.log(`OK (matches sheet):     ${report.matched_ok.length}`);
  console.log(`Mismatch / needs sync:  ${report.mismatched.length}`);
  console.log(`CSV row unmatched:      ${report.unmatched_csv.length}`);
  console.log(`Ambiguous matches:      ${report.ambiguous.length}`);
  console.log(`Unique unresolved labels: ${report.unresolved_labels.size}`);

  if (report.unresolved_labels.size) {
    console.log("\nUnresolved CSV payer labels (need mapping or seed):");
    for (const [label, count] of [...report.unresolved_labels.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count}×  ${label}`);
    }
  }

  console.log("\n=== MISMATCHES (first 40) ===");
  for (const m of report.mismatched.slice(0, 40)) {
    const exp = m.expected.map((e) => e.payer_name).join("; ") || "(none / OON)";
    const act = m.actual.map((a) => a.payer_name).join("; ") || "(none)";
    console.log(`\n${m.org_name} · ${m.facility_name}`);
    console.log(`  CSV:  ${m.csv_networks || "(empty)"}`);
    console.log(`  Want: ${exp}`);
    console.log(`  Have: ${act}`);
    if (m.unresolved.length) console.log(`  Unresolved: ${m.unresolved.join("; ")}`);
  }
  if (report.mismatched.length > 40) {
    console.log(`\n… ${report.mismatched.length - 40} more mismatches`);
  }

  if (report.unmatched_csv.length) {
    console.log("\n=== UNMATCHED CSV ROWS (first 25) ===");
    for (const r of report.unmatched_csv.slice(0, 25)) {
      console.log(`  ${r.parent_company || "?"} · ${r.facility_name} (${r.city}, ${r.state})`);
    }
  }

  const outPath = path.join(ROOT, "tmp/contract-reconcile-report.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        csvPath,
        orgFilter,
        apply,
        summary: {
          ok: report.matched_ok.length,
          mismatched: report.mismatched.length,
          unmatched_csv: report.unmatched_csv.length,
          ambiguous: report.ambiguous.length,
          unresolved_labels: Object.fromEntries(report.unresolved_labels),
        },
        mismatched: report.mismatched,
        unmatched_csv: report.unmatched_csv,
        ambiguous: report.ambiguous,
      },
      null,
      2,
    ),
  );
  console.log(`\nFull report: ${outPath}`);

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to replace in-network contracts for mismatches.");
    return;
  }

  let updated = 0;
  let failed = 0;
  for (const m of report.mismatched) {
    const { error: delErr } = await supabase
      .from("insurance_contracts")
      .delete()
      .eq("facility_id", m.facility_id)
      .eq("in_network", true);
    if (delErr) {
      console.error(`DELETE fail ${m.facility_name}: ${delErr.message}`);
      failed++;
      continue;
    }

    if (m.expected.length) {
      const rows = m.expected.map((e) => ({
        facility_id: m.facility_id,
        payer_id: e.payer_id,
        payer_name: e.payer_name,
        in_network: true,
      }));
      const { error: insErr } = await supabase.from("insurance_contracts").insert(rows);
      if (insErr) {
        console.error(`INSERT fail ${m.facility_name}: ${insErr.message}`);
        failed++;
        continue;
      }
    }
    updated++;
    const linked = m.expected.filter((e) => e.payer_id).length;
    const raw = m.expected.length - linked;
    console.log(
      `Synced ${m.facility_name} → ${m.expected.length} contracts (${linked} linked, ${raw} raw)`,
    );
  }

  console.log(`\nApplied: ${updated} facilities updated, ${failed} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
