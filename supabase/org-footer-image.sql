-- Dedicated wide banner image for the public org footer (distinct from square logo).
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS footer_image_url text;
