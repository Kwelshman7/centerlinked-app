import assert from "node:assert/strict";
import { test } from "node:test";
import { membershipCheckoutDecision } from "./membership-checkout.mjs";

test("idle org may start membership checkout", () => {
  const d = membershipCheckoutDecision({ subscription_status: "none", stripe_subscription_id: null });
  assert.equal(d.allowMembershipCheckout, true);
  assert.equal(d.usePortal, false);
});

test("canceled org may start a new membership checkout", () => {
  const d = membershipCheckoutDecision({
    subscription_status: "canceled",
    stripe_subscription_id: "sub_old",
  });
  assert.equal(d.allowMembershipCheckout, true);
});

test("active membership cannot start a second subscription", () => {
  const d = membershipCheckoutDecision({
    subscription_status: "active",
    stripe_subscription_id: "sub_live",
  });
  assert.equal(d.allowMembershipCheckout, false);
  assert.equal(d.alreadyActive, true);
  assert.equal(d.usePortal, false);
});

test("past_due is sent to the customer portal", () => {
  const d = membershipCheckoutDecision({
    subscription_status: "past_due",
    stripe_subscription_id: "sub_live",
  });
  assert.equal(d.allowMembershipCheckout, false);
  assert.equal(d.usePortal, true);
});

test("unpaid and incomplete use the portal", () => {
  for (const status of ["unpaid", "incomplete"]) {
    const d = membershipCheckoutDecision({
      subscription_status: status,
      stripe_subscription_id: "sub_live",
    });
    assert.equal(d.allowMembershipCheckout, false);
    assert.equal(d.usePortal, true);
  }
});

test("subscription id with empty status is treated as already subscribed", () => {
  const d = membershipCheckoutDecision({
    subscription_status: "",
    stripe_subscription_id: "sub_live",
  });
  assert.equal(d.allowMembershipCheckout, false);
});
