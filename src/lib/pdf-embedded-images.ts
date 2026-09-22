// Pulls embedded photographs and logos out of a facility one-pager in the browser.
// JPEG XObjects are returned as-is. FlateDecode images are rebuilt as PNG when
// they are 8-bit DeviceRGB, DeviceGray, or an inline indexed RGB palette.
// Anything else is skipped so a bad decode never becomes a corrupt upload.

export interface EmbeddedPdfImage {
  id: string;
  width: number;
  height: number;
  mime: "image/jpeg" | "image/png";
  bytes: Uint8Array;
}

const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;

interface ExtractOptions {
  minDimension?: number;
  minBytes?: number;
}

function latin1(bytes: Uint8Array): string {
  return new TextDecoder("latin1").decode(bytes);
}

function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i < bytes.length - 9) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
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

function dictNumber(dict: string, name: string): number | null {
  const match = dict.match(new RegExp(`/${name}\\s+(\\d+)`));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

async function inflateZlib(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function deflateZlib(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null;
  try {
    const stream = new Blob([data]).stream().pipeThrough(new CompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(data, 8);
  const crcInput = out.subarray(4, 8 + data.length);
  view.setUint32(8 + data.length, crc32(crcInput));
  return out;
}

async function encodeRgbPng(width: number, height: number, rgb: Uint8Array): Promise<Uint8Array | null> {
  const rowSize = width * 3;
  const raw = new Uint8Array(height * (1 + rowSize));
  for (let y = 0; y < height; y++) {
    const dest = (1 + rowSize) * y;
    raw[dest] = 0;
    raw.set(rgb.subarray(y * rowSize, (y + 1) * rowSize), dest + 1);
  }
  const compressed = await deflateZlib(raw);
  if (!compressed) return null;
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunks = [pngChunk("IHDR", ihdr), pngChunk("IDAT", compressed), pngChunk("IEND", new Uint8Array())];
  const total = signature.length + chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const png = new Uint8Array(total);
  png.set(signature, 0);
  let offset = signature.length;
  for (const chunk of chunks) {
    png.set(chunk, offset);
    offset += chunk.length;
  }
  return png;
}

function paeth(left: number, up: number, upLeft: number): number {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
}

function unfilterRows(
  raw: Uint8Array,
  width: number,
  height: number,
  colors: number,
  predictor: number,
): Uint8Array | null {
  const rowSize = width * colors;
  if (predictor === 1) {
    return raw.length === height * rowSize ? raw : null;
  }
  if (predictor === 2) {
    if (raw.length !== height * rowSize) return null;
    const out = new Uint8Array(raw.length);
    for (let y = 0; y < height; y++) {
      for (let i = 0; i < rowSize; i++) {
        const left = i >= colors ? out[y * rowSize + i - colors] : 0;
        out[y * rowSize + i] = (raw[y * rowSize + i] + left) & 255;
      }
    }
    return out;
  }
  if (predictor < 10 || predictor > 15) return null;
  if (raw.length !== height * (1 + rowSize)) return null;
  const out = new Uint8Array(height * rowSize);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (1 + rowSize)];
    const row = raw.subarray(y * (1 + rowSize) + 1, (y + 1) * (1 + rowSize));
    const dest = out.subarray(y * rowSize, (y + 1) * rowSize);
    const prev = y > 0 ? out.subarray((y - 1) * rowSize, y * rowSize) : null;
    for (let i = 0; i < rowSize; i++) {
      const left = i >= colors ? dest[i - colors] : 0;
      const up = prev ? prev[i] : 0;
      const upLeft = prev && i >= colors ? prev[i - colors] : 0;
      const sample = row[i];
      if (filter === 0) dest[i] = sample;
      else if (filter === 1) dest[i] = (sample + left) & 255;
      else if (filter === 2) dest[i] = (sample + up) & 255;
      else if (filter === 3) dest[i] = (sample + ((left + up) >> 1)) & 255;
      else if (filter === 4) dest[i] = (sample + paeth(left, up, upLeft)) & 255;
      else return null;
    }
  }
  return out;
}

function toRgb(samples: Uint8Array, width: number, height: number, colors: number, palette: Uint8Array | null): Uint8Array | null {
  if (palette) {
    const rgb = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      const index = samples[i] * 3;
      if (index + 2 >= palette.length) return null;
      rgb[i * 3] = palette[index];
      rgb[i * 3 + 1] = palette[index + 1];
      rgb[i * 3 + 2] = palette[index + 2];
    }
    return rgb;
  }
  if (colors === 3) return samples;
  if (colors === 1) {
    const rgb = new Uint8Array(width * height * 3);
    for (let i = 0; i < samples.length; i++) {
      rgb[i * 3] = samples[i];
      rgb[i * 3 + 1] = samples[i];
      rgb[i * 3 + 2] = samples[i];
    }
    return rgb;
  }
  return null;
}

function indexedPalette(dict: string): Uint8Array | null {
  const match = dict.match(/\/Indexed\s*\/DeviceRGB\s+(\d+)\s*<\s*([0-9A-Fa-f\s]+)\s*>/);
  if (!match) return null;
  const hex = match[2].replace(/\s+/g, "");
  if (hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  const needed = (Number(match[1]) + 1) * 3;
  return bytes.length >= needed ? bytes.subarray(0, needed) : null;
}

function streamBytes(raw: string, bytes: Uint8Array, streamIdx: number, dict: string): { slice: Uint8Array; next: number } | null {
  let start = streamIdx + 6;
  if (raw[start] === "\r") start += 1;
  if (raw[start] === "\n") start += 1;
  const length = dictNumber(dict, "Length");
  if (length != null && length > 0 && start + length <= bytes.length) {
    return { slice: bytes.subarray(start, start + length), next: start + length };
  }
  const endIdx = raw.indexOf("endstream", start);
  if (endIdx === -1) return null;
  return { slice: bytes.subarray(start, endIdx), next: endIdx + 9 };
}

function trimJpeg(slice: Uint8Array): Uint8Array | null {
  const soi = slice.indexOf(0xff);
  if (soi === -1 || slice[soi + 1] !== 0xd8) return null;
  let jpeg = soi > 0 ? slice.subarray(soi) : slice;
  for (let k = jpeg.length - 2; k >= 2; k--) {
    if (jpeg[k] === 0xff && jpeg[k + 1] === 0xd9) {
      jpeg = jpeg.subarray(0, k + 2);
      break;
    }
  }
  return jpeg;
}

async function flateToPng(slice: Uint8Array, dict: string, width: number, height: number): Promise<Uint8Array | null> {
  const bpc = dictNumber(dict, "BitsPerComponent") ?? 8;
  if (bpc !== 8) return null;
  const palette = /\/Indexed/.test(dict) ? indexedPalette(dict) : null;
  const deviceRgb = /\/DeviceRGB/.test(dict) && !palette;
  const deviceGray = /\/DeviceGray/.test(dict) && !palette;
  if (!palette && !deviceRgb && !deviceGray) return null;
  const colors = palette ? 1 : deviceGray ? 1 : (dictNumber(dict, "Colors") ?? 3);
  if (!palette && colors !== 1 && colors !== 3) return null;
  const inflated = await inflateZlib(slice);
  if (!inflated) return null;
  const predictor = dictNumber(dict, "Predictor") ?? 1;
  const samples = unfilterRows(inflated, width, height, colors, predictor);
  if (!samples) return null;
  const rgb = toRgb(samples, width, height, palette ? 1 : colors, palette);
  if (!rgb) return null;
  return encodeRgbPng(width, height, rgb);
}

export async function extractEmbeddedPdfImages(
  bytes: Uint8Array,
  options: ExtractOptions = {},
): Promise<EmbeddedPdfImage[]> {
  const minDimension = options.minDimension ?? 48;
  const minBytes = options.minBytes ?? 512;
  const raw = latin1(bytes);
  const out: EmbeddedPdfImage[] = [];
  let total = 0;
  let searchFrom = 0;
  let ordinal = 0;

  while (out.length < MAX_IMAGES) {
    const streamIdx = raw.indexOf("stream", searchFrom);
    if (streamIdx === -1) break;
    const header = raw.slice(Math.max(0, streamIdx - 3000), streamIdx);
    const dictStart = header.lastIndexOf("<<");
    const dict = dictStart === -1 ? header : header.slice(dictStart);
    const payload = streamBytes(raw, bytes, streamIdx, dict);
    if (!payload) {
      searchFrom = streamIdx + 6;
      continue;
    }
    searchFrom = payload.next;
    if (!/\/Subtype\s*\/Image/.test(dict)) continue;
    if (/\/ImageMask\s+true/.test(dict)) continue;

    const isJpeg = /\/DCTDecode/.test(dict);
    const isFlate = /\/FlateDecode/.test(dict);
    if (isJpeg === isFlate) continue;

    let imageBytes: Uint8Array | null = null;
    let mime: EmbeddedPdfImage["mime"] = "image/jpeg";
    let width = 0;
    let height = 0;

    if (isJpeg) {
      const jpeg = trimJpeg(payload.slice);
      if (!jpeg) continue;
      const size = jpegSize(jpeg);
      if (!size) continue;
      imageBytes = jpeg;
      mime = "image/jpeg";
      width = size.width;
      height = size.height;
    } else {
      width = dictNumber(dict, "Width") ?? 0;
      height = dictNumber(dict, "Height") ?? 0;
      if (width < 1 || height < 1) continue;
      imageBytes = await flateToPng(payload.slice, dict, width, height);
      mime = "image/png";
    }

    if (!imageBytes) continue;
    if (imageBytes.length < minBytes || imageBytes.length > MAX_IMAGE_BYTES) continue;
    if (width < minDimension || height < minDimension) continue;
    if (width / height > 8 || height / width > 8) continue;
    if (total + imageBytes.length > MAX_TOTAL_BYTES) break;
    total += imageBytes.length;
    ordinal += 1;
    out.push({ id: `img-${ordinal}`, width, height, mime, bytes: imageBytes });
  }

  return out;
}

/** Smallest near-square image. Wide photos are left for facility galleries. */
export function suggestLogoImageId(
  images: Array<Pick<EmbeddedPdfImage, "id" | "width" | "height">>,
): string | null {
  const square = images.filter((img) => {
    const ratio = img.width / img.height;
    return ratio >= 0.7 && ratio <= 1.5;
  });
  if (!square.length) return null;
  square.sort((a, b) => a.width * a.height - b.width * b.height);
  return square[0].id;
}
