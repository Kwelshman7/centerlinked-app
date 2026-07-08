import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE } from "./env.mjs";

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env — pipeline writes require the service role key.",
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
}

export function hasServiceRole() {
  return Boolean(SUPABASE_SERVICE_ROLE);
}

export async function fetchFacilitiesNeedingImages(minImages = 4) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("facilities")
    .select("id,name,slug,website,image_urls,city,state,organization_id,address_line1")
    .order("name");

  if (error) throw new Error(error.message);

  return (data ?? []).filter((f) => {
    const count = f.image_urls?.length ?? 0;
    return count < minImages;
  });
}

export async function updateFacilityImages(facilityId, imageUrls) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("facilities")
    .update({ image_urls: imageUrls })
    .eq("id", facilityId)
    .select("id,image_urls");

  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error("Update blocked — no rows modified.");
  }
  return data[0];
}

export async function uploadFacilityImage(facilityId, buffer, ext = "jpg") {
  const supabase = getSupabase();
  const path = `pipeline/${facilityId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const { error } = await supabase.storage.from("facility-images").upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from("facility-images").getPublicUrl(path);
  return data.publicUrl;
}
