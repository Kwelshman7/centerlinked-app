import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JOIN_PDF_IMPORT_PATH,
  clearPendingJoinPdf,
  consumeJoinImportPath,
  consumeJoinImportPathForAdmin,
  hasJoinImportIntent,
  peekJoinImportPath,
  peekPendingJoinPdfName,
  setJoinImportIntent,
  setPendingJoinPdf,
  takePendingJoinPdf,
} from "./join-intent.ts";

const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => memory.clear(),
};
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });

test("import intent is stored and consumed once", () => {
  sessionStorage.clear();
  assert.equal(hasJoinImportIntent(), false);
  setJoinImportIntent();
  assert.equal(hasJoinImportIntent(), true);
  assert.equal(peekJoinImportPath(), JOIN_PDF_IMPORT_PATH);
  assert.equal(consumeJoinImportPath(), JOIN_PDF_IMPORT_PATH);
  assert.equal(hasJoinImportIntent(), false);
  assert.equal(consumeJoinImportPath(), null);
});

test("non-admin import intent is cleared without returning the PDF path", () => {
  sessionStorage.clear();
  setJoinImportIntent();
  assert.equal(consumeJoinImportPathForAdmin(false), null);
  assert.equal(hasJoinImportIntent(), false);
  setJoinImportIntent();
  assert.equal(consumeJoinImportPathForAdmin(true), JOIN_PDF_IMPORT_PATH);
  assert.equal(hasJoinImportIntent(), false);
});

test("pending PDF is available once in the same tab", () => {
  sessionStorage.clear();
  clearPendingJoinPdf();
  const file = new File(["%PDF-1.4"], "facilities.pdf", { type: "application/pdf" });
  setPendingJoinPdf(file);
  assert.equal(hasJoinImportIntent(), true);
  assert.equal(peekPendingJoinPdfName(), "facilities.pdf");
  assert.equal(takePendingJoinPdf(), file);
  assert.equal(takePendingJoinPdf(), null);
  assert.equal(peekPendingJoinPdfName(), "facilities.pdf");
  clearPendingJoinPdf();
  assert.equal(peekPendingJoinPdfName(), null);
});
