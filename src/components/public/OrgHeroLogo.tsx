import { useRef, useState } from "react";
import { Building2, Camera, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  orgId: string;
  orgName: string;
  logoUrl: string | null;
  tagline: string | null;
  verified: boolean;
  canEdit: boolean;
  onLogoChange: (url: string) => void;
}

export function OrgHeroLogo({ orgId, orgName, logoUrl, tagline, verified, canEdit, onLogoChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${orgId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("org-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) {
        toast.error(upErr.message);
        return;
      }
      const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
      const url = data.publicUrl;
      const { error: updErr } = await supabase
        .from("organizations")
        .update({ logo_url: url })
        .eq("id", orgId);
      if (updErr) {
        toast.error(updErr.message);
        return;
      }
      onLogoChange(url);
      toast.success("Logo updated");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-start gap-3 mb-4 sm:mb-6">
      <div className="relative group">
        <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-2xl bg-white shadow-lg ring-1 ring-black/5 overflow-hidden grid place-items-center p-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${orgName} logo`}
              className="w-full h-full object-contain"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/80 grid place-items-center rounded-2xl">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        {canEdit && !uploading && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
              aria-label="Change organization logo"
            >
              <Camera className="h-5 w-5" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {logoUrl ? "Replace" : "Upload"}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 min-w-0">
        {verified && (
          <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur text-white border border-white/30 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3 w-3" /> VERIFIED
          </span>
        )}
        {tagline && (
          <span className="hidden sm:inline text-white/85 text-xs truncate max-w-[40ch]">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}
