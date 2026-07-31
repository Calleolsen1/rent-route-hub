import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role_title: string | null;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  sort_order: number;
  is_published: boolean;
};

export default function AdminTeam() {
  const [rows, setRows] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data ?? []) as TeamMember[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const patch = (id: string, values: Partial<TeamMember>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...values } : r)));

  const save = async (row: TeamMember) => {
    setSavingId(row.id);
    const { id, ...values } = row;
    const { error } = await supabase.from("team_members").update(values).eq("id", id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success("Sparad — förhandsvisningen uppdateras");
  };

  const add = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .insert({
        name: "Ny medarbetare",
        role_title: "Resespecialist",
        sort_order: rows.length,
        is_published: false,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows((prev) => [...prev, data as TeamMember]);
  };

  const remove = async (id: string) => {
    if (!confirm("Ta bort denna medarbetare?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Borttagen");
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((r, i) => ({ ...r, sort_order: i }));
    setRows(reordered);
    await Promise.all(
      reordered.map((r) =>
        supabase.from("team_members").update({ sort_order: r.sort_order }).eq("id", r.id),
      ),
    );
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">
            Medarbetarna som visas på Om oss-sidan. Ändringar syns direkt i förhandsvisningen.
          </p>
        </div>
        <Button onClick={add} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Lägg till
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Inga medarbetare ännu. Klicka på “Lägg till”.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((row, i) => (
            <div key={row.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="flex flex-col items-center gap-1 pt-2 text-muted-foreground">
                  <button onClick={() => move(i, -1)} className="hover:text-foreground" title="Flytta upp">
                    ▲
                  </button>
                  <GripVertical className="h-4 w-4" />
                  <button onClick={() => move(i, 1)} className="hover:text-foreground" title="Flytta ner">
                    ▼
                  </button>
                </div>

                <ImagePicker
                  value={row.photo_url}
                  prefix="team"
                  onChange={(url) => patch(row.id, { photo_url: url })}
                />

                <div className="flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={row.name}
                      placeholder="Namn"
                      onChange={(e) => patch(row.id, { name: e.target.value })}
                    />
                    <Input
                      value={row.role_title ?? ""}
                      placeholder="Titel"
                      onChange={(e) => patch(row.id, { role_title: e.target.value })}
                    />
                    <Input
                      value={row.email ?? ""}
                      placeholder="E-post"
                      onChange={(e) => patch(row.id, { email: e.target.value })}
                    />
                    <Input
                      value={row.phone ?? ""}
                      placeholder="Telefon"
                      onChange={(e) => patch(row.id, { phone: e.target.value })}
                    />
                  </div>
                  <Textarea
                    value={row.bio ?? ""}
                    placeholder="Kort presentation"
                    rows={3}
                    onChange={(e) => patch(row.id, { bio: e.target.value })}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch
                        checked={row.is_published}
                        onCheckedChange={(v) => patch(row.id, { is_published: v })}
                      />
                      Publicerad
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(row.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => save(row)} disabled={savingId === row.id}>
                        {savingId === row.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Spara
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
