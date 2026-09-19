import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowUp, ArrowDown, Star } from "lucide-react";

type Row = {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  rating: number;
  is_active: boolean;
  sort_order: number;
};

export default function TestimonialsManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("testimonials")
      .select("*")
      .order("sort_order");
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, p: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
    const { error } = await (supabase as any).from("testimonials").update(p).eq("id", id);
    if (error) toast.error(error.message ?? "Kunde inte spara");
  };

  const add = async () => {
    const nextOrder = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.sort_order)) + 1;
    const { data, error } = await (supabase as any)
      .from("testimonials")
      .insert({
        quote: "Skriv ett nytt citat här...",
        author: "Författare",
        rating: 5,
        is_active: false,
        sort_order: nextOrder,
      })
      .select("*")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Kunde inte skapa");
      return;
    }
    setRows((prev) => [...prev, data as Row]);
  };

  const remove = async (id: string) => {
    if (!confirm("Ta bort citat?")) return;
    const { error } = await (supabase as any).from("testimonials").delete().eq("id", id);
    if (error) {
      toast.error(error.message ?? "Kunde inte ta bort");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === id);
    const other = idx + dir;
    if (idx < 0 || other < 0 || other >= rows.length) return;
    const a = rows[idx];
    const b = rows[other];
    const newRows = [...rows];
    newRows[idx] = { ...a, sort_order: b.sort_order };
    newRows[other] = { ...b, sort_order: a.sort_order };
    newRows.sort((x, y) => x.sort_order - y.sort_order);
    setRows(newRows);
    await Promise.all([
      (supabase as any).from("testimonials").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("testimonials").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laddar...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <p className="text-xs text-muted-foreground">
          Kundcitat på startsidan. Avaktivera för att dölja utan att radera.
        </p>
        <Button size="sm" onClick={add}>
          <Plus className="h-3 w-3 mr-1.5" /> Nytt citat
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Inga citat - klicka "Nytt citat" för att börja.</p>
      ) : (
        rows.map((r, i) => (
          <div key={r.id} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={(v) => patch(r.id, { is_active: v })}
                  />
                  {r.is_active ? "Aktiv" : "Inaktiv"}
                </label>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(r.id, -1)} disabled={i === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => move(r.id, 1)} disabled={i === rows.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-[10px] uppercase tracking-wider">Citat</Label>
              <Textarea
                rows={3}
                defaultValue={r.quote}
                onBlur={(e) => e.target.value !== r.quote && patch(r.id, { quote: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider">Författare</Label>
                <Input
                  defaultValue={r.author}
                  onBlur={(e) => e.target.value !== r.author && patch(r.id, { author: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider">Roll / Företag</Label>
                <Input
                  defaultValue={r.role ?? ""}
                  onBlur={(e) => e.target.value !== (r.role ?? "") && patch(r.id, { role: e.target.value || null })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider">Betyg</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => patch(r.id, { rating: n })}
                    className="p-1"
                    aria-label={`${n} stjärnor`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        n <= r.rating ? "fill-primary text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
