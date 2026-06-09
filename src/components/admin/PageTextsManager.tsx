import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2 } from "lucide-react";

type Row = {
  key: string;
  value: any;
  description: string | null;
};

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

export default function PageTextsManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("site_content").select("*").order("key");
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // For array-typed values we join with double newlines for display;
  // user can edit naturally and we split back on save.
  const toDraft = (value: any): string => {
    if (isStringArray(value)) return value.join("\n\n");
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2);
  };

  const fromDraft = (key: string, draft: string, originalValue: any): any => {
    // Preserve the original value's shape: array → split; string → string.
    if (isStringArray(originalValue)) {
      return draft.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
    }
    if (typeof originalValue === "string" || originalValue == null) {
      return draft;
    }
    // Fallback — try parse JSON for nested structures
    try {
      return JSON.parse(draft);
    } catch {
      toast.error(`Ogiltigt JSON-format för ${key}`);
      return originalValue;
    }
  };

  const save = async (row: Row) => {
    const draft = drafts[row.key] ?? toDraft(row.value);
    const value = fromDraft(row.key, draft, row.value);
    const { error } = await (supabase as any)
      .from("site_content")
      .update({ value })
      .eq("key", row.key);
    if (error) {
      toast.error(error.message ?? "Kunde inte spara");
      return;
    }
    setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, value } : r)));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[row.key];
      return next;
    });
    toast.success(`${row.key} sparad`);
  };

  const remove = async (key: string) => {
    if (!confirm(`Ta bort nyckeln "${key}"? Sidan som använder den faller tillbaka till hårdkodad text.`)) return;
    const { error } = await (supabase as any).from("site_content").delete().eq("key", key);
    if (error) {
      toast.error(error.message ?? "Kunde inte ta bort");
      return;
    }
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const addNew = async () => {
    const key = prompt("Nyckel (t.ex. contact_intro):");
    if (!key) return;
    const trimmed = key.trim();
    if (!trimmed) return;
    const { data, error } = await (supabase as any)
      .from("site_content")
      .insert({ key: trimmed, value: "Ny text...", description: null })
      .select("*")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Kunde inte skapa");
      return;
    }
    setRows((prev) => [...prev, data as Row].sort((a, b) => a.key.localeCompare(b.key)));
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laddar...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <p className="text-xs text-muted-foreground">
          Textblock som används på olika sidor (Om oss-historien, intro-texter etc.). Listor av
          stycken separeras med <strong>två radbrytningar</strong>.
        </p>
        <Button size="sm" onClick={addNew} variant="outline">
          <Plus className="h-3 w-3 mr-1.5" /> Lägg till nyckel
        </Button>
      </div>

      {rows.map((r) => {
        const draft = drafts[r.key] ?? toDraft(r.value);
        const original = toDraft(r.value);
        const dirty = draft !== original;
        return (
          <div key={r.key} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <code className="text-sm font-mono">{r.key}</code>
                {r.description && (
                  <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  onClick={() => save(r)}
                  disabled={!dirty}
                  variant={dirty ? "default" : "outline"}
                >
                  <Save className="h-3 w-3 mr-1.5" /> Spara
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(r.key)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              rows={isStringArray(r.value) ? 8 : 4}
              value={draft}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [r.key]: e.target.value }))
              }
              className="font-mono text-sm"
            />
          </div>
        );
      })}
    </div>
  );
}
