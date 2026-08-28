/**
 * Local design preview for the org referral-overview PDF.
 * Visit /dev/org-one-pager-preview — sample multi-location org (Banyan-scale).
 */
import { useMemo, useState } from "react";
import { OrgOnePager } from "@/components/public/OrgOnePager";
import { LETTER_HEIGHT_PX, LETTER_WIDTH_PX } from "@/lib/export-one-pager-capture";
import { buildOrgOnePagerModel } from "@/lib/org-one-pager-model";
import type { OrgSheetData } from "@/components/public/OrganizationSheetView";
import type { ShowcaseFacility } from "@/components/public/OrgFacilityShowcaseCard";

const SHARED_PAYERS = [
  "Aetna",
  "Cigna",
  "UnitedHealthcare",
  "Blue Cross Blue Shield",
  "Humana",
  "Magellan",
  "Optum",
  "Tricare",
  "Beacon Health Options",
  "Ambetter",
  "Medicaid (FL)",
  "Medicare",
];

/** Calm campus / clinical exteriors — atmosphere for a BH referral overview, not lab stock. */
const COVER =
  "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1600&q=80";
const PHOTOS = [
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
];

const LOCATIONS: Array<{
  name: string;
  city: string;
  state: string;
  levels: string[];
}> = [
  { name: "Banyan — Boca Raton", city: "Boca Raton", state: "FL", levels: ["Medical Detox", "Residential", "PHP", "IOP"] },
  { name: "Banyan — Pompano Beach", city: "Pompano Beach", state: "FL", levels: ["Residential", "PHP", "IOP"] },
  { name: "Banyan — Gilman", city: "Gilman", state: "IL", levels: ["Medical Detox", "Residential", "Dual Diagnosis"] },
  { name: "Banyan — Wauchula", city: "Wauchula", state: "FL", levels: ["Residential", "PHP"] },
  { name: "Banyan — Philadelphia", city: "Philadelphia", state: "PA", levels: ["PHP", "IOP", "Outpatient"] },
  { name: "Banyan — Semmes", city: "Semmes", state: "AL", levels: ["Medical Detox", "Residential", "MAT"] },
  { name: "Banyan — Castle Rock", city: "Castle Rock", state: "CO", levels: ["Residential", "PHP", "IOP"] },
  { name: "Banyan — Keene", city: "Keene", state: "NH", levels: ["Residential", "IOP"] },
  { name: "Banyan — Langhorne", city: "Langhorne", state: "PA", levels: ["PHP", "IOP", "Outpatient"] },
  { name: "Banyan — Wilmington", city: "Wilmington", state: "DE", levels: ["IOP", "Outpatient", "MAT"] },
  { name: "Banyan — Stuart", city: "Stuart", state: "FL", levels: ["Medical Detox", "Residential", "PHP"] },
  { name: "Banyan — Chicago", city: "Chicago", state: "IL", levels: ["PHP", "IOP", "Outpatient"] },
];

const ORG: OrgSheetData = {
  id: "preview-banyan",
  name: "Banyan Treatment Centers",
  slug: "banyan",
  logo_url: null,
  description:
    "National behavioral-health network offering medical detox, residential, PHP, and IOP across multiple states. One referral contact, live in-network verification by location, and monthly contract confirmation so partners always work from current coverage.",
  tagline: "One referral network. Verified in-network coverage by location.",
  website: "https://www.banyantreatmentcenter.com",
  hq_city: "Pompano Beach",
  hq_state: "FL",
  brand_color: "#0f6b6b",
  accent_color: "#1a9a9a",
  cover_image_url: COVER,
  image_urls: [COVER],
  verified: true,
  created_at: null,
  updated_at: null,
  bd_contact_name: "Jordan Hale",
  bd_contact_phone: "(954) 555-0142",
  bd_contact_email: "referrals@banyantreatmentcenter.com",
  program_badges: ["Detox", "Residential", "PHP", "IOP"],
  announcement: null,
  why_refer: [],
};

