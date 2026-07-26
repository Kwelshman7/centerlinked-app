-- Extend early_access_leads so the public form + admin Access Requests UI share one table.
-- Run in Supabase SQL Editor (or via your migration process).

ALTER TABLE public.early_access_leads
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Backfill any legacy rows
UPDATE public.early_access_leads
SET status = 'pending'
WHERE status IS NULL;

ALTER TABLE public.early_access_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "early_access_leads_admin_update" ON public.early_access_leads;
CREATE POLICY "early_access_leads_admin_update"
ON public.early_access_leads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));
