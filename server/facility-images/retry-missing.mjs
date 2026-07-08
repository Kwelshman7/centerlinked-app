#!/usr/bin/env node
/**
 * Retry facilities that have a website but fewer than 4 images.
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MIN_IMAGES, REPORT_DIR } from "./lib/env.mjs";
import { fetchFacilitiesNeedingImages, hasServiceRole } from "./lib/supabase.mjs";
import { processFacility } from "./pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!hasServiceRole()) {
    console.error("SUPABASE_SERVICE_ROLE required in .env");
    process.exit(1);
  }

  mkdirSync(REPORT_DIR, { recursive: true });

  const facilities = (await fetchFacilitiesNeedingImages(MIN_IMAGES)).filter((f) => f.website);
  console.log(`Retrying ${facilities.length} facilities with websites but < ${MIN_IMAGES} images…\n`);

  const summary = { complete: 0, partial: 0, incomplete: 0, failed: 0, skipped: 0, reports: [] };

  for (let i = 0; i < facilities.length; i++) {
    const facility = facilities[i];
    console.log(`[${i + 1}/${facilities.length}] ${facility.name}`);
    const report = await processFacility(facility);
    summary.reports.push(report);
    summary[report.status] = (summary[report.status] || 0) + 1;
    console.log(
      `  → ${report.status} (${report.uploaded?.length ?? 0} new, ${report.finalCount ?? report.existingCount ?? 0} total, db: ${report.dbUpdated ? "yes" : "no"})`,
    );
  }

  const out = path.join(REPORT_DIR, `retry-${Date.now()}.json`);
  writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log(`\nRetry complete: ${summary.complete} complete, ${summary.incomplete} incomplete, ${summary.failed} failed`);
  console.log(`Summary: ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
