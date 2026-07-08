import sharp from "sharp";
import { COVER_SIZE, GALLERY_SIZE, MAX_BYTES } from "../lib/env.mjs";

/**
 * Processor agent: center-crop and resize without cutting off key content.
 * Uses cover fit with attention strategy when available.
 */
export async function processFacilityImage(buffer, index) {
  const target = index === 0 ? COVER_SIZE : GALLERY_SIZE;
  const targetAspect = target.width / target.height;

  const meta = await sharp(buffer).metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  if (!srcW || !srcH) throw new Error("Invalid image dimensions");

  const srcAspect = srcW / srcH;
  let pipeline = sharp(buffer).rotate();

  // If source is much wider/taller than target, use contain + blurred background
  // so we never crop off recognizable building edges.
  if (srcAspect / targetAspect > 1.35 || targetAspect / srcAspect > 1.35) {
    const bg = await sharp(buffer)
      .resize(target.width, target.height, { fit: "cover", position: "attention" })
      .blur(20)
      .toBuffer();

    const fg = await sharp(buffer)
      .resize(target.width, target.height, { fit: "inside", withoutEnlargement: false })
      .toBuffer();

    pipeline = sharp(bg).composite([{ input: fg, gravity: "center" }]);
  } else {
    pipeline = sharp(buffer).resize(target.width, target.height, {
      fit: "cover",
      position: "attention",
      withoutEnlargement: false,
    });
  }

  let quality = 88;
  let output = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();

  while (output.length > MAX_BYTES && quality > 55) {
    quality -= 8;
    output = await sharp(buffer)
      .resize(target.width, target.height, { fit: "cover", position: "attention" })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  if (output.length > MAX_BYTES) {
    throw new Error(`Processed image still exceeds ${MAX_BYTES} bytes`);
  }

  return {
    buffer: output,
    ext: "jpg",
    width: target.width,
    height: target.height,
    bytes: output.length,
    role: index === 0 ? "cover" : "gallery",
  };
}
