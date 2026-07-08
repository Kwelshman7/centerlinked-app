/**
 * Generates SQL to apply processed image URLs when service-role writes aren't available.
 */
export function escSql(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function imageUrlsSql(urls) {
  if (!urls.length) return "ARRAY[]::text[]";
  return `ARRAY[${urls.map((u) => escSql(u)).join(", ")}]::text[]`;
}

export function buildFacilityImageUpdateSql(facilityId, imageUrls) {
  return `UPDATE public.facilities SET image_urls = ${imageUrlsSql(imageUrls)}, updated_at = now() WHERE id = ${escSql(facilityId)}::uuid;`;
}

export function buildApplyScript(reports) {
  const statements = reports
    .filter((r) => r.finalUrls?.length >= 4)
    .map((r) => buildFacilityImageUpdateSql(r.facilityId, r.finalUrls.slice(0, 7)));

  return `-- Facility image pipeline apply script\n-- Generated ${new Date().toISOString()}\n-- Run in Supabase Dashboard → SQL Editor\nBEGIN;\n${statements.join("\n")}\nCOMMIT;\n`;
}
