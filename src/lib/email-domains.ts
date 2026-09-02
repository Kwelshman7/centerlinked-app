import { supabase } from "@/integrations/supabase/client";

// Personal email domains that are NOT allowed for CenterLinked login/signup
// unless explicitly approved by a super admin.
export const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "mail.com",
  "gmx.com",
  "zoho.com",
  "yandex.com",
  "fastmail.com",
  "tutanota.com",
  "duck.com",
]);

export function getEmailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isPersonalEmail(email: string): boolean {
  return PERSONAL_EMAIL_DOMAINS.has(getEmailDomain(email));
}

/** Server-backed gate: company domains, approved personal emails, or bootstrap admins. */
export async function isEmailAuthAllowed(email: string): Promise<boolean> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return false;

  const { data, error } = await supabase.rpc("is_email_auth_allowed", { _email: trimmed });
  if (error) {
    console.warn("is_email_auth_allowed: RPC unavailable");
    return false;
  }
  return !!data;
}

export const PERSONAL_EMAIL_BLOCKED_MESSAGE = {
  title: "Please use your work email",
  description:
    "Personal addresses (Gmail, Yahoo, Outlook, iCloud) are blocked unless CenterLinked approved that exact email. Use the approved address with a password — Google signs in a different email.",
} as const;
