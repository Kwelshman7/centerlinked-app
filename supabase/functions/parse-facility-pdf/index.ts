// Reads an org-scoped facility one-pager and returns structured org/facility/payer
// fields. The browser uploads the PDF to `facility-pdfs` first, then sends
// `storage_path` so this function never receives a multi-megabyte body.
//
// Extracts only what is on the page. Does not invent payers, addresses, or names.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_ATTACH_BYTES = 10 * 1024 * 1024;

const SYSTEM = `You extract behavioral-health treatment organization data from a one-pager PDF.
Read every page, including columns, tables, logos, and small print.
Return JSON only. Never invent facts that are not on the document.
If a field is truly absent, use null or []. Do not leave a field empty when the page shows it.
Map levels of care to these labels when they clearly match:
Detox, Residential, PHP, IOP, Mental Health Residential, Mental Health PHP/IOP, Outpatient, Sober Living, MAT, Dual Diagnosis.
One facility object per location. Split insurance by facility when listed per site.
Copy every visible insurance / payer name into payers_in_network. Logo text counts if you can read the brand.
Copy addresses, phones, websites, and referral/BD contacts when shown.
Keep payer names as written on the page.

JSON shape:
{
  "organization": {
    "name": string,
    "website": string|null,
    "description": string|null,
    "phone": string|null,
    "hq_city": string|null,
    "hq_state": string|null
  },
  "facilities": [
    {
      "name": string,
      "tagline": string|null,
      "address_line1": string|null,
      "city": string|null,
      "state": string|null,
      "zip": string|null,
      "phone": string|null,
      "website": string|null,
      "description": string|null,
      "capacity": number|null,
      "levels_of_care": string[],
      "highlights": string[],
      "bd_contact_name": string|null,
      "bd_contact_phone": string|null,
      "bd_contact_email": string|null,
      "payers_in_network": string[],
      "payers_out_of_network": string[]
    }
  ]
}`;

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

function extractPdfText(bytes: Uint8Array): string {
  const raw = new TextDecoder("latin1").decode(bytes);
  const chunks: string[] = [];
  const re = /\((?:\\.|[^\\)]){2,}\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const value = match[0]
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");
    if (/[A-Za-z]{3,}/.test(value)) chunks.push(value);
  }
  return chunks.join(" ").replace(/\s+/g, " ").trim().slice(0, 40000);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x2000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    let part = "";
    for (let j = 0; j < slice.length; j++) part += String.fromCharCode(slice[j]);
    binary += part;
  }
  return btoa(binary);
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asStringArray(value: unknown): string[] {
  const parts = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;\n•|]/)
      : [];
  return parts
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 80);
}

function firstStringArray(...candidates: unknown[]): string[] {
  for (const candidate of candidates) {
    const items = asStringArray(candidate);
    if (items.length) return items;
  }
  return [];
}

function normalizePayload(raw: unknown): { organization: Record<string, unknown>; facilities: unknown[] } | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const organization = (body.organization && typeof body.organization === "object")
    ? body.organization as Record<string, unknown>
    : {};
  const facilities = Array.isArray(body.facilities) ? body.facilities : [];
  return { organization, facilities };
}

function parseModelJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed);
}

function responsesOutputText(aiJson: Record<string, unknown>): string {
  if (typeof aiJson.output_text === "string" && aiJson.output_text.trim()) {
    return aiJson.output_text;
  }
  const parts: string[] = [];
  const output = Array.isArray(aiJson.output) ? aiJson.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") parts.push(text);
    }
  }
  return parts.join("\n");
}

function openaiClientMessage(status: number, detail: string): string {
  if (status === 401) return "OpenAI rejected the API key";
  if (status === 429) return "OpenAI rate limit — try again in a minute";
  const compact = detail.replace(/\s+/g, " ").slice(0, 180);
  if (status === 400 && compact) return `Couldn't read that PDF (${compact})`;
  return `Couldn't read that PDF (OpenAI ${status})`;
}

