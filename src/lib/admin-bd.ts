import { supabase } from "@/integrations/supabase/client";
import { normalizeBdEmail } from "@/lib/bd-contact";

export async function syncPrimaryBdAssignment(args: {
  facilityId: string;
  organizationId: string;
  organizationName?: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  title?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = args.name?.trim() ?? "";
  const phone = args.phone?.trim() || null;
  const email = normalizeBdEmail(args.email);
  const title = args.title?.trim() || null;

  if (!name) {
    const { error } = await supabase
      .from("facility_bd_assignments")
      .update({ is_primary: false })
      .eq("facility_id", args.facilityId)
      .eq("is_primary", true);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { data: existing, error: findError } = await supabase
    .from("bd_representatives")
    .select("id,email,phone,title")
    .eq("organization_id", args.organizationId)
    .ilike("full_name", name);
  if (findError) return { ok: false, error: findError.message };

  const match = (existing ?? []).find((row) => (row.email ?? "").trim().toLowerCase() === (email ?? ""));
  let representativeId = match?.id ?? null;

  if (representativeId) {
    const { error } = await supabase
      .from("bd_representatives")
      .update({
        phone: phone ?? match?.phone ?? null,
        title: title ?? match?.title ?? null,
        organization_name: args.organizationName ?? null,
        email,
      })
      .eq("id", representativeId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await supabase
      .from("bd_representatives")
      .insert({
        organization_id: args.organizationId,
        organization_name: args.organizationName ?? null,
        full_name: name,
        email,
        phone,
        title,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message || "Could not save representative" };
    representativeId = data.id;
  }

  const { error: demoteError } = await supabase
    .from("facility_bd_assignments")
    .update({ is_primary: false })
    .eq("facility_id", args.facilityId)
    .eq("is_primary", true)
    .neq("representative_id", representativeId);
  if (demoteError) return { ok: false, error: demoteError.message };

  const { data: assignment, error: assignFindError } = await supabase
    .from("facility_bd_assignments")
    .select("id")
    .eq("facility_id", args.facilityId)
    .eq("representative_id", representativeId)
    .maybeSingle();
  if (assignFindError) return { ok: false, error: assignFindError.message };

  if (assignment) {
    const { error } = await supabase
      .from("facility_bd_assignments")
      .update({ is_primary: true })
      .eq("id", assignment.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await supabase.from("facility_bd_assignments").insert({
    facility_id: args.facilityId,
    representative_id: representativeId,
    is_primary: true,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function listFacilityBdAssignments(facilityId: string) {
  return supabase
    .from("facility_bd_assignments")
    .select(
      "id,is_primary,representative_id,bd_representatives(id,full_name,title,email,phone,availability_status,territory,states_covered,payer_expertise,preferred_contact_method,last_verified_at)",
    )
    .eq("facility_id", facilityId)
    .order("is_primary", { ascending: false });
}
