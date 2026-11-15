/**
 * Server-side head metadata for the marketing routes.
 *
 * The SPA sets the same values after hydration via `useMarketingMeta`. This map
 * is what a client that does not run JavaScript gets instead. Keep it in sync
 * with `src/components/marketing/site.ts` (seoTitle / seoDescription) and the
 * `usePageTitle` calls in `src/pages/marketing/CompanyPages.tsx` — a served
 * title that disagrees with the rendered page is worse than no title.
 *
 * Data only, no imports, so Edge middleware can load it.
 */

export const MARKETING_ROUTE_META = {
  "/pricing": {
    title: "Plans and pricing | CenterLinked",
    description: "Listing is free. Search is free with a work email. Membership is optional and priced by how many facilities you keep live, from $99 a month.",
  },
  "/about": {
    title: "About CenterLinked | Insurance search for behavioral health",
    description: "CenterLinked is a work tool for behavioral health business development. Search is free with a work email. Programs list contracts and contacts. No patient records.",
  },
  "/partners": {
    title: "List a treatment program | CenterLinked",
    description: "Referral partners search free with a work email. Treatment organizations list programs, contacts, and in-network contracts, and keep them current.",
  },
  "/contact": {
    title: "Contact CenterLinked",
    description: "Write CenterLinked about a listing or a membership question. The form opens your email app. Nothing from it is stored on our servers.",
  },
  "/insights": {
    title: "Insights for behavioral health referrals | CenterLinked",
    description: "Short notes on insurance fit, monthly verification, and why a treatment listing needs a person, not only a main line.",
  },
  "/for/bd-reps": {
    title: "Insurance search for treatment BD reps | CenterLinked",
    description: "Search approved treatment programs by payer, level of care, and city. Each result shows the business development contact so you can call, text, or email.",
  },
  "/for/programs": {
    title: "List a treatment program partners can trust | CenterLinked",
    description: "Publish levels of care, in-network contracts, and a business development contact on one link. Update the listing when the contract changes.",
  },
  "/for/organizations": {
    title: "One organization for every treatment site | CenterLinked",
    description: "Keep every facility, in-network contract, and business development contact on one organization. Search still returns the site that matches.",
  },
  "/for/partners": {
    title: "Search treatment by level of care | CenterLinked",
    description: "Filter behavioral health programs by detox, residential, PHP, IOP, or outpatient, next to the payer and the city.",
  },
  "/for/referral-sources": {
    title: "Referral sources: who accepts the plan | CenterLinked",
    description: "Look up in-network treatment programs by payer, level of care, and city. Each result includes a business development contact you can call.",
  },
  "/platform/search": {
    title: "Search treatment programs by insurance | CenterLinked",
    description: "Filter approved, in-network behavioral health programs by payer, level of care, state, and city. Frozen listings stay out of the results.",
  },
  "/platform/listings": {
    title: "Share a live treatment program listing | CenterLinked",
    description: "Send one public link for levels of care, in-network contracts, and the business development contact. Partners can read it without an account.",
  },
  "/platform/verification": {
    title: "Monthly verification for treatment listings | CenterLinked",
    description: "Fresh, recent, stale, and frozen tell you whether a treatment listing was confirmed. Frozen facilities leave search until they are verified again.",
  },
  "/platform/contacts": {
    title: "Business development contacts for treatment | CenterLinked",
    description: "Keep the business development contacts you call, text, and email. Find them by insurance fit, then return to the person later.",
  },
  "/vs/samhsa-treatment-locator": {
    title: "CenterLinked vs SAMHSA Treatment Locator | CenterLinked",
    description: "SAMHSA lists facilities and addresses. CenterLinked adds the in-network contract, the date someone last confirmed it, and the business development contact who answers.",
  },
  "/vs/payer-directories": {
    title: "CenterLinked vs payer provider directories | CenterLinked",
    description: "Payer directories check one carrier at a time and stop at the facility. CenterLinked searches every listed payer at once and shows who to call.",
  },
  "/insights/insurance-before-the-brochure": {
    title: "Check the insurance before you send the brochure | CenterLinked",
    description: "Why behavioral health referrals stall when the payer, the level of care, and the city live in three different places.",
  },
  "/insights/what-monthly-verification-changes": {
    title: "What changes when a listing is checked every month | CenterLinked",
    description: "How fresh, recent, stale, and frozen work on a treatment listing, and why a quiet facility leaves search.",
  },
  "/insights/the-person-on-the-listing": {
    title: "Put a person on the listing, not only a main line | CenterLinked",
    description: "Why a treatment listing should show the business development contact, and how Contacts keeps that person findable.",
  },
};

function normalize(pathname) {
  return String(pathname || "").split("?")[0].replace(/\/+$/, "") || "/";
}

/** Exact-match lookup. Returns null for anything not a marketing route. */
export function resolveMarketingMeta(pathname) {
  return MARKETING_ROUTE_META[normalize(pathname)] ?? null;
}

export function isMarketingMetaPath(pathname) {
  return resolveMarketingMeta(pathname) !== null;
}

/**
 * Clients that should be served the prerendered head: anything that is not a
 * browser. Every real browser sends a user-agent containing "Mozilla/", so
 * human traffic stays on the static SPA shell and never pays for the
 * serverless round trip.
 */
export function isNonBrowserClient(userAgent) {
  const ua = String(userAgent || "").trim();
  if (!ua) return true;
  return !ua.includes("Mozilla/");
}
