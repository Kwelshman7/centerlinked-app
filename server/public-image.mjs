import { fetchSafeImageBuffer } from "./safe-image-fetch.mjs";

/**
 * Same-origin proxy for public org/facility photos used by PDF capture.
 * Browser canvas cannot read WordPress (and similar) hosts due to CORS.
 */
export async function handlePublicImage(rawUrl) {
  const image = await fetchSafeImageBuffer(rawUrl);
  if (!image) {
    return { status: 404, headers: { "Cache-Control": "public, max-age=60" }, body: null };
  }
  return {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
    body: image.buffer,
  };
}
