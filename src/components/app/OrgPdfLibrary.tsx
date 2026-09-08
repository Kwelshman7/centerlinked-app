import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loadOrgPdfUploads, openOrgPdf, type OrgPdfUpload } from "@/lib/org-pdfs";

export function OrgPdfLibrary({
  organizationId,
  refreshToken = 0,
}: {
  organizationId: string;
  refreshToken?: number;
}) {
  const [rows, setRows] = useState<OrgPdfUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await loadOrgPdfUploads(organizationId));
    } catch (e: unknown) {
      console.warn("org pdf list failed", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  const open = async (row: OrgPdfUpload) => {
    setOpeningId(row.id);
    try {
      await openOrgPdf(row.storage_path);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not open that PDF");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-heading text-sm font-semibold">Organization PDFs</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Stored for this organization. Anyone on the team can open them.
        </p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading PDFs…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No PDFs uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{row.filename}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {row.status ?? "uploaded"}
                    {row.size_bytes ? ` · ${Math.max(1, Math.round(row.size_bytes / 1024))} KB` : ""}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={openingId === row.id}
                onClick={() => void open(row)}
              >
                {openingId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Open"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
