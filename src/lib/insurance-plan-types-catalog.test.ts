import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getAllInsurers,
  getInsurerById,
  getPlanTypesForInsurer,
  getDropdownPlanTypeIds,
  getPlanTypeById,
  sanitizePlanTypesForInsurer,
  isValidPlanTypeId,
} from "./insurance-plan-types-catalog.ts";

test("getAllInsurers returns non-empty array", () => {
  const insurers = getAllInsurers();
  assert.ok(insurers.length > 0);
  assert.ok(insurers.every((i) => i.insurer_id && i.display_name));
});

test("getInsurerById finds UHC", () => {
  const uhc = getInsurerById("uhc");
  assert.ok(uhc);
  assert.equal(uhc.insurer_id, "uhc");
  assert.equal(uhc.display_name, "UnitedHealthcare");
  assert.ok(uhc.plan_types.length > 0);
});

test("getInsurerById returns null for unknown ID", () => {
  assert.equal(getInsurerById("nonexistent"), null);
});

test("getPlanTypesForInsurer returns dropdown-eligible plans by default", () => {
  const plans = getPlanTypesForInsurer("uhc");
  assert.ok(plans.length > 0);
  assert.ok(plans.every((p) => p.dropdown === true));
});

test("getPlanTypesForInsurer with includeAll=true returns all plans", () => {
  const allPlans = getPlanTypesForInsurer("uhc", true);
  const dropdownPlans = getPlanTypesForInsurer("uhc", false);
  assert.ok(allPlans.length >= dropdownPlans.length);
});

test("getDropdownPlanTypeIds returns string array", () => {
  const ids = getDropdownPlanTypeIds("uhc");
  assert.ok(ids.length > 0);
  assert.ok(ids.every((id) => typeof id === "string"));
  assert.ok(ids.includes("uhc_choice"));
});

test("getPlanTypeById finds specific plan", () => {
  const plan = getPlanTypeById("uhc_choice");
  assert.ok(plan);
  assert.equal(plan.id, "uhc_choice");
  assert.equal(plan.label, "Choice");
});

test("getPlanTypeById returns null for unknown ID", () => {
  assert.equal(getPlanTypeById("nonexistent_plan"), null);
});

test("isValidPlanTypeId validates known plans", () => {
  assert.equal(isValidPlanTypeId("uhc_choice"), true);
  assert.equal(isValidPlanTypeId("aetna_open_choice"), true);
  assert.equal(isValidPlanTypeId("nonexistent"), false);
});

test("sanitizePlanTypesForInsurer filters by insurer", () => {
  const sanitized = sanitizePlanTypesForInsurer(
    ["uhc_choice", "aetna_open_choice", "invalid_plan"],
    "uhc",
  );
  assert.ok(sanitized.includes("uhc_choice"));
  assert.ok(!sanitized.includes("aetna_open_choice"));
  assert.ok(!sanitized.includes("invalid_plan"));
});

test("sanitizePlanTypesForInsurer falls back to global validation", () => {
  const sanitized = sanitizePlanTypesForInsurer(
    ["uhc_choice", "aetna_open_choice", "invalid_plan"],
    null,
  );
  assert.ok(sanitized.includes("uhc_choice"));
  assert.ok(sanitized.includes("aetna_open_choice"));
  assert.ok(!sanitized.includes("invalid_plan"));
});

test("sanitizePlanTypesForInsurer handles empty/invalid input", () => {
  assert.deepEqual(sanitizePlanTypesForInsurer(null, "uhc"), []);
  assert.deepEqual(sanitizePlanTypesForInsurer("not-an-array", "uhc"), []);
  assert.deepEqual(sanitizePlanTypesForInsurer([123, null, ""], "uhc"), []);
});

test("sanitizePlanTypesForInsurer deduplicates", () => {
  const sanitized = sanitizePlanTypesForInsurer(
    ["uhc_choice", "uhc_choice", "uhc_choice_plus"],
    "uhc",
  );
  assert.equal(sanitized.length, 2);
  assert.ok(sanitized.includes("uhc_choice"));
  assert.ok(sanitized.includes("uhc_choice_plus"));
});

test("catalog includes TRICARE", () => {
  const tricare = getInsurerById("tricare");
  assert.ok(tricare);
  const plans = getDropdownPlanTypeIds("tricare");
  assert.ok(plans.includes("tricare_prime"));
  assert.ok(plans.includes("tricare_select"));
});

test("catalog includes VA CCN", () => {
  const vaCcn = getInsurerById("va_ccn");
  assert.ok(vaCcn);
  const plans = getDropdownPlanTypeIds("va_ccn");
  assert.ok(plans.includes("va_ccn_standard"));
});

test("catalog includes MBHOs as separate entities", () => {
  const optumBh = getInsurerById("optum_bh");
  const carelonBh = getInsurerById("carelon_bh");
  const evernorthBh = getInsurerById("evernorth_bh");
  const magellan = getInsurerById("magellan");
  assert.ok(optumBh);
  assert.ok(carelonBh);
  assert.ok(evernorthBh);
  assert.ok(magellan);
  assert.equal(optumBh.category, "mbho");
  assert.equal(carelonBh.category, "mbho");
  assert.equal(evernorthBh.category, "mbho");
  assert.equal(magellan.category, "mbho");
});

test("catalog includes Other local Blue catch-all", () => {
  const otherBlue = getInsurerById("bcbs_other_local");
  assert.ok(otherBlue);
  assert.equal(otherBlue.category, "bcbs_licensee");
  assert.ok(otherBlue.plan_types.length > 0);
});

test("catalog includes major Blues licensees", () => {
  const hcsc = getInsurerById("hcsc");
  const highmark = getInsurerById("highmark");
  const floridaBlue = getInsurerById("florida_blue");
  assert.ok(hcsc);
  assert.ok(highmark);
  assert.ok(floridaBlue);
  assert.equal(hcsc.category, "bcbs_licensee");
  assert.equal(highmark.category, "bcbs_licensee");
  assert.equal(floridaBlue.category, "bcbs_licensee");
});

test("all insurers have at least one dropdown-eligible plan", () => {
  const insurers = getAllInsurers();
  for (const insurer of insurers) {
    const dropdownPlans = insurer.plan_types.filter((pt) => pt.dropdown);
    assert.ok(
      dropdownPlans.length > 0,
      `${insurer.insurer_id} has no dropdown plans`,
    );
  }
});

test("all plan type IDs are unique globally", () => {
  const insurers = getAllInsurers();
  const allPlanIds = insurers.flatMap((i) => i.plan_types.map((pt) => pt.id));
  const uniqueIds = new Set(allPlanIds);
  assert.equal(
    allPlanIds.length,
    uniqueIds.size,
    "Duplicate plan type IDs found",
  );
});
