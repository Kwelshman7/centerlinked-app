import { isPublicSharePath, isSocialPreviewBot } from "./server/og-share.mjs";

export default async function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") ?? "";

  if (!isSocialPreviewBot(userAgent) || !isPublicSharePath(url.pathname)) {
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
