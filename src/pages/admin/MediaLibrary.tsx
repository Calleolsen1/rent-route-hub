import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Copy, Upload, Loader2 } from "lucide-react";

/**
 * Admin browser for the kaisen-media storage bucket — list, preview, copy URL,
 * delete. Folders within the bucket (event-covers/, home-slides/) are flattened
 * into one list with a path prefix shown on each card.
 */
type FileEntry = {
  name: string;
  path: string;
  publicUrl: string;
  size: number | null;
  updated_at: string | null;
};

const BUCKET = "kaisen-media";
const PREFIXES = ["event-covers", "home-slides", ""]; // root + known folders

async function listAll(): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  for (const prefix of PREFIXES) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 500, sortBy: { column: "updated_at", order: "desc" } });
    for (const f of data ?? []) {
      // Skip subfolders returned at root level (Supabase returns folder names as items)
      if (!f.metadata && !f.id) continue;
      const path = prefix ? `${prefix}/${f.name}` : f.name;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      entries.push({
        name: f.name,
        path,
        publicUrl: urlData.publicUrl,
        size: (f.metadata as { size?: number } | null)?.size ?? null,
        updated_at: f.updated_at ?? null,
      });
    }
  }
  // Dedupe (root list might overlap nested) + sort newest first
  const seen = new Set<string>();
  const out: FileEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.path)) continue;
    seen.add(e.path);
    out.push(e);
  }
  out.sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
  return out;
}

export default function AdminMediaLibrary() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setFiles(await listAll());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `library/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, cacheControl: "31536000" });
      if (error) throw error;
      toast.success("Bilden är uppladdad");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Uppladdningen misslyckades");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm(`Ta bort ${path}? Om bilden används av ett evenemang eller en slide försvinner den därifrån.`)) return;
    setDeleting(path);
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
      setFiles((prev) => prev.filter((f) => f.path !== path));
      toast.success("Bilden borttagen");
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte ta bort");
    } finally {
      setDeleting(null);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => toast.success("URL kopierad"),
      () => toast.error("Kunde inte kopiera"),
    );
  };

  const filtered = files.filter((f) =>
    !search.trim() || f.path.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display mb-2">Bildbibliotek</h1>
          <p className="text-muted-foreground text-sm">
            Alla bilder som laddats upp via banners, evenemangs-omslag eller direkt här.
            Klicka kopiera-ikonen för att klistra in en bilds URL i annan kontext.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button size="sm" disabled={uploading} asChild>
            <span>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Upload className="h-3 w-3 mr-1.5" />}
              Ladda upp ny
            </span>
          </Button>
        </label>
      </div>

      <Input
        placeholder="Sök på filnamn eller mapp..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Laddar...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {files.length === 0
            ? "Inga bilder än — ladda upp via knappen ovan eller via evenemangs-/banner-redigerarna."
            : "Inga bilder matchar sökningen."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((f) => (
            <div key={f.path} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="aspect-[4/3] bg-muted/30 overflow-hidden">
                <img
                  src={f.publicUrl}
                  alt={f.path}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-mono text-muted-foreground truncate" title={f.path}>
                  {f.path}
                </p>
                {f.size != null && (
                  <p className="text-[10px] text-muted-foreground">
                    {(f.size / 1024).toFixed(0)} KB
                    {f.updated_at && ` · ${new Date(f.updated_at).toLocaleDateString("sv-SE")}`}
                  </p>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyUrl(f.publicUrl)}
                    title="Kopiera URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(f.path)}
                    disabled={deleting === f.path}
                    title="Ta bort"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
