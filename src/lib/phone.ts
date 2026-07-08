export function sanitizePhone(raw?: string | null): string {
  return (raw ?? "").replace(/[^\d+]/g, "");
}

export function formatPhoneDisplay(raw?: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const digits = sanitizePhone(trimmed).replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return trimmed;
}
