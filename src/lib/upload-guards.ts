const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"] as const;
const PDF_MAX_BYTES = 15 * 1024 * 1024;

export async function assertPdfFile(
  file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "Please upload a PDF file." };
  }
  if (file.size > PDF_MAX_BYTES) {
    return { ok: false, error: "Please upload a PDF under 15MB." };
  }
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const magic = String.fromCharCode(...head);
  if (!magic.startsWith("%PDF")) {
    return { ok: false, error: "That file is not a valid PDF." };
  }
  return { ok: true };
}

export function assertImageFile(
  file: File,
): { ok: true; ext: string } | { ok: false; error: string } {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return { ok: false, error: `${file.name} must be a JPG, PNG, GIF, or WebP image` };
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!IMAGE_EXTS.includes(ext as (typeof IMAGE_EXTS)[number])) {
    return { ok: false, error: `${file.name} must be a JPG, PNG, GIF, or WebP image` };
  }
  return { ok: true, ext };
}
