const INTENT_KEY = "cl_join_intent";
const POST_LOGIN_KEY = "cl_post_login";
const PDF_NAME_KEY = "cl_join_pdf_name";
const IMPORT_INTENT = "import-pdf";

export const JOIN_PDF_IMPORT_PATH = "/app/facilities/upload-pdf?from=join";

/** Same-tab only. Survives SPA navigation, not Google/email redirects. */
let pendingJoinPdf: File | null = null;

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

/** Remember that this signup/login should continue into PDF import + review. */
export function setJoinImportIntent() {
  write(INTENT_KEY, IMPORT_INTENT);
  write(POST_LOGIN_KEY, JOIN_PDF_IMPORT_PATH);
}

export function hasJoinImportIntent() {
  return read(INTENT_KEY) === IMPORT_INTENT;
}

export function peekJoinImportPath(): string | null {
  return hasJoinImportIntent() ? JOIN_PDF_IMPORT_PATH : null;
}

/** Use once the user has an organization that can receive the import. */
export function consumeJoinImportPath(): string | null {
  if (!hasJoinImportIntent()) return null;
  remove(INTENT_KEY);
  remove(POST_LOGIN_KEY);
  return JOIN_PDF_IMPORT_PATH;
}

/**
 * PDF import is admin-only. Invited BD reps who tapped the Join PDF option
 * must not land on that dead end — clear the intent and continue elsewhere.
 */
export function consumeJoinImportPathForAdmin(canImport: boolean): string | null {
  if (!hasJoinImportIntent()) return null;
  if (!canImport) {
    remove(INTENT_KEY);
    remove(POST_LOGIN_KEY);
    return null;
  }
  return consumeJoinImportPath();
}

export function setPendingJoinPdf(file: File) {
  pendingJoinPdf = file;
  write(PDF_NAME_KEY, file.name);
  setJoinImportIntent();
}

export function takePendingJoinPdf(): File | null {
  const file = pendingJoinPdf;
  pendingJoinPdf = null;
  return file;
}

export function peekPendingJoinPdfName(): string | null {
  if (pendingJoinPdf?.name) return pendingJoinPdf.name;
  const stored = read(PDF_NAME_KEY);
  return stored?.trim() || null;
}

export function clearPendingJoinPdf() {
  pendingJoinPdf = null;
  remove(PDF_NAME_KEY);
}
