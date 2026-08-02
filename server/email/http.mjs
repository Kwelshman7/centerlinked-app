const MAX_JSON_BODY_BYTES = 32 * 1024;

/**
 * Read JSON body from a Node IncomingMessage (Vite middleware or Vercel).
 * Rejects bodies larger than 32kb.
 */
export async function readJsonBody(req, maxBytes = MAX_JSON_BODY_BYTES) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    total += buf.length;
    if (total > maxBytes) {
      const err = new Error("Request body too large");
      err.code = "BODY_TOO_LARGE";
      throw err;
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function sendJson(res, status, json) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(json));
}

export function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}
