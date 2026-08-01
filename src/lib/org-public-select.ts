/**
 * Org columns for public pages. Newer columns fall back when migrations
 * (footer_image_url / social_*) are not applied yet.
 */

const SOCIAL =
  "social_facebook_url,social_instagram_url,social_linkedin_url,social_x_url";

export const orgProgramSelect =
  `id,name,logo_url,footer_image_url,${SOCIAL},slug,bd_contact_name,bd_contact_phone,bd_contact_email,website,tagline,brand_color,accent_color,cover_image_url,verified,updated_at`;

export const orgProgramSelectFallback =
  "id,name,logo_url,slug,bd_contact_name,bd_contact_phone,bd_contact_email,website,tagline,brand_color,accent_color,cover_image_url,verified,updated_at";

export const orgSheetSelect =
  `id,name,logo_url,footer_image_url,${SOCIAL},description,tagline,website,hq_city,hq_state,slug,bd_contact_name,bd_contact_phone,bd_contact_email,brand_color,accent_color,cover_image_url,image_urls,verified,created_at,updated_at,program_badges,announcement,why_refer`;

export const orgSheetSelectFallback =
  "id,name,logo_url,description,tagline,website,hq_city,hq_state,slug,bd_contact_name,bd_contact_phone,bd_contact_email,brand_color,accent_color,cover_image_url,image_urls,verified,created_at,updated_at,program_badges,announcement,why_refer";

export function isMissingOptionalOrgColumn(error: { message?: string; code?: string } | null) {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  const missingCol =
    msg.includes("footer_image_url") ||
    msg.includes("social_facebook_url") ||
    msg.includes("social_instagram_url") ||
    msg.includes("social_linkedin_url") ||
    msg.includes("social_x_url");
  return (
    missingCol &&
    (msg.includes("column") || msg.includes("does not exist") || error.code === "42703")
  );
}

/** @deprecated use isMissingOptionalOrgColumn */
export const isMissingFooterImageColumn = isMissingOptionalOrgColumn;

export function orgSocialFromRow(row: {
  social_facebook_url?: string | null;
  social_instagram_url?: string | null;
  social_linkedin_url?: string | null;
  social_x_url?: string | null;
} | null | undefined) {
  if (!row) return null;
  return {
    facebook: row.social_facebook_url ?? null,
    instagram: row.social_instagram_url ?? null,
    linkedin: row.social_linkedin_url ?? null,
    x: row.social_x_url ?? null,
  };
}
