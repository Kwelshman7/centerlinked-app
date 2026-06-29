import { useState } from "react";
import { X, Loader2, ImagePlus, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ImageUploaderProps {
  bucket: "facility-images" | "post-images" | "org-logos" | "avatars";
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  /** When true, the first image is treated as the cover/profile image and users can promote any image to cover. */
  allowCover?: boolean;
}

export function ImageUploader({
  bucket,
  value,
  onChange,
  max = 6,
  label = "Add images",
  allowCover = bucket === "facility-images",
}: ImageUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    if (value.length + files.length > max) {
      toast.error(`Max ${max} images`);
      return;
    }
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is over 5MB`);
          continue;
        }
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) {
          toast.error(error.message);
          continue;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      onChange([...value, ...uploaded]);
    } finally {
      setUploading(false);
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  const setCover = (url: string) => {
    if (value[0] === url) return;
    onChange([url, ...value.filter((u) => u !== url)]);
    toast.success("Cover photo updated");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, idx) => {
          const isCover = allowCover && idx === 0;
          return (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {isCover && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold flex items-center gap-1 shadow">
                  <Star className="h-3 w-3 fill-current" /> Cover
                </div>
              )}
              {allowCover && !isCover && (
                <button
                  type="button"
                  onClick={() => setCover(url)}
                  className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-foreground/70 text-background text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  aria-label="Set as cover"
                  title="Set as cover photo"
                >
                  <Star className="h-3 w-3" /> Set cover
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 right-1 p-1 rounded-full bg-foreground/70 text-background opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        {value.length < max && (
          <label className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors text-muted-foreground">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      {allowCover && value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          The cover photo is shown as the facility's main image. Hover any photo and click "Set cover" to change it.
        </p>
      )}
    </div>
  );
}
