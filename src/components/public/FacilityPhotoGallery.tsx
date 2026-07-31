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
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Dialog used on facility sheets to update the photo set (hero + gallery). */
export function EditPhotosDialog({
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
            The first photo is used as the hero image. The next six appear in the gallery beside the
            contact card.
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
