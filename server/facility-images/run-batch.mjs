#!/usr/bin/env node
/**
 * Facility image pipeline — multi-agent workflow:
 *   1. Fetcher   — discover photos from facility websites
 *   2. Quality   — heuristic + technical + vision checks (no people, facility-related)
 *   3. Processor — center-crop/resize for cover (1920×1080) and gallery (1200×900)
 *   4. Uploader  — Supabase storage + facilities.image_urls update
 *
 * Usage:
 *   node server/facility-images/run-batch.mjs --dry-run --limit 5
 *   node server/facility-images/run-batch.mjs --limit 10 --offset 0
 *   node server/facility-images/run-batch.mjs --facility-id <uuid>
 *   node server/facility-images/run-batch.mjs --status
 *
 * Required env (.env):
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * Optional:
 *   SUPABASE_SERVICE_ROLE  — required for DB writes and storage uploads
 *   OPENAI_API_KEY         — vision quality agent (strongly recommended for people detection)
 */
import { runBatch } from "./pipeline.mjs";
import { fetchFacilitiesNeedingImages } from "./lib/supabase.mjs";
import { MIN_IMAGES } from "./lib/env.mjs";
import { hasServiceRole } from "./lib/supabase.mjs";

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : null;
}

async function showStatus() {
  const facilities = await fetchFacilitiesNeedingImages(MIN_IMAGES);
  const noWebsite = facilities.filter((f) => !f.website);
  console.log(`Facilities needing images (< ${MIN_IMAGES}): ${facilities.length}`);
  console.log(`  Without website: ${noWebsite.length}`);
  console.log(`  Service role configured: ${hasServiceRole()}`);
  console.log(`  OpenAI vision configured: ${Boolean(process.env.OPENAI_API_KEY)}`);
}

async function main() {
  if (args.includes("--status")) {
    await showStatus();
    return;
  }

  const limit = Number(getArg("--limit") ?? 10);
  const offset = Number(getArg("--offset") ?? 0);
  const facilityId = getArg("--facility-id");

  if (args.includes("--dry-run")) {
    const facilities = await fetchFacilitiesNeedingImages(MIN_IMAGES);
    const slice = facilityId
      ? facilities.filter((f) => f.id === facilityId)
      : facilities.slice(offset, offset + limit);
    console.log(`Would process ${slice.length} facilities:`);
    for (const f of slice) {
      console.log(`  - ${f.name} (${f.image_urls?.length ?? 0} images) ${f.website || "NO WEBSITE"}`);
    }
    return;
  }

  const summary = await runBatch({
    offset,
    limit,
    facilityIds: facilityId ? [facilityId] : null,
  });

  console.log("\n=== Batch Complete ===");
  console.log(`Complete: ${summary.complete}`);
  console.log(`Partial: ${summary.partial}`);
  console.log(`Incomplete: ${summary.incomplete}`);
  console.log(`Skipped: ${summary.skipped}`);
  console.log(`Failed: ${summary.failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
