/** Shared email config for Vercel API routes and Vite local middleware. */

export const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "admin@centerlinked.com";

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "CenterLinked <Admin@centerlinked.com>";

export function siteUrl() {
  const raw = process.env.SITE_URL || process.env.VITE_SITE_URL || "https://www.centerlinked.com";
  return raw.replace(/\/$/, "");
}

export function logoUrl() {
  return `${siteUrl()}/centerlinked-logo-full.png`;
}

export function appLoginUrl() {
  return `${siteUrl()}/login`;
}

export function adminRequestsUrl() {
  return `${siteUrl()}/app/admin/requests`;
}
