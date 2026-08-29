/**
 * Create / reuse CenterLinked facility-banded Stripe products and prices.
 * Reads STRIPE_SECRET_KEY from .env. Prints IDs only — never the secret.
 *
 *   node scripts/ensure-stripe-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import Stripe from "stripe";

const envPath = new URL("../.env", import.meta.url);
const raw = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  raw
    .split("\n")
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

if (!env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is missing from .env");
  process.exit(1);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const mode = env.STRIPE_SECRET_KEY.startsWith("sk_live") || env.STRIPE_SECRET_KEY.startsWith("rk_live")
  ? "live"
  : "test";
console.log(`Stripe mode: ${mode}`);

async function findProduct(name) {
  const list = await stripe.products.list({ limit: 100, active: true });
  return list.data.find((p) => p.name === name) || null;
}

async function ensureProduct(name, description) {
  const existing = await findProduct(name);
  if (existing) {
    console.log(`PRODUCT exists ${existing.id} | ${name}`);
    return existing;
  }
  const created = await stripe.products.create({
    name,
    description,
    metadata: { catalog: "centerlinked_facility_bands_2026" },
  });
  console.log(`PRODUCT created ${created.id} | ${name}`);
  return created;
}

async function ensureRecurringPrice(productId, unitAmount, interval, nickname) {
  const list = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const match = list.data.find(
    (p) =>
      p.unit_amount === unitAmount &&
      p.currency === "usd" &&
      p.recurring?.interval === interval,
  );
  if (match) {
    console.log(`PRICE exists ${match.id} | ${nickname}`);
    return match;
  }
  const created = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: unitAmount,
    recurring: { interval },
    nickname,
  });
  console.log(`PRICE created ${created.id} | ${nickname}`);
  return created;
}

async function ensureOneTimePrice(productId, unitAmount, nickname) {
  const list = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const match = list.data.find(
    (p) => p.unit_amount === unitAmount && p.currency === "usd" && !p.recurring,
  );
  if (match) {
    console.log(`PRICE exists ${match.id} | ${nickname}`);
    return match;
  }
  const created = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: unitAmount,
    nickname,
  });
  console.log(`PRICE created ${created.id} | ${nickname}`);
  return created;
}

async function maybeRename(product, name, description) {
  if (product.name === name && product.description === description) return product;
  const updated = await stripe.products.update(product.id, { name, description });
  console.log(`PRODUCT renamed ${updated.id} | ${name}`);
  return updated;
}

const membership =
  (await findProduct("CenterLinked Membership")) ||
  (await findProduct("CenterLinked Profile")) ||
  (await findProduct("CenterLinked Small"));
const profile = membership
  ? await maybeRename(membership, "CenterLinked Small", "1 live facility. One live org link.")
  : await ensureProduct("CenterLinked Small", "1 live facility. One live org link.");

const networkExisting =
  (await findProduct("CenterLinked Network")) || (await findProduct("CenterLinked Medium"));
const network = networkExisting
  ? await maybeRename(networkExisting, "CenterLinked Medium", "2–5 live facilities under one org link.")
  : await ensureProduct("CenterLinked Medium", "2–5 live facilities under one org link.");

const groupExisting =
  (await findProduct("CenterLinked Group")) || (await findProduct("CenterLinked Large"));
const group = groupExisting
  ? await maybeRename(groupExisting, "CenterLinked Large", "6–15 live facilities under one org link.")
  : await ensureProduct("CenterLinked Large", "6–15 live facilities under one org link.");

const dfy1Existing = await findProduct("Done For You Setup") || await findProduct("CenterLinked Done For You · 1 facility");
const dfy1 = dfy1Existing
  ? await maybeRename(dfy1Existing, "CenterLinked Done For You · 1 facility", "One-time setup for one location.")
  : await ensureProduct("CenterLinked Done For You · 1 facility", "One-time setup for one location.");
const dfy5 = await ensureProduct("CenterLinked Done For You · 2–5 facilities", "One-time setup for 2–5 locations.");
const dfy15 = await ensureProduct("CenterLinked Done For You · 6–15 facilities", "One-time setup for 6–15 locations.");

const prices = {
  STRIPE_PRICE_MEMBERSHIP: (await ensureRecurringPrice(profile.id, 9900, "month", "Small monthly")).id,
  STRIPE_PRICE_PROFILE_YEAR: (await ensureRecurringPrice(profile.id, 99_000, "year", "Small annual")).id,
  STRIPE_PRICE_NETWORK: (await ensureRecurringPrice(network.id, 24_900, "month", "Medium monthly")).id,
  STRIPE_PRICE_NETWORK_YEAR: (await ensureRecurringPrice(network.id, 249_000, "year", "Medium annual")).id,
  STRIPE_PRICE_GROUP: (await ensureRecurringPrice(group.id, 49_900, "month", "Large monthly")).id,
  STRIPE_PRICE_GROUP_YEAR: (await ensureRecurringPrice(group.id, 499_000, "year", "Large annual")).id,
  STRIPE_PRICE_SETUP: (await ensureOneTimePrice(dfy1.id, 49_900, "DFY 1 facility")).id,
  STRIPE_PRICE_SETUP_NETWORK: (await ensureOneTimePrice(dfy5.id, 120_000, "DFY 2–5 facilities")).id,
  STRIPE_PRICE_SETUP_GROUP: (await ensureOneTimePrice(dfy15.id, 250_000, "DFY 6–15 facilities")).id,
};

console.log("\nCatalog price IDs:");
for (const [k, v] of Object.entries(prices)) console.log(`${k}=${v}`);

let next = raw;
for (const [key, value] of Object.entries(prices)) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(next)) next = next.replace(re, line);
  else next = next.replace(/\s*$/, `\n${line}\n`);
}
writeFileSync(envPath, next);
console.log("\nUpdated .env with catalog price IDs (not committed).");
