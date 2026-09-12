// Pulls embedded photographs out of an org-scoped facility one-pager so the
// import review step can offer them as facility images.
//
// SCOPE — read this before assuming a missing image is a bug:
// Only JPEG (`/DCTDecode`) image XObjects are returned. A DCTDecode stream is a
// complete JPEG file, so it can be handed back verbatim. PNG-style images
// (`/FlateDecode`) would need inflate plus raw-sample-to-PNG re-encoding, and
// JPX/CCITT need real codecs — none of which is worth a dependency here. In
// practice one-pagers carry photographs as JPEG and logos as PNG, so photos come
// through and some logos will not. Returning fewer, correct images beats
// returning corrupt ones.
//
// Dependency-free on purpose, matching parse-facility-pdf.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_IMAGES = 12;
// Only rejects obvious garbage. Dimensions do the real filtering — byte size is
// a poor proxy, since a flat-colour or heavily-compressed graphic can be under
// 1 KB at full page width.
const MIN_IMAGE_BYTES = 512;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
/** Ignore anything too small to be usable as a facility photo. */
const MIN_DIMENSION = 120;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function orgIdFromPath(path: string): string | null {
  const first = path.split("/")[0] ?? "";
  return UUID_RE.test(first) ? first : null;
}

/** Read width/height from the JPEG SOF marker. Returns null if not parseable. */
function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  let i = 2; // skip SOI
  while (i < bytes.length - 9) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    // SOF0..SOF15, excluding DHT (C4), JPGA (C8) and DAC (CC)
    if (
      marker >= 0xc0 && marker <= 0xcf &&
      marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    ) {
      const height = (bytes[i + 5] << 8) | bytes[i + 6];
      const width = (bytes[i + 7] << 8) | bytes[i + 8];
      if (width > 0 && height > 0) return { width, height };
      return null;
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (len <= 0) return null;
    i += 2 + len;
  }
  return null;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000; // chunked so String.fromCharCode does not blow the stack
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

interface ExtractedImage {
  id: string;
  page: number;
  width: number;
  height: number;
  mime: string;
  data_base64: string;
}

function extractJpegs(bytes: Uint8Array): ExtractedImage[] {
  // latin1 keeps a 1:1 char-to-byte mapping, so string indices are byte offsets.
  const raw = new TextDecoder("latin1").decode(bytes);
  const out: ExtractedImage[] = [];
  let total = 0;
  let searchFrom = 0;
  let ordinal = 0;

  while (out.length < MAX_IMAGES) {
    const streamIdx = raw.indexOf("stream", searchFrom);
    if (streamIdx === -1) break;
    searchFrom = streamIdx + 6;

    // Inspect the dictionary immediately preceding this stream.
    const header = raw.slice(Math.max(0, streamIdx - 3000), streamIdx);
    const dictStart = header.lastIndexOf("<<");
    const dict = dictStart === -1 ? header : header.slice(dictStart);
    if (!/\/Subtype\s*\/Image/.test(dict)) continue;
    if (!/\/DCTDecode/.test(dict)) continue;

    // Payload begins after the EOL that follows the `stream` keyword.
    let start = streamIdx + 6;
    if (raw[start] === "\r") start += 1;
    if (raw[start] === "\n") start += 1;

    const endIdx = raw.indexOf("endstream", start);
    if (endIdx === -1) continue;

    let slice = bytes.subarray(start, endIdx);
    // Trim to the real JPEG boundaries; PDF writers pad with whitespace.
    const soi = slice.indexOf(0xff);
    if (soi === -1 || slice[soi + 1] !== 0xd8) continue;
    if (soi > 0) slice = slice.subarray(soi);

    // Trim trailing padding back to the EOI marker. Decoders stop at EOI anyway,
    // but a clean file round-trips predictably and stores smaller.
    for (let k = slice.length - 2; k >= 2; k--) {
      if (slice[k] === 0xff && slice[k + 1] === 0xd9) {
        slice = slice.subarray(0, k + 2);
        break;
      }
    }

    if (slice.length < MIN_IMAGE_BYTES || slice.length > MAX_IMAGE_BYTES) continue;

    const size = jpegSize(slice);
    if (!size) continue;
    if (size.width < MIN_DIMENSION || size.height < MIN_DIMENSION) continue;

    if (total + slice.length > MAX_TOTAL_BYTES) break;
    total += slice.length;
    ordinal += 1;

    out.push({
      id: `img-${ordinal}`,
      // True page attribution needs full object-graph parsing; this is document
      // order, which is what the review UI displays them in anyway.
      page: ordinal,
      width: size.width,
      height: size.height,
      mime: "image/jpeg",
      data_base64: toBase64(slice),
    });

    searchFrom = endIdx + 9;
  }

  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRole || !anonKey) {
    console.error("[extract-pdf-images] missing environment configuration");
    return json({ error: "Not configured" }, 503);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const storagePath = typeof body.storage_path === "string" ? body.storage_path.trim() : "";
  if (!storagePath) return json({ error: "storage_path is required" }, 400);

  const orgId = orgIdFromPath(storagePath);
  if (!orgId) return json({ error: "Invalid storage_path" }, 400);

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: anonKey },
  });
  if (!userRes.ok) return json({ error: "Unauthorized" }, 401);
  const user = (await userRes.json()) as { id?: string };
  const uid = user?.id;
  if (!uid) return json({ error: "Unauthorized" }, 401);

  const rest = `${supabaseUrl}/rest/v1`;
  const admin = { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` };

  // Same authorization shape as parse-facility-pdf: super admin, or a member of
  // the organization that owns the upload path.
  const rolesRes = await fetch(
    `${rest}/user_roles?user_id=eq.${uid}&role=eq.super_admin&select=role&limit=1`,
    { headers: admin },
  );
  const roles = rolesRes.ok ? ((await rolesRes.json()) as Array<{ role: string }>) : [];
  if (!roles.length) {
    const memRes = await fetch(
      `${rest}/organization_members?user_id=eq.${uid}&organization_id=eq.${orgId}&select=user_id&limit=1`,
      { headers: admin },
    );
    const members = memRes.ok ? ((await memRes.json()) as Array<{ user_id: string }>) : [];
    if (!members.length) return json({ error: "Not allowed for this organization" }, 403);
  }

  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  const fileRes = await fetch(
    `${supabaseUrl}/storage/v1/object/facility-pdfs/${encodedPath}`,
    { headers: admin },
  );
  if (!fileRes.ok) {
    console.error("[extract-pdf-images] storage download failed", fileRes.status);
    return json({ error: "Could not read the uploaded PDF" }, 502);
  }

  const buf = new Uint8Array(await fileRes.arrayBuffer());
  if (buf.length > MAX_PDF_BYTES) return json({ error: "PDF is too large" }, 413);

  try {
    const images = extractJpegs(buf);
    return json({ images });
  } catch (err) {
    console.error("[extract-pdf-images] extraction failed", err);
    return json({ error: "Could not extract images" }, 500);
  }
});
