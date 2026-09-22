import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { test } from "node:test";
import { extractEmbeddedPdfImages, suggestLogoImageId } from "./pdf-embedded-images.ts";

function pdfWithStream(dict: string, payload: Uint8Array): Uint8Array {
  const header = `%PDF-1.4\n1 0 obj\n<< ${dict} /Length ${payload.length} >>\nstream\n`;
  const footer = "\nendstream\nendobj\n%%EOF";
  const head = new TextEncoder().encode(header);
  const tail = new TextEncoder().encode(footer);
  const out = new Uint8Array(head.length + payload.length + tail.length);
  out.set(head, 0);
  out.set(payload, head.length);
  out.set(tail, head.length + payload.length);
  return out;
}

function paddedJpeg(width: number, height: number): Uint8Array {
  const sof = Uint8Array.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
  ]);
  const pad = new Uint8Array(520);
  const eoi = Uint8Array.from([0xff, 0xd9]);
  const jpeg = new Uint8Array(sof.length + pad.length + eoi.length);
  jpeg.set(sof, 0);
  jpeg.set(pad, sof.length);
  jpeg.set(eoi, sof.length + pad.length);
  return jpeg;
}

test("extracts an embedded JPEG photograph", async () => {
  const jpeg = paddedJpeg(240, 160);
  const pdf = pdfWithStream(
    "/Type /XObject /Subtype /Image /Width 240 /Height 160 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode",
    jpeg,
  );
  const images = await extractEmbeddedPdfImages(pdf);
  assert.equal(images.length, 1);
  assert.equal(images[0].mime, "image/jpeg");
  assert.equal(images[0].width, 240);
  assert.equal(images[0].height, 160);
  assert.equal(images[0].bytes[0], 0xff);
  assert.equal(images[0].bytes[1], 0xd8);
});

test("rebuilds a FlateDecode logo as PNG", async () => {
  const width = 48;
  const height = 48;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) rgb[i * 3] = 32;
  const compressed = deflateSync(rgb);
  const pdf = pdfWithStream(
    "/Type /XObject /Subtype /Image /Width 48 /Height 48 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode",
    compressed,
  );
  const images = await extractEmbeddedPdfImages(pdf, { minBytes: 8 });
  assert.equal(images.length, 1);
  assert.equal(images[0].mime, "image/png");
  assert.equal(images[0].width, 48);
  assert.equal(images[0].height, 48);
  assert.equal(images[0].bytes[0], 137);
  assert.equal(images[0].bytes[1], 80);
});

test("suggests the smaller square image as the logo", () => {
  const id = suggestLogoImageId([
    { id: "photo", width: 1200, height: 800 },
    { id: "logo", width: 200, height: 200 },
  ]);
  assert.equal(id, "logo");
});

test("does not treat a wide photo as a logo", () => {
  assert.equal(suggestLogoImageId([{ id: "photo", width: 1600, height: 600 }]), null);
});
