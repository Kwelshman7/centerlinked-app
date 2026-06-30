export function sanitizePhone(raw?: string | null): string {
  return (raw ?? "").replace(/[^\d+]/g, "");
}
