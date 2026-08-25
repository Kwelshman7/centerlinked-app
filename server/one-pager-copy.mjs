/**
 * Factual one-pager copy. Rewrites the program description using only
 * the selected facility facts. Never invents amenities, therapies, or payers.
 */
export async function handleOnePagerCopy(body) {
  const facts = sanitizeFacts(body);
  if (!facts) {
    return { status: 400, json: { error: "Invalid facts" } };
  }

  const fallback = { description: facts.fallbackDescription, usedAi: false };
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { status: 200, json: fallback };

  try {
    const polished = await requestCopy(key, facts);
    if (!polished) return { status: 200, json: fallback };
    return { status: 200, json: { description: polished, usedAi: true } };
  } catch (err) {
    console.error("[one-pager-copy]", err?.message || err);
    return { status: 200, json: fallback };
  }
}

function asString(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function asStringList(value, maxItems, maxLen) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim().slice(0, maxLen);
    if (trimmed) out.push(trimmed);
    if (out.length >= maxItems) break;
  }
  return out;
}

function sanitizeFacts(body) {
  if (!body || typeof body !== "object") return null;
  const name = asString(body.name, 120);
  if (!name) return null;
  return {
    name,
    orgName: asString(body.orgName, 120),
    city: asString(body.city, 80),
    state: asString(body.state, 40),
    tagline: asString(body.tagline, 140),
    fallbackDescription: asString(body.description, 400) || null,
    levels: asStringList(body.levels, 10, 60),
    conditions: asStringList(body.conditions, 12, 60),
    therapies: asStringList(body.therapies, 12, 60),
    whoWeTreat: asStringList(body.whoWeTreat, 10, 60),
    amenities: asStringList(body.amenities, 16, 60),
    accreditations: asStringList(body.accreditations, 8, 80),
  };
}

async function requestCopy(apiKey, facts) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 180,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write a two-sentence referral one-pager description for treatment-center business-development teams. Use ONLY the provided facts. If existing_description is present, polish it; if it is empty, compose from the listed levels, conditions, therapies, populations, amenities, and accreditations. Do not add services, populations, insurance, amenities, credentials, or outcomes that are not listed. Do not mention CenterLinked, AI, or that this is a template. Return JSON {\"description\": string} with at most 280 characters.",
          },
          {
            role: "user",
            content: JSON.stringify({
              name: facts.name,
              organization: facts.orgName,
              location: [facts.city, facts.state].filter(Boolean).join(", "),
              tagline: facts.tagline,
              existing_description: facts.fallbackDescription,
              levels_of_care: facts.levels,
              conditions: facts.conditions,
              therapies: facts.therapies,
              who_we_treat: facts.whoWeTreat,
              amenities: facts.amenities,
              accreditations: facts.accreditations,
            }),
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return null;
    const parsed = JSON.parse(raw);
    const description = asString(parsed?.description, 320);
    if (description.length < 40) return null;
    return description;
  } finally {
    clearTimeout(timer);
  }
}
