import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dfyPackageForFacilityCount,
  formatUsdFromCents,
  getMembershipTier,
  membershipAmountCents,
  suggestedTierForFacilityCount,
} from "./pricing.ts";

test("Profile / Network / Group amounts match the published catalog", () => {
  const profile = getMembershipTier("profile");
  const network = getMembershipTier("network");
  const group = getMembershipTier("group");
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
