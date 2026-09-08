-- Private org-scoped PDF storage for facility one-pagers.
-- Paste into the Supabase SQL Editor. Idempotent.
--
-- Why: the app uploads to bucket `facility-pdfs` at `<organization_id>/<file>`.
-- The bucket was documented but missing live, so uploads failed with
-- "Bucket not found". Members could not keep or reopen those files.
--
-- After this:
--   Private bucket `facility-pdfs` exists (15MB, PDF only).
--   Org members and super admins can read/write objects whose first folder
--   is their organization id.
--   Super admins can insert `facility_pdf_uploads` rows for any org so the
--   file is listed for that org's members.
--
-- Does not change public sheets, billing, or `save_facility_with_contracts`.
-- Rollback: drop the four storage policies, optionally delete the bucket.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'facility-pdfs',
  'facility-pdfs',
  false,
  15728640,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- First path segment is organization_id (see PdfFacilityUpload storage_path).
CREATE OR REPLACE FUNCTION public.facility_pdf_object_org_id(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN split_part(object_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN split_part(object_name, '/', 1)::uuid
      ELSE NULL
    END
$$;

REVOKE ALL ON FUNCTION public.facility_pdf_object_org_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.facility_pdf_object_org_id(text) TO authenticated;

DROP POLICY IF EXISTS "Org members can read facility PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload facility PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update facility PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete facility PDFs" ON storage.objects;

CREATE POLICY "Org members can read facility PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'facility-pdfs'
  AND public.facility_pdf_object_org_id(name) IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.is_org_member(auth.uid(), public.facility_pdf_object_org_id(name))
  )
);

CREATE POLICY "Org members can upload facility PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'facility-pdfs'
  AND public.facility_pdf_object_org_id(name) IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.is_org_member(auth.uid(), public.facility_pdf_object_org_id(name))
  )
);

CREATE POLICY "Org members can update facility PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'facility-pdfs'
  AND public.facility_pdf_object_org_id(name) IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.is_org_member(auth.uid(), public.facility_pdf_object_org_id(name))
  )
)
WITH CHECK (
  bucket_id = 'facility-pdfs'
  AND public.facility_pdf_object_org_id(name) IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.is_org_member(auth.uid(), public.facility_pdf_object_org_id(name))
  )
);

CREATE POLICY "Org members can delete facility PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'facility-pdfs'
  AND public.facility_pdf_object_org_id(name) IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.is_org_member(auth.uid(), public.facility_pdf_object_org_id(name))
  )
);

-- Super admins importing for an org they do not belong to still create a
-- listing row members can see. SELECT already allowed super_admin.
DROP POLICY IF EXISTS "Org members can insert PDF uploads for their org" ON public.facility_pdf_uploads;
CREATE POLICY "Org members can insert PDF uploads for their org"
ON public.facility_pdf_uploads
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND (
    public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);
