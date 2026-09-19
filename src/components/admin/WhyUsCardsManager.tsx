import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown, Users, Trophy, Globe, Shield } from "lucide-react";

const ICON_OPTIONS = ["Users", "Trophy", "Globe", "Shield"] as const;
const ICON_MAP = { Users, Trophy, Globe, Shield };

type Row = {
  id: string;
  icon: string;
  title: string;
  description: string;
  is_active: boolean;
  sort_order: number;
};

export default function WhyUsCardsManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("why_us_cards")
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
    const { error } = await (supabase as any).from("why_us_cards").update(p).eq("id", id);
    if (error) toast.error(error.message ?? "Kunde inte spara");
  };

  const add = async () => {
    const nextOrder = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.sort_order)) + 1;
    const { data, error } = await (supabase as any)
      .from("why_us_cards")
      .insert({
        icon: "Trophy",
        title: "Ny rubrik",
        description: "Beskrivning kommer här",
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
    if (!confirm("Ta bort kort?")) return;
    const { error } = await (supabase as any).from("why_us_cards").delete().eq("id", id);
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
      (supabase as any).from("why_us_cards").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("why_us_cards").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laddar...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <p className="text-xs text-muted-foreground">
          "Vad gör oss annorlunda"-korten. Visas inte ännu publikt - säkerhetsdata för
          framtida placering. Du kan redigera dem nu så de är redo när de aktiveras.
        </p>
        <Button size="sm" onClick={add}>
          <Plus className="h-3 w-3 mr-1.5" /> Nytt kort
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Inga kort.</p>
      ) : (
        rows.map((r, i) => {
          const Icon = ICON_MAP[r.icon as keyof typeof ICON_MAP] ?? Trophy;
          return (
            <div key={r.id} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Switch checked={r.is_active} onCheckedChange={(v) => patch(r.id, { is_active: v })} />
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider">Ikon</Label>
                  <Select value={r.icon} onValueChange={(v) => patch(r.id, { icon: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px] uppercase tracking-wider">Rubrik</Label>
                  <Input
                    defaultValue={r.title}
                    onBlur={(e) => e.target.value !== r.title && patch(r.id, { title: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider">Beskrivning</Label>
                <Textarea
                  rows={2}
                  defaultValue={r.description}
                  onBlur={(e) => e.target.value !== r.description && patch(r.id, { description: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
