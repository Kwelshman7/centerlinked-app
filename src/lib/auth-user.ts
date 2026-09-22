const FIRST_RUN_KEY = "cl_first_run";
const FIRST_RUN_TTL_MS = 24 * 60 * 60 * 1000;

/** True when the auth user was created in the last two minutes (first-run routing). */
export function isLikelyNewUser(createdAt: string | undefined) {
  if (!createdAt) return false;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return false;
  return Date.now() - createdMs < 2 * 60 * 1000;
}

function readFirstRunStoredAt() {
  try {
    const raw = localStorage.getItem(FIRST_RUN_KEY);
    if (!raw) return null;
    const at = Number(raw);
    if (!Number.isFinite(at) || Date.now() - at > FIRST_RUN_TTL_MS) {
      localStorage.removeItem(FIRST_RUN_KEY);
      return null;
    }
    return at;
  } catch {
    return null;
  }
}

/**
 * Cross-tab flag so a delayed email-confirm (often a new tab) still gets
 * skippable org setup. Expires after 24 hours.
 */
export function setFirstRunSignup() {
  try {
    localStorage.setItem(FIRST_RUN_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
}

export function consumeFirstRunSignup() {
  const next = readFirstRunStoredAt() !== null;
  try {
    localStorage.removeItem(FIRST_RUN_KEY);
  } catch {
    /* private mode */
  }
  return next;
}

/** First-run if this browser just signed up, or the auth user was created moments ago. */
export function isFirstRunUser(createdAt: string | undefined) {
  if (readFirstRunStoredAt() !== null) return true;
  return isLikelyNewUser(createdAt);
}

/** Name from signup metadata or Google. Used to prefill the referral contact. */
export function fullNameFromAuthUser(user: {
  user_metadata?: { full_name?: unknown; name?: unknown } | null;
} | null | undefined): string | null {
  const meta = user?.user_metadata;
  if (typeof meta?.full_name === "string" && meta.full_name.trim()) return meta.full_name.trim();
  if (typeof meta?.name === "string" && meta.name.trim()) return meta.name.trim();
  return null;
}
