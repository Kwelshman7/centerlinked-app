/**
 * Generates src/components/landing/banyanFacilities.generated.json from live Supabase data.
 * Run: node scripts/generate-banyan-demo-data.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const base = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

const orgRes = await fetch(
  `${base}/rest/v1/organizations?slug=eq.banyan-treatment-centers&select=id,name,slug,logo_url,brand_color,accent_color,hq_city,hq_state,bd_contact_name,bd_contact_email,num_facilities,cover_image_url`,
  { headers },
);
const orgs = await orgRes.json();
if (!Array.isArray(orgs) || !orgs[0]?.id) {
  console.error("Org not found", orgs);
  process.exit(1);
}
const org = orgs[0];

const facRes = await fetch(
  `${base}/rest/v1/facilities?organization_id=eq.${org.id}&verification_status=eq.approved&select=id,name,slug,city,state,image_urls,levels_of_care,short_description,description&order=name`,
  { headers },
);
const facilities = await facRes.json();
if (!Array.isArray(facilities)) {
  console.error("Facilities fetch failed", facilities);
  process.exit(1);
}

const states = [...new Set(facilities.map((f) => f.state).filter(Boolean))].sort();

const payload = {
  org: {
    name: org.name,
    slug: org.slug,
    logoUrl: org.logo_url,
    brandColor: org.brand_color,
    accentColor: org.accent_color,
    hqCity: org.hq_city,
    hqState: org.hq_state,
    bdContactName: org.bd_contact_name,
    bdContactEmail: org.bd_contact_email,
    facilityCount: facilities.length,
    coverUrl: org.cover_image_url,
  },
  states,
  facilities: facilities.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    city: f.city,
    state: f.state,
    imageUrl: f.image_urls?.[0] ?? null,
    levelsOfCare: f.levels_of_care ?? [],
    description: f.short_description || f.description || null,
  })),
};

const outPath = join(root, "src/components/landing/banyanFacilities.generated.json");
writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${facilities.length} facilities to ${outPath}`);
