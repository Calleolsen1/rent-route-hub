import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ImageIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable image field: shows the current image, and opens a dialog where the
 * admin can either upload a new file or pick an existing one from the media
 * library (email-assets bucket).
 */

const BUCKET = "email-assets";
const PREFIXES = ["library", "event-covers", "home-slides", "team", ""];

type LibraryItem = { path: string; url: string; updated_at: string | null };

async function listLibrary(): Promise<LibraryItem[]> {
  const out: LibraryItem[] = [];
  const seen = new Set<string>();
  for (const prefix of PREFIXES) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 200, sortBy: { column: "updated_at", order: "desc" } });
    for (const f of data ?? []) {
      if (!f.metadata && !f.id) continue;
      const path = prefix ? `${prefix}/${f.name}` : f.name;
      if (seen.has(path)) continue;
      seen.add(path);
      out.push({
        path,
        url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
        updated_at: f.updated_at ?? null,
      });
    }
  }
  out.sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
  return out;
}

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  /** Folder new uploads land in. */
  prefix?: string;
  label?: string;
  className?: string;
};

export function ImagePicker({ value, onChange, prefix = "library", label, className }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listLibrary()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = items.filter(
    (i) => !search.trim() || i.path.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className={className}>
      {label && (
        <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      )}
      <div className="flex items-start gap-3">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {value ? (
            <>
              <img src={value} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground shadow"
                title="Ta bort bild"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              {value ? "Byt bild" : "Välj bild"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Välj bild</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="library">
              <TabsList>
                <TabsTrigger value="library">Bildbibliotek</TabsTrigger>
                <TabsTrigger value="upload">Ladda upp</TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="space-y-3">
                <Input
                  placeholder="Sök filnamn…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {loading ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-auto sm:grid-cols-4">
                    {filtered.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          onChange(item.url);
                          setOpen(false);
                        }}
                        className={cn(
                          "group overflow-hidden rounded-md border border-border transition-all hover:ring-2 hover:ring-primary",
                          value === item.url && "ring-2 ring-primary",
                        )}
                      >
                        <img src={item.url} alt="" className="h-24 w-full object-cover" />
                        <span className="block truncate px-1 py-1 text-[10px] text-muted-foreground">
                          {item.path}
                        </span>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                        Inga bilder hittades.
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload">
                <ImageUploader
                  prefix={prefix}
                  value={value}
                  onUploaded={(url) => {
                    onChange(url);
                    setOpen(false);
                  }}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ImagePicker;
