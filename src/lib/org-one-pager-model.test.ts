import assert from "node:assert/strict";
import { test } from "node:test";
import {
  layoutForFacilityCount,
  payerSetsAreShared,
  referralOverviewFilename,
  shortenLevelOfCare,
  uniquePreserve,
} from "./org-one-pager-layout.ts";

test("layout mode follows facility count", () => {
  assert.equal(layoutForFacilityCount(0), "feature");
  assert.equal(layoutForFacilityCount(1), "feature");
  assert.equal(layoutForFacilityCount(2), "split");
  assert.equal(layoutForFacilityCount(3), "trio");
  assert.equal(layoutForFacilityCount(6), "grid");
  assert.equal(layoutForFacilityCount(7), "rows");
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
