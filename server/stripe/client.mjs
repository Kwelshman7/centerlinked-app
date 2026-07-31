import Stripe from "stripe";
import { siteUrl } from "../email/config.mjs";

let stripeSingleton = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeSingleton) {
    // Use the SDK's pinned latest API version (currently 2026-07-29.dahlia).
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export function stripePrices() {
  return {
    membership: process.env.STRIPE_PRICE_MEMBERSHIP || "",
    setup: process.env.STRIPE_PRICE_SETUP || "",
  };
}

export function appSiteUrl() {
  return siteUrl();
}

export function randomSuffix(length = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