function buildFacilities(): ShowcaseFacility[] {
  return LOCATIONS.map((loc, i) => ({
    id: `banyan-fac-${i + 1}`,
    name: loc.name,
    slug: `banyan-${loc.city.toLowerCase().replace(/\s+/g, "-")}`,
    city: loc.city,
    state: loc.state,
    address_line1: null,
    zip: null,
    image_urls: [PHOTOS[i % PHOTOS.length]],
    levels_of_care: loc.levels,
    population_served: ["Adults (18+)", "Dual Diagnosis"],
    specializations: ["Substance Use", "Co-Occurring"],
    highlights: [],
    accreditations: ["Joint Commission"],
    short_description: `${loc.levels.join(", ")} with in-network contracts verified monthly.`,
    description: null,
    tagline: null,
    insurance_status: "in_network",
    featured_payer: SHARED_PAYERS[0],
    hidden_from_org_page: false,
  }));
}

const PROFILE_URL = "https://www.centerlinked.com/o/banyan";
const QR_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&margin=0&color=1a2332&bgcolor=ffffff&data=" +
  encodeURIComponent(PROFILE_URL);

export default function OrgOnePagerPreview() {
  const facilities = useMemo(() => buildFacilities(), []);
  const payersById = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const f of facilities) map[f.id] = SHARED_PAYERS;
    return map;
  }, [facilities]);

  const model = useMemo(
    () =>
      buildOrgOnePagerModel({
        org: ORG,
        facilities,
        facilityPayersById: payersById,
        brandColor: ORG.brand_color ?? undefined,
        profileUrl: PROFILE_URL,
        overviewOverride: ORG.description,
      }),
    [facilities, payersById],
  );

  const [pageIndex, setPageIndex] = useState(0);
  const page = model.pages[pageIndex] ?? model.pages[0];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#e8ecf0",
        padding: "32px 24px 64px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: LETTER_WIDTH_PX, margin: "0 auto 20px" }}>
        <p
          style={{
            margin: 0,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#5a6573",
          }}
        >
          Design preview · Org referral overview PDF
        </p>
        <h1
          style={{
            margin: "6px 0 8px",
            fontFamily: "Montserrat, Inter, sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#152033",
          }}
        >
          {model.orgName}
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 14,
            color: "#5a6573",
            lineHeight: 1.45,
          }}
        >
          Letter-size export as partners receive it — cover + insurance directory for a
          multi-state network ({model.facilityCount} locations · {model.pages.length} pages).
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {model.pages.map((p, i) => (
            <button
              key={`${p.kind}-${p.pageNumber}`}
              type="button"
              onClick={() => setPageIndex(i)}
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: 8,
                border: i === pageIndex ? "2px solid #0f6b6b" : "1px solid #c5ccd6",
                background: i === pageIndex ? "#0f6b6b" : "#fff",
                color: i === pageIndex ? "#fff" : "#152033",
                cursor: "pointer",
              }}
            >
              {p.kind === "cover" ? "Cover" : `Directory ${p.pageNumber - 1}`}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          width: LETTER_WIDTH_PX,
          margin: "0 auto",
          boxShadow: "0 18px 50px rgba(21, 32, 51, 0.18)",
          borderRadius: 2,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <OrgOnePager
          model={model}
          page={page}
          resolvedLogoUrl={null}
          resolvedCoverUrl={page.kind === "cover" ? COVER : null}
          resolvedPhotoUrls={{}}
          resolvedQrUrl={page.kind === "cover" ? QR_URL : null}
          hidePlatformMark={false}
        />
      </div>

      <p
        style={{
          maxWidth: LETTER_WIDTH_PX,
          margin: "16px auto 0",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 12,
          color: "#8b949e",
          textAlign: "center",
        }}
      >
        {LETTER_WIDTH_PX}×{LETTER_HEIGHT_PX}px · same canvas as Export PDF on the public org sheet
      </p>
    </main>
  );
}
