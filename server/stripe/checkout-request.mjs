import { DFY_PACKAGES, MEMBERSHIP_TIER_IDS, MEMBERSHIP_TIERS } from "./pricing.mjs";

/**
 * Parse Checkout body. Accepts the current { membershipTier, interval, doneForYou }
 * shape and the legacy { plan: "membership" | "done_for_you" } shape.
 */
export function parseCheckoutRequest(body) {
  const rawPlan = String(body?.plan || "").trim();
  let membershipTier = String(body?.membershipTier || body?.tier || "").trim().toLowerCase();
  let interval = String(body?.interval || "month").trim().toLowerCase();
  let doneForYou = body?.doneForYou === true || body?.doneForYou === "true";

  if (rawPlan === "done_for_you") {
    doneForYou = true;
    if (!membershipTier) membershipTier = "profile";
  } else if (rawPlan === "membership" && !membershipTier) {
    membershipTier = "profile";
  }

  if (!membershipTier) membershipTier = "profile";
  if (interval !== "year") interval = "month";

  if (membershipTier === "enterprise") {
    return {
      ok: false,
      status: 400,
      error: "Enterprise membership is quoted separately. Request access and we’ll follow up.",
    };
  }

  if (!MEMBERSHIP_TIER_IDS.has(membershipTier)) {
    return { ok: false, status: 400, error: "Choose Profile, Network, or Group." };
  }

  return {
    ok: true,
    membershipTier,
    interval,
    doneForYou,
  };
}

function membershipLineItem(prices, membershipTier, interval) {
  if (membershipTier === "profile" && interval === "month" && prices.membership) {
    return { price: prices.membership, quantity: 1 };
  }

  const tier = MEMBERSHIP_TIERS[membershipTier];
  const unit_amount = interval === "year" ? tier.annualCents : tier.monthlyCents;
  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: tier.productName,
        description: tier.facilityLabel,
      },
      unit_amount,
      recurring: { interval: interval === "year" ? "year" : "month" },
    },
    quantity: 1,
  };
}

function dfyLineItem(prices, membershipTier) {
  if (membershipTier === "profile" && prices.setup) {
    return { price: prices.setup, quantity: 1 };
  }

  const pkg = DFY_PACKAGES[membershipTier];
  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: pkg.productName,
      },
      unit_amount: pkg.amountCents,
    },
    quantity: 1,
  };
}

export function checkoutLineItems(prices, request, { setupOnly = false } = {}) {
  if (setupOnly) {
    return [dfyLineItem(prices, request.membershipTier)];
  }
  const items = [membershipLineItem(prices, request.membershipTier, request.interval)];
  if (request.doneForYou) {
    items.push(dfyLineItem(prices, request.membershipTier));
  }
  return items;
}

export function checkoutMetadata(request, { setupOnly = false } = {}) {
  const setupPackage = request.doneForYou || setupOnly ? "done_for_you" : "self_serve";
  return {
    plan: request.doneForYou || setupOnly ? "done_for_you" : request.membershipTier,
    membership_tier: request.membershipTier,
    billing_interval: request.interval,
    setup_package: setupPackage,
    setup_only: setupOnly ? "true" : "false",
  };
}
