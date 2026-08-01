-- Organization social profile links for the public shared-page footer.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS social_facebook_url text,
  ADD COLUMN IF NOT EXISTS social_instagram_url text,
  ADD COLUMN IF NOT EXISTS social_linkedin_url text,
  ADD COLUMN IF NOT EXISTS social_x_url text;
