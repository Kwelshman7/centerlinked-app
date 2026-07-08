#!/usr/bin/env node
/**
 * Apply curated image_urls from pipeline reports to the database.
 * Requires SUPABASE_SERVICE_ROLE in .env (never commit this file's env).
 */
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateFacilityImages, hasServiceRole } from "./lib/supabase.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.join(__dirname, "reports");

async function main() {
  if (!hasServiceRole()) {
    console.error("SUPABASE_SERVICE_ROLE is required. Add it to .env (do not commit).");
    process.exit(1);
  }

  const reports = readdirSync(REPORT_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("batch-"))
    .map((f) => JSON.parse(readFileSync(path.join(REPORT_DIR, f), "utf8")))
    .filter((r) => r.status === "complete" && r.finalUrls?.length >= 4);

  console.log(`Applying ${reports.length} facility image updates…`);

  let applied = 0;
  let failed = 0;

  for (const report of reports) {
    try {
      await updateFacilityImages(report.facilityId, report.finalUrls.slice(0, 7));
      applied++;
      process.stdout.write(`  ✓ ${report.name}\n`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${report.name}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${applied} applied, ${failed} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
