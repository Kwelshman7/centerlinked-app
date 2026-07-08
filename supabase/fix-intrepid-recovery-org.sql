-- One-time data fix: allow @intrepidrecovery.com Google / email sign-in via verified org domain.
-- Run after email-signup-eligible.sql.

UPDATE public.organizations
SET email_domain = 'intrepidrecovery.com',
    verified = true,
    updated_at = now()
WHERE slug = 'intrepid-recovery-centers';
