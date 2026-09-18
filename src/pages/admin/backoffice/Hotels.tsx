import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";

export type Hotel = {
  id: string;
  name: string;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  image_url: string | null;
  notes: string | null;
  is_active: boolean;
};

const empty: Partial<Hotel> = {
  name: "",
  address_line1: "",
  postal_code: "",
  city: "",
  country: "",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  image_url: null,
  notes: "",
  is_active: true,
};

export default function BackofficeHotels() {
  const [rows, setRows] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<Hotel>>(empty);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("hotels").select("*").order("name");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Hotel[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.city, r.country, r.contact_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const save = async () => {
    if (!draft.name?.trim()) return toast.error("Hotellnamn krävs");
    setSaving(true);
    const payload = {
      name: draft.name,
      address_line1: draft.address_line1 || null,
      postal_code: draft.postal_code || null,
      city: draft.city || null,
      country: draft.country || null,
      contact_name: draft.contact_name || null,
      email: draft.email || null,
      phone: draft.phone || null,
      website: draft.website || null,
      image_url: draft.image_url || null,
      notes: draft.notes || null,
      is_active: draft.is_active ?? true,
    };
    const { error } = draft.id
      ? await supabase.from("hotels").update(payload).eq("id", draft.id)
      : await supabase.from("hotels").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Hotellet sparat");
    setOpen(false);
    setDraft(empty);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ta bort hotellet?")) return;
    const { error } = await supabase.from("hotels").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Hotellet borttaget");
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground">Hotell</h1>
          <p className="text-sm text-muted-foreground">
            Hotellregister med adresser och kontaktuppgifter som används i bokningar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök hotell…"
              className="w-56 pl-9"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              setDraft(empty);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nytt hotell
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Inga hotell ännu.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((h) => (
            <div key={h.id} className="rounded-lg border border-border bg-card p-4">
              {h.image_url && (
                <img
                  src={h.image_url}
                  alt={h.name}
                  className="mb-3 h-32 w-full rounded-md object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{h.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[h.address_line1, h.postal_code, h.city, h.country].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraft(h);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => remove(h.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                {h.contact_name && <p>{h.contact_name}</p>}
                {h.email && <p>{h.email}</p>}
                {h.phone && <p>{h.phone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Redigera hotell" : "Nytt hotell"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              placeholder="Hotellnamn *"
              value={draft.name ?? ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <Input
              placeholder="Adress"
              value={draft.address_line1 ?? ""}
              onChange={(e) => setDraft({ ...draft, address_line1: e.target.value })}
            />
            <Input
              placeholder="Postnummer"
              value={draft.postal_code ?? ""}
              onChange={(e) => setDraft({ ...draft, postal_code: e.target.value })}
            />
            <Input
              placeholder="Stad"
              value={draft.city ?? ""}
              onChange={(e) => setDraft({ ...draft, city: e.target.value })}
            />
            <Input
              placeholder="Land"
              value={draft.country ?? ""}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
            />
            <Input
              placeholder="Kontaktperson"
              value={draft.contact_name ?? ""}
              onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })}
            />
            <Input
              placeholder="E-post"
              value={draft.email ?? ""}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
            <Input
              placeholder="Telefon"
              value={draft.phone ?? ""}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
            <Input
              placeholder="Webbplats"
              value={draft.website ?? ""}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })}
            />
            <div className="sm:col-span-2">
              <ImagePicker
                value={draft.image_url ?? null}
                prefix="hotels"
                onChange={(url) => setDraft({ ...draft, image_url: url })}
              />
            </div>
            <Textarea
              className="sm:col-span-2"
              rows={3}
              placeholder="Anteckningar"
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
