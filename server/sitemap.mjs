import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "./email/config.mjs";

/**
 * Static marketing and legal routes. Everything under /app is authenticated and
 * must never appear here.
 */
const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/signup", changefreq: "monthly", priority: "0.6" },
  { path: "/login", changefreq: "monthly", priority: "0.4" },
  { path: "/request-access", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
];

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [`    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

/**
 * Build sitemap.xml covering marketing routes plus every publicly resolvable
 * organization and program sheet.
 *
 * Inclusion mirrors the public read path exactly: `get_public_org_sheet` only
 * returns published organizations, and partner-visible facilities are approved,
 * not frozen, and not hidden from the org page. Listing anything else would
 * publish URLs that resolve to a not-found page.
 */
export async function buildSitemapXml() {
  const origin = siteUrl();
  const entries = STATIC_ROUTES.map((r) =>
    urlEntry({ loc: `${origin}${r.path}`, changefreq: r.changefreq, priority: r.priority }),
  );

  const admin = supabaseAdmin();
  if (!admin) {
    console.error("[sitemap] SUPABASE_SERVICE_ROLE is not configured — static routes only");
    return { xml: wrap(entries), orgs: 0, programs: 0, degraded: true };
  }

  // is_published, not verified: an unclaimed profile is publicly reachable but
  // carries no verification claim, and it still belongs in the sitemap.
  const { data: orgs, error: orgError } = await admin
    .from("organizations")
    .select("id, slug, updated_at")
    .eq("is_published", true)
    .not("slug", "is", null);

  if (orgError) {
    console.error("[sitemap] org query failed:", orgError.message);
    return { xml: wrap(entries), orgs: 0, programs: 0, degraded: true };
  }

  const orgById = new Map();
  for (const org of orgs || []) {
    orgById.set(org.id, org);
    entries.push(
      urlEntry({
        loc: `${origin}/o/${org.slug}`,
        lastmod: isoDate(org.updated_at),
        changefreq: "weekly",
        priority: "0.9",
      }),
    );
  }

  let programCount = 0;
  const orgIds = [...orgById.keys()];
  if (orgIds.length) {
    const { data: facilities, error: facError } = await admin
      .from("facilities")
      .select("slug, organization_id, updated_at")
      .in("organization_id", orgIds)
      .eq("verification_status", "approved")
      .eq("verification_frozen", false)
      .eq("hidden_from_org_page", false)
      .not("slug", "is", null);

    if (facError) {
      console.error("[sitemap] facility query failed:", facError.message);
    } else {
      for (const f of facilities || []) {
        const org = orgById.get(f.organization_id);
        if (!org?.slug) continue;
        programCount += 1;
        entries.push(
          urlEntry({
            loc: `${origin}/o/${org.slug}/p/${f.slug}`,
            lastmod: isoDate(f.updated_at),
            changefreq: "weekly",
            priority: "0.8",
          }),
        );
      }
    }
  }

  return {
    xml: wrap(entries),
    orgs: orgById.size,
    programs: programCount,
    degraded: false,
  };
}

function wrap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}
