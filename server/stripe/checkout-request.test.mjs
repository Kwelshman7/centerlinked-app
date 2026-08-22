import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutLineItems, parseCheckoutRequest } from "./checkout-request.mjs";

test("legacy membership plan maps to Profile monthly", () => {
  const parsed = parseCheckoutRequest({ plan: "membership" });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.membershipTier, "profile");
  assert.equal(parsed.interval, "month");
  assert.equal(parsed.doneForYou, false);
});

test("legacy done_for_you plan maps to Profile monthly plus DFY", () => {
  const parsed = parseCheckoutRequest({ plan: "done_for_you" });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.membershipTier, "profile");
  assert.equal(parsed.doneForYou, true);
});

test("Network annual with DFY is accepted", () => {
  const parsed = parseCheckoutRequest({
    membershipTier: "network",
    interval: "year",
    doneForYou: true,
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.membershipTier, "network");
  assert.equal(parsed.interval, "year");
  assert.equal(parsed.doneForYou, true);
});

test("Enterprise checkout is refused", () => {
  const parsed = parseCheckoutRequest({ membershipTier: "enterprise" });
  assert.equal(parsed.ok, false);
  assert.equal(parsed.status, 400);
});

test("unknown tier is refused", () => {
  const parsed = parseCheckoutRequest({ membershipTier: "platinum" });
  assert.equal(parsed.ok, false);
});

test("Profile monthly uses configured membership price id when present", () => {
  const parsed = parseCheckoutRequest({ membershipTier: "profile", interval: "month" });
  const items = checkoutLineItems({ membership: "price_profile", setup: "price_setup" }, parsed);
  assert.deepEqual(items, [{ price: "price_profile", quantity: 1 }]);
});

test("Profile DFY uses configured setup price id when present", () => {
  const parsed = parseCheckoutRequest({
    membershipTier: "profile",
    interval: "month",
    doneForYou: true,
  });
  const items = checkoutLineItems({ membership: "price_profile", setup: "price_setup" }, parsed);
  assert.equal(items.length, 2);
  assert.deepEqual(items[1], { price: "price_setup", quantity: 1 });
});

test("Network monthly uses price_data at $249", () => {
  const parsed = parseCheckoutRequest({ membershipTier: "network", interval: "month" });
  const items = checkoutLineItems({ membership: "price_profile", setup: "price_setup" }, parsed);
  assert.equal(items[0].price_data.unit_amount, 24900);
  assert.equal(items[0].price_data.recurring.interval, "month");
});

test("Group annual uses price_data at $4990", () => {
  const parsed = parseCheckoutRequest({ membershipTier: "group", interval: "year" });
  const items = checkoutLineItems({ membership: "", setup: "" }, parsed);
  assert.equal(items[0].price_data.unit_amount, 499000);
  assert.equal(items[0].price_data.recurring.interval, "year");
});

test("setup-only Network DFY is $1200", () => {
  const parsed = parseCheckoutRequest({ membershipTier: "network", doneForYou: true });
  const items = checkoutLineItems({ membership: "price_profile", setup: "price_setup" }, parsed, {
    setupOnly: true,
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].price_data.unit_amount, 120000);
});
