import { isPublicSharePath, isSocialPreviewBot } from "./server/og-share.mjs";
import { isMarketingMetaPath, isNonBrowserClient } from "./server/marketing-meta.mjs";

export default async function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") ?? "";

  // Two reasons to serve the prerendered head instead of the SPA shell:
  //   1. A social crawler on a public org or program share URL (org-branded
  //      title, description and generated share card).
  //   2. Any non-browser client on a marketing route. This is a single-page
  //      app, so without it every route would serve the homepage's title and
  //      description to anything that does not run JavaScript.
  // Browsers fall through to the static shell and get the same values from
  // `useMarketingMeta` after hydration, so they never pay for this hop.
  const shareBot = isSocialPreviewBot(userAgent) && isPublicSharePath(url.pathname);
  const marketingFetch = isNonBrowserClient(userAgent) && isMarketingMetaPath(url.pathname);

  if (!shareBot && !marketingFetch) {
    return;
  }

  // Proxy through the Node /api/og handler. Avoid Response.rewrite — it throws
  // on Edge and surfaces as MIDDLEWARE_INVOCATION_FAILED for crawlers.
  const ogUrl = new URL("/api/og", url.origin);
  ogUrl.searchParams.set("path", url.pathname);
  return fetch(ogUrl, {
    headers: { "user-agent": userAgent },
  });
}

export const config = {
  matcher: ["/((?!api/|assets/|favicon\\.png|og-image\\.png|robots\\.txt|sitemap\\.xml|llms\\.txt).*)"],
};
