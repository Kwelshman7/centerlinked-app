import { supabase } from "@/integrations/supabase/client";

export interface OrgPdfUpload {
  id: string;
  filename: string;
  storage_path: string;
  size_bytes: number | null;
  status: string | null;
}

export async function loadOrgPdfUploads(organizationId: string): Promise<OrgPdfUpload[]> {
  const { data, error } = await supabase
    .from("facility_pdf_uploads")
    .select("id,filename,storage_path,size_bytes,status")
    .eq("organization_id", organizationId)
    .order("filename");
  if (error) throw error;
  return (data as OrgPdfUpload[]) ?? [];
}

export async function openOrgPdf(storagePath: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from("facility-pdfs")
    .createSignedUrl(storagePath, 60 * 10);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not open that PDF");
  }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
