import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/app/ImageUploader";
import { ChevronLeft, ChevronRight, X, ImageIcon, Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  facilityId: string;
  facilityName: string;
  images: string[];
  canEdit: boolean;
  onUpdated?: (images: string[]) => void;
}

export function FacilityPhotoGallery({
  facilityId,
  facilityName,
  images,
  canEdit,
  onUpdated,
}: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // The first image is the hero — show up to 6 additional photos here.
  const gallery = (images ?? []).slice(1, 7);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? null : (i + 1) % gallery.length));
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, gallery.length]);

  if (gallery.length === 0 && !canEdit) return null;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 w-full flex flex-col min-h-0">

      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-heading text-sm font-bold">Photo gallery</h2>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3 w-3" /> Edit
          </Button>
        )}
      </div>

      {gallery.length === 0 ? (
        <button
          type="button"
          onClick={() => canEdit && setEditOpen(true)}
          className="w-full rounded-lg border-2 border-dashed border-border bg-muted/30 py-6 grid place-items-center text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <ImageIcon className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Add photos</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto auto-rows-min pr-1">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-border/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Open photo ${i + 1}`}
            >
              <img
                src={src}
                alt={`${facilityName} photo ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm grid place-items-center p-4 sm:p-8"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i + 1) % gallery.length));
                }}
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={gallery[lightboxIndex]}
            alt={`${facilityName} photo ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 font-medium">
            {lightboxIndex + 1} / {gallery.length}
          </p>
        </div>
      )}

      {canEdit && (
        <EditPhotosDialog
          facilityId={facilityId}
          images={images}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={(next) => onUpdated?.(next)}
        />
      )}
    </section>
  );
}

function EditPhotosDialog({
  facilityId,
  images,
  open,
  onOpenChange,
  onSaved,
}: {
  facilityId: string;
  images: string[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (next: string[]) => void;
}) {
  const [list, setList] = useState<string[]>(images);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setList(images);
  }, [open, images]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("facilities")
      .update({ image_urls: list })
      .eq("id", facilityId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Photos updated");
    onSaved(list);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit facility photos</DialogTitle>
          <DialogDescription>
            The first photo is used as the hero image. The next six appear in the gallery beside the contact card.
          </DialogDescription>
        </DialogHeader>
        <ImageUploader
          bucket="facility-images"
          value={list}
          onChange={setList}
          max={7}
          label="Add photos"
        />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save photos"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
