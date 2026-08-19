-- Dedicated favicon for public share-link tab/preview icons (distinct from square logo).
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS favicon_url text;