async function callChatCompletions(openaiKey: string, userPrompt: string): Promise<string> {
  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!aiRes.ok) {
    const detail = await aiRes.text();
    console.error("[parse-facility-pdf] openai chat failed", aiRes.status, detail.slice(0, 500));
    throw Object.assign(new Error(openaiClientMessage(aiRes.status, detail)), { status: 502 });
  }
  const aiJson = await aiRes.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = aiJson.choices?.[0]?.message?.content ?? "";
  if (!raw.trim()) throw Object.assign(new Error("Couldn't read that PDF"), { status: 502 });
  return raw;
}

async function callResponsesWithPdf(
  openaiKey: string,
  filename: string,
  pdfBytes: Uint8Array,
  extraText: string,
): Promise<string> {
  if (pdfBytes.byteLength > MAX_ATTACH_BYTES) {
    throw Object.assign(
      new Error("This PDF is too large to read as a scan. Try a smaller or text-based one-pager."),
      { status: 422 },
    );
  }
  const prompt = extraText
    ? `Read the attached PDF pages. Extract every facility, address, phone, website, level of care, referral contact, and insurance/payer name into JSON. Do not add anything that is not on the page.\n\nPartial extracted text (may be incomplete — prefer the PDF):\n${extraText}`
    : "Read the attached PDF pages. Extract every facility, address, phone, website, level of care, referral contact, and insurance/payer name into JSON. Do not add anything that is not on the page.";
  const aiRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      input: [{
        role: "user",
        content: [
          {
            type: "input_file",
            filename,
            file_data: `data:application/pdf;base64,${bytesToBase64(pdfBytes)}`,
            detail: "high",
          },
          { type: "input_text", text: prompt },
        ],
      }],
      instructions: SYSTEM,
      text: { format: { type: "json_object" } },
    }),
  });
  if (!aiRes.ok) {
    const detail = await aiRes.text();
    console.error("[parse-facility-pdf] openai responses failed", aiRes.status, detail.slice(0, 500));
    throw Object.assign(new Error(openaiClientMessage(aiRes.status, detail)), { status: 502 });
  }
  const aiJson = await aiRes.json() as Record<string, unknown>;
  const raw = responsesOutputText(aiJson);
  if (!raw.trim()) throw Object.assign(new Error("Couldn't read that PDF"), { status: 502 });
  return raw;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!supabaseUrl || !serviceRole || !anonKey) {
      console.error("[parse-facility-pdf] missing Supabase env");
      return json({ error: "Not configured" }, 503);
    }
    if (!openaiKey) {
      return json({ error: "PDF parsing is not configured (missing OPENAI_API_KEY)" }, 503);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Sign in required" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const storagePath = asString(body.storage_path);
    const filename = asString(body.filename) ?? "facility.pdf";
    const inlineB64 = asString(body.pdf_base64);

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    if (!userRes.ok) return json({ error: "Sign in required" }, 401);
    const user = (await userRes.json()) as { id?: string };
    const uid = user.id;
    if (!uid) return json({ error: "Sign in required" }, 401);

    const rest = `${supabaseUrl}/rest/v1`;
    const admin = {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
    };

    let pdfBytes: Uint8Array | null = null;
    const orgId: string | null = storagePath ? orgIdFromPath(storagePath) : null;

    if (storagePath) {
      if (!orgId) return json({ error: "Invalid storage_path" }, 400);
      const rolesRes = await fetch(
        `${rest}/user_roles?user_id=eq.${uid}&role=eq.super_admin&select=role&limit=1`,
        { headers: admin },
      );
      const roles = rolesRes.ok ? (await rolesRes.json()) as Array<{ role: string }> : [];
      const isSuper = roles.length > 0;
      if (!isSuper) {
        const memRes = await fetch(
          `${rest}/organization_members?user_id=eq.${uid}&organization_id=eq.${orgId}&select=user_id&limit=1`,
          { headers: admin },
        );
        const members = memRes.ok ? (await memRes.json()) as Array<{ user_id: string }> : [];
        if (!members.length) return json({ error: "Not allowed for this organization" }, 403);
      }

      const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
      const fileRes = await fetch(
        `${supabaseUrl}/storage/v1/object/facility-pdfs/${encodedPath}`,
        { headers: { Authorization: `Bearer ${serviceRole}`, apikey: serviceRole } },
      );
      if (!fileRes.ok) {
        console.error("[parse-facility-pdf] storage download failed", fileRes.status, await fileRes.text());
        return json({ error: "Could not read the stored PDF" }, 502);
      }
      const buf = new Uint8Array(await fileRes.arrayBuffer());
      if (buf.byteLength > MAX_BYTES) return json({ error: "PDF is too large" }, 400);
      pdfBytes = buf;
    } else if (inlineB64) {
      try {
        const bin = atob(inlineB64);
        if (bin.length > MAX_BYTES) return json({ error: "PDF is too large" }, 400);
        pdfBytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      } catch {
        return json({ error: "Invalid pdf_base64" }, 400);
      }
    } else {
      return json({ error: "storage_path is required" }, 400);
    }

    const text = extractPdfText(pdfBytes);
    let rawText: string;
    if (pdfBytes.byteLength <= MAX_ATTACH_BYTES) {
      try {
        rawText = await callResponsesWithPdf(openaiKey, filename, pdfBytes, text);
      } catch (err) {
        if (text.length < 80) throw err;
        console.error("[parse-facility-pdf] pdf attach failed, falling back to text", (err as Error).message);
        rawText = await callChatCompletions(
          openaiKey,
          `Extract organization, facilities, and insurance from this one-pager text. Return JSON. Do not add anything that is not present.\n\n${text}`,
        );
      }
    } else if (text.length >= 80) {
      rawText = await callChatCompletions(
        openaiKey,
        `Extract organization, facilities, and insurance from this one-pager text. Return JSON. Do not add anything that is not present.\n\n${text}`,
      );
    } else {
      throw Object.assign(
        new Error("This PDF is too large to read as a scan. Try a smaller or text-based one-pager."),
        { status: 422 },
      );
    }

    let parsed: unknown;
    try {
      parsed = parseModelJson(rawText);
    } catch {
      console.error("[parse-facility-pdf] model returned non-JSON");
      return json({ error: "Couldn't read that PDF" }, 502);
    }

    const normalized = normalizePayload(parsed);
    if (!normalized) return json({ error: "Couldn't read that PDF" }, 502);

    const facilities = normalized.facilities
      .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
      .map((row) => ({
        name: asString(row.name) ?? "Untitled facility",
        tagline: asString(row.tagline),
        address_line1: asString(row.address_line1),
        city: asString(row.city),
        state: asString(row.state),
        zip: asString(row.zip),
        phone: asString(row.phone),
        website: asString(row.website),
        description: asString(row.description),
        capacity: typeof row.capacity === "number" ? row.capacity : null,
        levels_of_care: firstStringArray(row.levels_of_care, row.levels, row.level_of_care),
        highlights: asStringArray(row.highlights),
        bd_contact_name: asString(row.bd_contact_name) ?? asString(row.contact_name),
        bd_contact_phone: asString(row.bd_contact_phone) ?? asString(row.contact_phone),
        bd_contact_email: asString(row.bd_contact_email) ?? asString(row.contact_email),
        payers_in_network: firstStringArray(
          row.payers_in_network,
          row.in_network_payers,
          row.insurance,
          row.payers,
        ),
        payers_out_of_network: firstStringArray(row.payers_out_of_network, row.out_of_network_payers),
      }))
      .filter((row) => row.name.trim());

    if (!facilities.length) {
      return json({ error: "No facilities detected in the PDF" }, 422);
    }

    return json({
      organization: {
        name: asString(normalized.organization.name) ?? "",
        website: asString(normalized.organization.website),
        description: asString(normalized.organization.description),
        phone: asString(normalized.organization.phone),
        hq_city: asString(normalized.organization.hq_city),
        hq_state: asString(normalized.organization.hq_state),
      },
      facilities,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't read that PDF";
    const status = (err as { status?: number })?.status;
    console.error("[parse-facility-pdf] uncaught", message);
    return json({ error: message }, typeof status === "number" ? status : 500);
  }
});
