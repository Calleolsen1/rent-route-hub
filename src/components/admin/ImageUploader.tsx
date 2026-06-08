import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Reusable image upload widget. Uploads to a Supabase Storage bucket under a
 * caller-supplied prefix, returns the public URL via `onUploaded`.
 *
 * Permissions are enforced server-side by storage RLS (kaisen-media bucket
 * allows writes only when the caller is an admin), so we don't need a custom
 * edge function — the browser SDK call is fine.
 */
type Props = {
  /** Current image URL, if any. Renders as preview. */
  value?: string | null;
  /** Storage bucket id. Defaults to kaisen-media. */
  bucket?: string;
  /** Path prefix inside the bucket — e.g. "event-covers". */
  prefix: string;
  /** Called with the public URL once upload succeeds. */
  onUploaded: (url: string) => void;
  /** Called when the user clicks the X to clear. */
  onCleared?: () => void;
  /** Class name for the preview area. */
  className?: string;
};

export function ImageUploader({
  value,
  bucket = "kaisen-media",
  prefix,
  onUploaded,
  onCleared,
  className,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Bara bildfiler är tillåtna");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Filen är större än 10 MB");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${prefix.replace(/\/+$/, "")}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: false,
        cacheControl: "31536000", // 1 year — paths are uuid-stamped
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onUploaded(data.publicUrl);
      toast.success("Bilden är uppladdad");
    } catch (e: any) {
      toast.error(e.message ?? "Uppladdningen misslyckades");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const previewUrl = value && !value.startsWith("asset:") ? value : null;

  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      {previewUrl ? (
        <div className="relative w-32 aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted/30 flex-shrink-0">
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          {onCleared && (
            <button
              type="button"
              onClick={onCleared}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              aria-label="Ta bort bild"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : value?.startsWith("asset:") ? (
        <div className="w-32 aspect-[4/3] rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground flex-shrink-0 text-center px-2">
          Inbyggd bild
        </div>
      ) : (
        <div className="w-32 aspect-[4/3] rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground flex-shrink-0">
          Ingen bild
        </div>
      )}

      <div className="flex-1 space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
          ) : (
            <Upload className="h-3 w-3 mr-2" />
          )}
          {busy ? "Laddar upp..." : value ? "Byt bild" : "Ladda upp bild"}
        </Button>
        <p className="text-[10px] text-muted-foreground">
          JPG, PNG, WebP eller AVIF. Max 10 MB.
        </p>
      </div>
    </div>
  );
}

/**
 * Resolves an image_url that might be an "asset:" sentinel (referring to a
 * bundled /src/assets file) or a real URL (uploaded to Supabase Storage).
 * Used by Home.tsx and other public surfaces.
 */
export function resolveImageUrl(
  url: string | null | undefined,
  assetLookup: Record<string, string>,
  fallback: string,
): string {
  if (!url) return fallback;
  if (url.startsWith("asset:")) {
    const key = url.slice("asset:".length);
    return assetLookup[key] ?? fallback;
  }
  return url;
}
