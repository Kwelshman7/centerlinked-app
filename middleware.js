import { isPublicSharePath, isSocialPreviewBot } from "./server/og-meta.mjs";

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") ?? "";

  if (!isSocialPreviewBot(userAgent) || !isPublicSharePath(url.pathname)) {
    return;
  }

  const rewriteUrl = new URL("/api/og", url.origin);
  rewriteUrl.searchParams.set("path", url.pathname);
  return Response.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/((?!api/|assets/|favicon\\.png|robots\\.txt|sitemap\\.xml|llms\\.txt).*)"],
};
