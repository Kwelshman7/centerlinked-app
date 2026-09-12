import * as Sentry from "@sentry/react";

/**
 * Client-side error reporting.
 *
 * Before this existed the app reported nothing: AppErrorBoundary logged render
 * errors to the console (invisible in production) and there were no global
 * handlers at all, so rejected promises and event-handler failures vanished.
 * Several code paths deliberately swallow errors to protect the UX — analytics,
 * invite sending, one-pager capture — which is correct, but means failures are
 * only visible if something reports them.
 *
 * The DSN is intentionally a `VITE_` value. A Sentry DSN is a public write-only
 * ingest key, designed to ship in browser bundles; it is not a secret and does
 * not violate the "no secrets in VITE_*" rule. It grants no read access.
 *
 * Without `VITE_SENTRY_DSN` every function here is a no-op, so local and
 * preview builds stay silent and nothing breaks if it is never configured.
 */

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

let started = false;

/** Redact anything that looks like an email address. */
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

function redact<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(EMAIL_RE, "[email]") as unknown as T;
  }
  return value;
}

/**
 * CenterLinked holds no PHI, but error payloads can still carry organization
 * names, staff emails, and slugs. Strip what we can before anything leaves the
 * browser rather than relying on scrubbing at the far end.
 */
function scrub(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.message) event.message = redact(event.message);

  for (const value of event.exception?.values ?? []) {
    if (value.value) value.value = redact(value.value);
  }

  // Never ship request bodies, cookies, or headers.
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
    if (event.request.url) event.request.url = redact(event.request.url);
  }

  delete event.user;
  return event;
}

export function initMonitoring() {
  if (started || !DSN) return;
  started = true;

  Sentry.init({
    dsn: DSN,
    // Dev noise is not worth reporting, and it would burn the free-tier quota.
    enabled: import.meta.env.PROD,
    environment: import.meta.env.MODE,
    // Errors only. Performance tracing and session replay are deliberately off:
    // both cost quota and replay would record screens containing partner data.
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: scrub,
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.message) breadcrumb.message = redact(breadcrumb.message);
      // Console breadcrumbs routinely echo payloads; the stack is enough.
      if (breadcrumb.category === "console") return null;
      return breadcrumb;
    },
  });
}

/**
 * Report a caught error explicitly. Safe to call when monitoring is not
 * configured — it simply does nothing.
 */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
