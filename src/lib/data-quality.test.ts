import assert from "node:assert/strict";
import { test } from "node:test";
import { completenessResult, coverageShare, importGaps } from "./data-quality.ts";

test("completeness score is the count of passed checks, not a hidden grade", () => {
  const result = completenessResult({
    address_line1: "100 Main St",
    city: "Tampa",
    state: "FL",
    zip: "33606",
    phone: "555-0100",
    website: "https://example.com",
    image_urls: ["https://example.com/a.jpg"],
    bd_contact_name: "Ada",
    bd_contact_email: "ada@org.com",
    self_pay_only: false,
    contract_count: 2,
  });
  assert.equal(result.score, result.max);
  assert.equal(result.missing.length, 0);
});

test("missing insurance stays a gap unless self-pay only is set", () => {
  const missing = completenessResult({
    city: "Tampa",
    state: "FL",
    contract_count: 0,
    self_pay_only: false,
  });
  assert.ok(missing.missing.includes("insurance"));
  const selfPay = completenessResult({
    city: "Tampa",
    state: "FL",
    contract_count: 0,
    self_pay_only: true,
  });
  assert.equal(selfPay.missing.includes("insurance"), false);
});

test("import gaps list the same checks that will appear on the dashboard", () => {
  const gaps = importGaps({});
  assert.ok(gaps.some((label) => /Street/i.test(label)));
  assert.ok(gaps.some((label) => /insurance/i.test(label)));
});

test("coverage share does not invent demand", () => {
  assert.equal(coverageShare(59, 194), 30.4);
  assert.equal(coverageShare(0, 0), 0);
});
