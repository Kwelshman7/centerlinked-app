import assert from "node:assert/strict";
import { test } from "node:test";
import {
  densityForFacilityCount,
  paginateOrgFacilities,
  payerSetsAreShared,
  referralOverviewFilename,
  rowsPerDirectoryPage,
  shortenLevelOfCare,
  uniquePreserve,
} from "./org-one-pager-layout.ts";

test("density follows facility count", () => {
  assert.equal(densityForFacilityCount(0), "generous");
  assert.equal(densityForFacilityCount(1), "generous");
  assert.equal(densityForFacilityCount(3), "generous");
  assert.equal(densityForFacilityCount(4), "standard");
  assert.equal(densityForFacilityCount(8), "standard");
  assert.equal(densityForFacilityCount(9), "directory");
  assert.equal(densityForFacilityCount(35), "directory");
});

test("three facilities fit on one page", () => {
  const pages = paginateOrgFacilities(3);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].kind, "directory");
  assert.deepEqual([pages[0].start, pages[0].end], [0, 3]);
});

test("eight facilities split across two compact pages", () => {
  const pages = paginateOrgFacilities(8);
  assert.equal(rowsPerDirectoryPage("standard"), 4);
  assert.equal(pages.length, 2);
  assert.equal(pages.every((p) => p.kind === "directory"), true);
  assert.deepEqual([pages[0].start, pages[0].end], [0, 4]);
  assert.deepEqual([pages[1].start, pages[1].end], [4, 8]);
});

test("35 facilities get a cover then four insurance directory pages", () => {
  const pages = paginateOrgFacilities(35);
  assert.equal(pages[0].kind, "cover");
  assert.equal(pages.length, 5);
  assert.equal(pages.filter((p) => p.kind === "directory").length, 4);
  assert.deepEqual([pages[4].start, pages[4].end], [27, 35]);
});

test("shortens known levels of care without inventing new ones", () => {
  assert.equal(shortenLevelOfCare("Mental Health PHP/IOP"), "MH PHP/IOP");
  assert.equal(shortenLevelOfCare("Holistic Treatment"), "Holistic");
  assert.equal(shortenLevelOfCare("Wilderness Therapy"), "Wilderness Therapy");
});

test("collapses Medical Detox and Detox to one label", () => {
  const levels = uniquePreserve(["Medical Detox", "Residential", "Detox"].map(shortenLevelOfCare));
  assert.deepEqual(levels, ["Detox", "Residential"]);
});

test("shared insurance requires identical payer sets", () => {
  assert.equal(payerSetsAreShared([["Aetna", "Cigna"], ["Cigna", "Aetna"]]), true);
  assert.equal(payerSetsAreShared([["Aetna", "Cigna"], ["Aetna"]]), false);
  assert.equal(payerSetsAreShared([["Aetna"], ["Aetna", "Cigna"]]), false);
  assert.equal(payerSetsAreShared([[]]), false);
  assert.equal(payerSetsAreShared([["Aetna"]]), false);
});

test("filename is a professional title-case slug", () => {
  assert.equal(
    referralOverviewFilename("Intrepid Recovery Centers"),
    "Intrepid-Recovery-Centers-Referral-Overview.pdf",
  );
});
