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

export type EmailAuthGateResult = "allowed" | "blocked" | "unavailable";

/** Map the work-email RPC to allowed / blocked / transport-down. Invalid emails stay blocked. */
export function resolveEmailAuthGate(
  email: string,
  result: { data: unknown; error: { message?: string } | null },
): EmailAuthGateResult {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return "blocked";
  if (result.error) return "unavailable";
  return result.data ? "allowed" : "blocked";
}

const EMAIL_AUTH_GATE_TIMEOUT_MS = 12_000;

/** Server-backed gate: company domains, approved personal emails, or bootstrap admins. */
export async function emailAuthGate(email: string): Promise<EmailAuthGateResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return "blocked";

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<{ data: null; error: { message: string } }>((resolve) => {
    timeoutId = setTimeout(
      () => resolve({ data: null, error: { message: "timed out" } }),
      EMAIL_AUTH_GATE_TIMEOUT_MS,
    );
  });
  const result = await Promise.race([
    supabase.rpc("is_email_auth_allowed", { _email: trimmed }),
    timedOut,
  ]);
  if (timeoutId) clearTimeout(timeoutId);
  if (result.error) {
    console.warn("is_email_auth_allowed: RPC unavailable");
  }
  return resolveEmailAuthGate(trimmed, result);
}

/** Fail-closed for signup, login, and invite. Do not use this to sign out an existing session. */
export async function isEmailAuthAllowed(email: string): Promise<boolean> {
  return (await emailAuthGate(email)) === "allowed";
}

export const PERSONAL_EMAIL_BLOCKED_MESSAGE = {
  title: "Please use your work email",
  description:
    "Personal addresses (Gmail, Yahoo, Outlook, iCloud) are blocked unless CenterLinked approved that exact email. Use the approved address with a password — Google signs in a different email.",
} as const;

export const EMAIL_AUTH_UNAVAILABLE_MESSAGE = {
  title: "Couldn't verify your work email",
  description: "Try again in a moment. If this continues, refresh the page.",
} as const;

export const EMAIL_AUTH_UNAVAILABLE_SIGNED_IN_MESSAGE = {
  title: "Couldn't verify your work email",
  description: "Stay signed in and refresh. If this continues, try signing in again.",
} as const;
