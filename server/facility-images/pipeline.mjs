import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { MIN_IMAGES, MAX_IMAGES, REPORT_DIR } from "./lib/env.mjs";
import {
  fetchFacilitiesNeedingImages,
  updateFacilityImages,
  uploadFacilityImage,
  hasServiceRole,
} from "./lib/supabase.mjs";
import { buildApplyScript } from "./lib/sql-export.mjs";
import { fetchFacilityImageCandidates, downloadImage } from "./agents/fetcher.mjs";
import { runQualityCheck } from "./agents/quality-check.mjs";
import { processFacilityImage } from "./agents/processor.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Orchestrates fetch → quality check → crop/resize → upload → DB update.
 */
export async function processFacility(facility, options = {}) {
  const minNeeded = Math.max(0, MIN_IMAGES - (facility.image_urls?.length ?? 0));
  const report = {
    facilityId: facility.id,
    name: facility.name,
    website: facility.website,
    existingCount: facility.image_urls?.length ?? 0,
    existingUrls: facility.image_urls ?? [],
    targetCount: MIN_IMAGES,
    needed: minNeeded,
    approved: [],
    rejected: [],
    errors: [],
    uploaded: [],
    status: "pending",
  };

  if (minNeeded <= 0) {
    report.status = "complete";
    return report;
  }

  if (!facility.website) {
    report.status = "skipped";
    report.errors.push("No website on file");
    return report;
  }

  try {
    const candidates = await fetchFacilityImageCandidates(facility);
    report.candidateCount = candidates.length;

    const existing = new Set(facility.image_urls ?? []);
    const newUrls = [...(facility.image_urls ?? [])];

    for (const candidate of candidates) {
      if (newUrls.length >= MAX_IMAGES) break;
      if (newUrls.length - (facility.image_urls?.length ?? 0) >= minNeeded && newUrls.length >= MIN_IMAGES) {
        break;
      }

      try {
        const { buffer } = await downloadImage(candidate.url);
        const qc = await runQualityCheck({
          buffer,
          url: candidate.url,
          facility,
          meta: candidate,
        });

        if (!qc.pass) {
          report.rejected.push({ url: candidate.url, stage: qc.stage, reasons: qc.reasons });
          continue;
        }

        report.approved.push({ url: candidate.url, stage: qc.stage, category: qc.vision?.category });

        const processed = await processFacilityImage(buffer, newUrls.length);

        let publicUrl;
        if (hasServiceRole()) {
          publicUrl = await uploadFacilityImage(facility.id, processed.buffer, processed.ext);
        } else {
          // Fallback: keep vetted source URL when storage upload isn't available.
          publicUrl = candidate.url;
        }

        if (existing.has(publicUrl)) continue;
        newUrls.push(publicUrl);
        report.uploaded.push({
          source: candidate.url,
          publicUrl,
          role: processed.role,
          bytes: processed.bytes,
        });
      } catch (err) {
        report.errors.push(`${candidate.url}: ${err.message}`);
      }

      await sleep(250);
    }

    if (newUrls.length >= MIN_IMAGES && newUrls.join("|") !== (facility.image_urls ?? []).join("|")) {
      try {
        await updateFacilityImages(facility.id, newUrls);
        report.dbUpdated = true;
      } catch (err) {
        report.dbUpdated = false;
        report.errors.push(`DB update: ${err.message}`);
      }
      report.finalCount = newUrls.length;
      report.finalUrls = newUrls;
      report.status = newUrls.length >= MIN_IMAGES ? "complete" : "partial";
    } else {
      report.finalCount = newUrls.length;
      report.finalUrls = newUrls;
      report.status = newUrls.length >= MIN_IMAGES ? "complete" : "incomplete";
      if (newUrls.length !== (facility.image_urls?.length ?? 0) && newUrls.length > (facility.image_urls?.length ?? 0)) {
        try {
          await updateFacilityImages(facility.id, newUrls);
          report.dbUpdated = true;
        } catch (err) {
          report.dbUpdated = false;
          report.errors.push(`DB update: ${err.message}`);
        }
      }
    }
  } catch (err) {
    report.status = "failed";
    report.errors.push(err.message);
  }

  return report;
}

export async function runBatch({ offset = 0, limit = 10, facilityIds = null } = {}) {
  mkdirSync(REPORT_DIR, { recursive: true });

  let facilities = await fetchFacilitiesNeedingImages(MIN_IMAGES);
  if (facilityIds?.length) {
    const idSet = new Set(facilityIds);
    facilities = facilities.filter((f) => idSet.has(f.id));
  } else {
    facilities = facilities.slice(offset, offset + limit);
  }

  const summary = {
    startedAt: new Date().toISOString(),
    batchSize: facilities.length,
    hasServiceRole: hasServiceRole(),
    complete: 0,
    partial: 0,
    incomplete: 0,
    skipped: 0,
    failed: 0,
    reports: [],
  };

  for (const facility of facilities) {
    console.log(`\n[${summary.reports.length + 1}/${facilities.length}] ${facility.name}`);
    const report = await processFacility(facility);
    summary.reports.push(report);
    summary[report.status] = (summary[report.status] || 0) + 1;
    console.log(
      `  → ${report.status} (${report.uploaded?.length ?? 0} uploaded, ${report.finalCount ?? report.existingCount ?? 0} total)`,
    );

    const reportPath = path.join(REPORT_DIR, `${facility.id}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  summary.finishedAt = new Date().toISOString();
  const summaryPath = path.join(REPORT_DIR, `batch-${Date.now()}.json`);
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  const pendingDb = summary.reports.filter((r) => r.status === "complete" && r.dbUpdated === false);
  if (pendingDb.length) {
    const sqlPath = path.join(REPORT_DIR, `apply-images-${Date.now()}.sql`);
    writeFileSync(sqlPath, buildApplyScript(pendingDb));
    summary.sqlApplyPath = sqlPath;
    console.log(`\n${pendingDb.length} facilities need SQL apply (no service role): ${sqlPath}`);
  }

  console.log(`\nBatch summary written to ${summaryPath}`);
  return summary;
}
