const PRODUCTION_ORIGINS = [
  "https://www.centerlinked.com",
  "https://centerlinked.com",
];

const LOCAL_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

function siteOrigin() {
  const raw = process.env.SITE_URL || "https://www.centerlinked.com";
  try {
    return new URL(raw).origin;
  } catch {
    return "https://www.centerlinked.com";
  }
}

function isProductionRuntime() {
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.NODE_ENV === "production") {
    const site = siteOrigin();
    return !/localhost|127\.0\.0\.1/i.test(site);
  }
  return false;
}

export function allowedBillingOrigin(req) {
  const allowed = new Set([...PRODUCTION_ORIGINS, siteOrigin()]);
  // Localhost only for local/preview — never advertise it on production CORS.
  if (!isProductionRuntime()) {
    for (const origin of LOCAL_ORIGINS) allowed.add(origin);
  }
  const origin = req?.headers?.origin;
  if (origin && allowed.has(origin)) return origin;
  return siteOrigin();
}

export function setBillingCors(req, res, methods) {
  res.setHeader("Access-Control-Allow-Origin", allowedBillingOrigin(req));
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
