import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { LinkPicker } from "@/components/admin/LinkPicker";

type Experience = {
  id: string;
  image_url: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  tag: string | null;
  href: string;
  cta_label: string;
  is_active: boolean;
  sort_order: number;
};

export default function AdminHomeExperiences() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("home_experiences")
      .select("*")
      .order("sort_order", { ascending: true });
    setItems((data as Experience[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, p: Partial<Experience>) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));
    const { error } = await (supabase as any).from("home_experiences").update(p).eq("id", id);
    if (error) toast.error(error.message ?? "Kunde inte spara");
  };

  const setLocal = (id: string, p: Partial<Experience>) =>
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const addItem = async () => {
    const nextOrder = items.length === 0 ? 0 : Math.max(...items.map((t) => t.sort_order)) + 1;
    const { data, error } = await (supabase as any)
      .from("home_experiences")
      .insert({ title: "Ny upplevelse", is_active: false, sort_order: nextOrder })
      .select("*")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Kunde inte skapa kort");
      return;
    }
    setItems((prev) => [...prev, data as Experience]);
    setHighlightId((data as Experience).id);
    toast.success("Kort skapat - aktivera när det är klart");
  };

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`home-exp-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightId]);

  const removeItem = async (id: string) => {
    if (!confirm("Ta bort kortet från startsidan?")) return;
    const { error } = await (supabase as any).from("home_experiences").delete().eq("id", id);
    if (error) {
      toast.error(error.message ?? "Kunde inte ta bort");
      return;
    }
    setItems((prev) => prev.filter((t) => t.id !== id));
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((t) => t.id === id);
    const otherIdx = idx + dir;
    if (idx < 0 || otherIdx < 0 || otherIdx >= items.length) return;
    const a = items[idx];
    const b = items[otherIdx];
    const next = [...items];
    next[idx] = { ...a, sort_order: b.sort_order };
    next[otherIdx] = { ...b, sort_order: a.sort_order };
    next.sort((x, y) => x.sort_order - y.sort_order);
    setItems(next);
    await Promise.all([
      (supabase as any).from("home_experiences").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("home_experiences").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
  };

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display mb-2">Upplevelser på startsidan</h1>
          <p className="text-muted-foreground text-sm">
            Korten under "Upplevelser som formar minnen". Välj bild, texter och vilken sida kortet
            ska leda till.
          </p>
        </div>
        <Button onClick={addItem} className="flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Nytt kort
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laddar...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Inga kort ännu. Klicka "Nytt kort".</p>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              id={`home-exp-${item.id}`}
              className={`rounded-xl border bg-card p-5 space-y-4 transition-colors ${
                highlightId === item.id ? "border-primary ring-2 ring-primary/40" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(v) => patch(item.id, { is_active: v })}
                    />
                    {item.is_active ? "Aktiv" : "Inaktiv"}
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => move(item.id, -1)} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => move(item.id, 1)}
                    disabled={i === items.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ImageUploader
                value={item.image_url ?? ""}
                prefix="home-experiences"
                onUploaded={(url) => patch(item.id, { image_url: url })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Titel</Label>
                  <Input
                    value={item.title}
                    placeholder="Fotboll"
                    onChange={(e) => setLocal(item.id, { title: e.target.value })}
                    onBlur={(e) => patch(item.id, { title: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Underrubrik</Label>
                  <Input
                    value={item.subtitle ?? ""}
                    placeholder="Premier League · Champions League"
                    onChange={(e) => setLocal(item.id, { subtitle: e.target.value })}
                    onBlur={(e) => patch(item.id, { subtitle: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Etikett</Label>
                  <Input
                    value={item.tag ?? ""}
                    placeholder="Matchupplevelser"
                    onChange={(e) => setLocal(item.id, { tag: e.target.value })}
                    onBlur={(e) => patch(item.id, { tag: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Knapptext</Label>
                  <Input
                    value={item.cta_label}
                    placeholder="Läs mer"
                    onChange={(e) => setLocal(item.id, { cta_label: e.target.value })}
                    onBlur={(e) => patch(item.id, { cta_label: e.target.value || "Läs mer" })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs uppercase tracking-wider">Beskrivning</Label>
                  <Textarea
                    rows={3}
                    value={item.description ?? ""}
                    placeholder="Kort text under kortet"
                    onChange={(e) => setLocal(item.id, { description: e.target.value })}
                    onBlur={(e) => patch(item.id, { description: e.target.value || null })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs uppercase tracking-wider">Länk</Label>
                  <LinkPicker
                    value={item.href}
                    onChange={(v) => patch(item.id, { href: v || "/contact" })}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addItem} className="w-full h-12 border-dashed">
            <Plus className="h-4 w-4 mr-2" /> Lägg till ytterligare kort
          </Button>
        </div>
      )}
    </div>
  );
}
