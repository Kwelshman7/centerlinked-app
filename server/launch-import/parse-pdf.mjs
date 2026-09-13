const MAX_BYTES = 15 * 1024 * 1024;
const MAX_ATTACH_BYTES = 10 * 1024 * 1024;

const SYSTEM = `You extract behavioral-health treatment organization data from a one-pager PDF.
Read every page, including columns, tables, logos, and small print.
Return JSON only. Never invent facts that are not on the document.
If a field is truly absent, use null or []. Do not leave a field empty when the page shows it.
Map levels of care to these labels when they clearly match:
Detox, Residential, PHP, IOP, Mental Health Residential, Mental Health PHP/IOP, Outpatient, Sober Living, MAT, Dual Diagnosis.
One facility object per location. Split insurance by facility when listed per site.
Copy payer names the document presents as accepted or in-network into payers_in_network. Logo text in an accepted-insurance section counts if you can read the brand.
Copy names the document explicitly marks out of network or not contracted into payers_out_of_network. Do not put the same name in both lists.
If network status is not stated, omit the payer — do not guess in-network or out-of-network. Missing insurance stays unknown.
Copy addresses, phones, websites, and referral/BD contacts only when shown. Do not invent a street, ZIP, or contact.
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

function extractPdfText(bytes) {
  const raw = Buffer.from(bytes).toString("latin1");
  const chunks = [];
  const re = /\((?:\\.|[^\\)]){2,}\)/g;
  let match;
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

function asString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asStringArray(value) {
  const parts = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;\n•|]/)
      : [];
  return parts
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 80);
}

function firstStringArray(...candidates) {
  for (const candidate of candidates) {
    const items = asStringArray(candidate);
    if (items.length) return items;
  }
  return [];
}

function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const organization =
    raw.organization && typeof raw.organization === "object" ? raw.organization : {};
  const facilities = Array.isArray(raw.facilities) ? raw.facilities : [];
  return { organization, facilities };
}

function parseModelJson(raw) {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed);
}

function responsesOutputText(aiJson) {
  if (typeof aiJson.output_text === "string" && aiJson.output_text.trim()) {
    return aiJson.output_text;
  }
  const parts = [];
  const output = Array.isArray(aiJson.output) ? aiJson.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = item.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      if (typeof part.text === "string") parts.push(part.text);
    }
  }
  return parts.join("\n");
}

function openaiClientMessage(status, detail) {
  if (status === 401) return "OpenAI rejected the API key";
  if (status === 429) return "OpenAI rate limit — try again in a minute";
  const compact = String(detail || "").replace(/\s+/g, " ").slice(0, 180);
  if (status === 400 && compact) return `Couldn't read that PDF (${compact})`;
  return `Couldn't read that PDF (OpenAI ${status})`;
}

async function callChatCompletions(openaiKey, userPrompt) {
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
    console.error("[launch-import] openai chat failed", aiRes.status, detail.slice(0, 500));
    const err = new Error(openaiClientMessage(aiRes.status, detail));
    err.status = 502;
    throw err;
  }
  const aiJson = await aiRes.json();
  const raw = aiJson.choices?.[0]?.message?.content ?? "";
  if (!raw.trim()) {
    const err = new Error("Couldn't read that PDF");
    err.status = 502;
    throw err;
  }
  return raw;
}

async function callResponsesWithPdf(openaiKey, filename, pdfBytes, extraText) {
  if (pdfBytes.byteLength > MAX_ATTACH_BYTES) {
    const err = new Error("This PDF is too large to read as a scan. Try a smaller or text-based one-pager.");
    err.status = 422;
    throw err;
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
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename,
              file_data: `data:application/pdf;base64,${Buffer.from(pdfBytes).toString("base64")}`,
              detail: "high",
            },
            { type: "input_text", text: prompt },
          ],
        },
      ],
      instructions: SYSTEM,
      text: { format: { type: "json_object" } },
    }),
  });
  if (!aiRes.ok) {
    const detail = await aiRes.text();
    console.error("[launch-import] openai responses failed", aiRes.status, detail.slice(0, 500));
    const err = new Error(openaiClientMessage(aiRes.status, detail));
    err.status = 502;
    throw err;
  }
  const aiJson = await aiRes.json();
  const raw = responsesOutputText(aiJson);
  if (!raw.trim()) {
    const err = new Error("Couldn't read that PDF");
    err.status = 502;
    throw err;
  }
  return raw;
}

export function decodePdfBase64(pdfBase64) {
  const raw = String(pdfBase64 || "").replace(/^data:application\/pdf;base64,/, "");
  if (!raw) return null;
  const bytes = Buffer.from(raw, "base64");
  if (bytes.length < 5 || bytes.length > MAX_BYTES) return null;
  if (bytes.subarray(0, 4).toString("utf8") !== "%PDF") return null;
  return bytes;
}

export async function parseLaunchPdf({ pdfBase64, filename }) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    const err = new Error("PDF parsing is not configured (missing OPENAI_API_KEY)");
    err.status = 503;
    throw err;
  }

  const pdfBytes = decodePdfBase64(pdfBase64);
  if (!pdfBytes) {
    const err = new Error("Please upload a PDF under 15MB.");
    err.status = 400;
    throw err;
  }

  const text = extractPdfText(pdfBytes);
  let rawText;
  if (text.length >= 120) {
    rawText = await callChatCompletions(
      openaiKey,
      `Extract organization, facilities, and insurance from this one-pager text. Return JSON. Do not add anything that is not present.\n\n${text}`,
    );
  } else {
    rawText = await callResponsesWithPdf(openaiKey, filename || "facility.pdf", pdfBytes, text);
  }

  let parsed;
  try {
    parsed = parseModelJson(rawText);
  } catch {
    const err = new Error("Couldn't read that PDF");
    err.status = 502;
    throw err;
  }

  const normalized = normalizePayload(parsed);
  if (!normalized) {
    const err = new Error("Couldn't read that PDF");
    err.status = 502;
    throw err;
  }

  const facilities = normalized.facilities
    .filter((row) => row && typeof row === "object")
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
    const err = new Error("No facilities detected in the PDF");
    err.status = 422;
    throw err;
  }

  return {
    organization: {
      name: asString(normalized.organization.name) ?? "",
      website: asString(normalized.organization.website),
      description: asString(normalized.organization.description),
      phone: asString(normalized.organization.phone),
      hq_city: asString(normalized.organization.hq_city),
      hq_state: asString(normalized.organization.hq_state),
    },
    facilities,
  };
}
