import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dfyPackageForFacilityCount,
  formatUsdFromCents,
  getMembershipTier,
  membershipAmountCents,
  membershipQuoteForFacilityCount,
  suggestedTierForFacilityCount,
} from "./pricing.ts";

test("facility-count amounts match the published catalog", () => {
  const profile = getMembershipTier("profile");
  const network = getMembershipTier("network");
  const group = getMembershipTier("group");
  assert.equal(profile?.name, "1 facility");
  assert.equal(network?.name, "2–5 facilities");
  assert.equal(group?.name, "6–15 facilities");
  assert.equal(membershipAmountCents(profile, "month"), 9900);
  assert.equal(membershipAmountCents(profile, "year"), 99_000);
  assert.equal(membershipAmountCents(network, "month"), 24_900);
  assert.equal(membershipAmountCents(network, "year"), 249_000);
  assert.equal(membershipAmountCents(group, "month"), 49_900);
  assert.equal(membershipAmountCents(group, "year"), 499_000);
});

test("currency labels drop cents when whole dollars", () => {
  assert.equal(formatUsdFromCents(9900), "$99");
  assert.equal(formatUsdFromCents(24900), "$249");
  assert.equal(formatUsdFromCents(120000), "$1,200");
});

test("facility count maps to the right membership and DFY package", () => {
  assert.equal(suggestedTierForFacilityCount(0), "profile");
  assert.equal(suggestedTierForFacilityCount(1), "profile");
  assert.equal(suggestedTierForFacilityCount(4), "network");
  assert.equal(suggestedTierForFacilityCount(15), "group");
  assert.equal(suggestedTierForFacilityCount(16), "enterprise");
  assert.equal(dfyPackageForFacilityCount(1).amountCents, 49_900);
  assert.equal(dfyPackageForFacilityCount(5).amountCents, 120_000);
  assert.equal(dfyPackageForFacilityCount(9).amountCents, 250_000);
  assert.equal(dfyPackageForFacilityCount(20), "enterprise");
});

test("slider quote rises with each facility and keeps published bookends", () => {
  const one = membershipQuoteForFacilityCount(1);
  const two = membershipQuoteForFacilityCount(2);
  const five = membershipQuoteForFacilityCount(5);
  const six = membershipQuoteForFacilityCount(6);
  const fifteen = membershipQuoteForFacilityCount(15);
  const enterprise = membershipQuoteForFacilityCount(16);
  assert.equal(one.isEnterprise, false);
  assert.equal(one.monthlyCents, 9900);
  assert.equal(one.annualCents, 99_000);
  assert.equal(one.dfyCents, 49_900);
  assert.equal(two.monthlyCents, 14_900);
  assert.ok((two.monthlyCents ?? 0) > (one.monthlyCents ?? 0));
  assert.equal(five.monthlyCents, 24_900);
  assert.ok((six.monthlyCents ?? 0) > (five.monthlyCents ?? 0));
  assert.equal(fifteen.monthlyCents, 49_900);
  assert.equal(fifteen.dfyCents, 250_000);
  assert.equal(enterprise.isEnterprise, true);
  assert.equal(enterprise.facilityLabel, "16+ facilities");
});
