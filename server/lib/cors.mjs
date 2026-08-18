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

export function allowedBillingOrigin(req) {
  const allowed = new Set([...PRODUCTION_ORIGINS, ...LOCAL_ORIGINS, siteOrigin()]);
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
