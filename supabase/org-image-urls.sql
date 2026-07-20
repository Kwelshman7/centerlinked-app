-- Organization photo gallery + hero selection (cover_image_url = selected hero).
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

-- Backfill: existing cover becomes the gallery when gallery is empty.
UPDATE public.organizations
SET image_urls = ARRAY[cover_image_url]
WHERE cover_image_url IS NOT NULL
  AND cover_image_url <> ''
  AND (image_urls IS NULL OR image_urls = '{}');
