import dns from "node:dns/promises";
import { isBlockedIpAddress, isSafeHttpsImageUrl } from "./og-share.mjs";

const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_MS = 8_000;
const MAX_REDIRECTS = 4;

const IMAGE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/x-png",
]);

function sniffContentType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png";
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
    return "image/x-icon";
  }
  if (buf[0] === 0x42 && buf[1] === 0x4d) return "image/bmp";
  return null;
}

function normalizeType(type, buf) {
  const raw = String(type || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (raw === "image/svg+xml" || raw === "text/html" || raw === "application/xml") {
    return null;
  }
  if (ALLOWED_TYPES.has(raw)) return raw === "image/jpg" ? "image/jpeg" : raw;
  if (raw === "application/octet-stream" || raw === "binary/octet-stream" || !raw) {
    return sniffContentType(buf);
  }
  return sniffContentType(buf);
}

function isSelfProxyLoop(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname === "/api/public-image" || parsed.pathname.startsWith("/api/public-image/");
  } catch {
    return true;
  }
}

function resolveRedirect(current, location) {
  if (!location) return null;
  try {
    return new URL(location, current).href;
  } catch {
    return null;
  }
}

/**
 * Resolve hostname and reject private / link-local / metadata targets.
 * Mitigates DNS-rebinding where the URL hostname looks public but answers private.
 */
async function assertPublicHostname(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (!host || isBlockedIpAddress(host)) return false;
  try {
    const records = await dns.lookup(host, { all: true, verbatim: true });
    if (!records.length) return false;
    return records.every((r) => r?.address && !isBlockedIpAddress(r.address));
  } catch {
    return false;
  }
}

async function readBodyCapped(res, maxBytes) {
  const contentLength = Number(res.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return null;
  }

  if (!res.body || typeof res.body.getReader !== "function") {
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > maxBytes) return null;
    return buf;
  }

  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(Buffer.from(value));
    }
  } catch {
    await reader.cancel().catch(() => {});
    return null;
  }

  if (!total) return null;
  return Buffer.concat(chunks, total);
}

/**
 * Fetch a public HTTPS raster image with SSRF guards.
 * Follows a small number of HTTPS redirects; rejects SVG and HTML.
 */
export async function fetchSafeImageBuffer(rawUrl, opts = {}) {
  const maxBytes = opts.maxBytes ?? MAX_BYTES;
  const timeoutMs = opts.timeoutMs ?? FETCH_MS;
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let current = rawUrl.trim();
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isSafeHttpsImageUrl(current) || isSelfProxyLoop(current)) return null;

    let hostname;
    try {
      hostname = new URL(current).hostname;
    } catch {
      return null;
    }
    if (!(await assertPublicHostname(hostname))) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(current, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "User-Agent": IMAGE_UA,
          Referer: `${new URL(current).origin}/`,
        },
      });

      if (res.status >= 300 && res.status < 400) {
        current = resolveRedirect(current, res.headers.get("location"));
        if (!current) return null;
        continue;
      }
      if (!res.ok) return null;

      const buf = await readBodyCapped(res, maxBytes);
      if (!buf) return null;

      const contentType = normalizeType(res.headers.get("content-type"), buf);
      if (!contentType) return null;

      return { buffer: buf, contentType };
    } catch (err) {
      console.error("[safe-image-fetch] failed", err?.message || err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
