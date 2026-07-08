import sharp from "sharp";
import { OPENAI_API_KEY } from "../lib/env.mjs";

const PEOPLE_KEYWORDS =
  /person|people|patient|staff|team|doctor|nurse|counselor|therapist|portrait|headshot|face|group|senior|woman|man|child|children|family|couple|hands|selfie|meditation|interviewing|therapy-session|support-group|group-therapy|emergency-room|stock/i;

/**
 * Heuristic quality check (fast pre-filter).
 */
export function heuristicQualityCheck({ buffer, url, facility, meta = {} }) {
  const reasons = [];
  const combined = `${url} ${meta.alt || ""} ${meta.title || ""}`.toLowerCase();

  if (PEOPLE_KEYWORDS.test(combined)) {
    reasons.push("filename/metadata suggests people");
  }
  if (/logo|icon|badge|seal|avatar|placeholder|social/i.test(combined)) {
    reasons.push("appears to be logo/icon/placeholder");
  }

  return {
    pass: reasons.length === 0,
    reasons,
    method: "heuristic",
  };
}

/**
 * Technical quality check using sharp metadata and blur estimate.
 */
export async function technicalQualityCheck(buffer) {
  const reasons = [];
  const image = sharp(buffer);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (width < 800 || height < 500) {
    reasons.push(`resolution too low (${width}x${height})`);
  }

  const aspect = width / height;
  if (aspect > 3.5 || aspect < 0.35) {
    reasons.push(`extreme aspect ratio (${aspect.toFixed(2)})`);
  }

  // Blur detection via Laplacian variance on a downscaled grayscale copy.
  const { data, info } = await sharp(buffer)
    .resize(640, 640, { fit: "inside", withoutEnlargement: true })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const lap =
        -4 * data[idx] +
        data[idx - 1] +
        data[idx + 1] +
        data[idx - w] +
        data[idx + w];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  if (variance < 35) {
    reasons.push("image appears blurry");
  }

  return {
    pass: reasons.length === 0,
    reasons,
    width,
    height,
    blurVariance: variance,
    method: "technical",
  };
}

/**
 * Vision quality agent — verifies facility relevance and no people.
 */
export async function visionQualityCheck({ buffer, facility }) {
  if (!OPENAI_API_KEY) {
    return {
      pass: true,
      reasons: ["vision skipped — using strict heuristics only"],
      method: "vision-skipped",
      confidence: 0.5,
    };
  }

  const b64 = buffer.toString("base64");
  const prompt = `You are a strict photo curator for addiction/behavioral health facility listings.

Facility name: ${facility.name}
City/State: ${facility.city || "unknown"}, ${facility.state || "unknown"}
Website: ${facility.website || "unknown"}

Review this image and respond with JSON only:
{
  "pass": boolean,
  "confidence": number,
  "category": "exterior|interior|room|amenity|grounds|other|reject",
  "hasPeople": boolean,
  "isFacilityRelated": boolean,
  "qualityScore": number,
  "reasons": string[]
}

REJECT if ANY of these are true:
- Any visible people, faces, silhouettes of people, or body parts
- Stock photo unrelated to a treatment facility
- Logo, icon, badge, certificate, infographic, or text-only graphic
- Low quality, extremely dark, or unusably blurry
- Cannot recognize what is shown

PASS only for clear photos of buildings, rooms, amenities, or surrounding grounds that plausibly belong to this facility/program type.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vision QC failed: ${res.status} ${err.slice(0, 200)}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);

  const finalPass =
    parsed.pass === true &&
    parsed.hasPeople !== true &&
    parsed.isFacilityRelated !== false &&
    (parsed.qualityScore ?? 0) >= 6;

  return {
    pass: finalPass,
    reasons: parsed.reasons || [],
    category: parsed.category,
    confidence: parsed.confidence ?? 0,
    qualityScore: parsed.qualityScore ?? 0,
    hasPeople: parsed.hasPeople === true,
    method: "vision",
  };
}

export async function runQualityCheck({ buffer, url, facility, meta = {} }) {
  const heuristic = heuristicQualityCheck({ buffer, url, facility, meta });
  if (!heuristic.pass) return { pass: false, stage: "heuristic", ...heuristic };

  const technical = await technicalQualityCheck(buffer);
  if (!technical.pass) return { pass: false, stage: "technical", ...technical };

  const vision = await visionQualityCheck({ buffer, facility });
  if (!vision.pass) return { pass: false, stage: "vision", ...vision };

  return {
    pass: true,
    stage: "approved",
    heuristic,
    technical,
    vision,
  };
}
