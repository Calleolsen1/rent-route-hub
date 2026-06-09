import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";

type Row = {
  key: string;
  value: unknown;
  description: string | null;
};

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Friendly editor for `site_content` rows. Hides JSON entirely:
 *  - Array-of-strings → numbered paragraph blocks with [+] / [×] per paragraph.
 *  - String → single textarea.
 *  - Unknown shapes are skipped (developer territory).
 *
 * Saves on blur for textareas and immediately on add/remove paragraph.
 * No "Lägg till nyckel" — adding new keys is a developer action because
 * the site has to consume the new key somewhere.
 */
export default function PageTextsManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlySaved, setRecentlySaved] = useState<Record<string, true>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("site_content").select("*").order("key");
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const flashSaved = (key: string) => {
    setRecentlySaved((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setRecentlySaved((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 1500);
  };

  const saveValue = async (key: string, value: unknown) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, value } : r)));
    const { error } = await (supabase as any)
      .from("site_content")
      .update({ value })
      .eq("key", key);
    if (error) {
      toast.error(error.message ?? "Kunde inte spara");
      return;
    }
    flashSaved(key);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laddar...</p>;

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Inga sidtexter konfigurerade — utvecklaren lägger till nya när de
        kopplas in på en sida.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Texter som visas på olika sidor. Ändringar sparas automatiskt när du
        klickar bort från ett fält.
      </p>

      {rows.map((r) => {
        const saved = recentlySaved[r.key];
        return (
          <div key={r.key} className="rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">
                  {r.description ?? r.key}
                </Label>
                {r.description && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{r.key}</p>
                )}
              </div>
              {saved && (
                <span className="text-xs text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Sparad
                </span>
              )}
            </div>

            {isStringArray(r.value) ? (
              <ParagraphList
                paragraphs={r.value}
                onChange={(next) => saveValue(r.key, next)}
              />
            ) : typeof r.value === "string" ? (
              <Textarea
                rows={3}
                defaultValue={r.value}
                onBlur={(e) => {
                  if (e.target.value !== r.value) saveValue(r.key, e.target.value);
                }}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Ovanlig datatyp — kontakta utvecklaren för att redigera den här.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ParagraphList({
  paragraphs,
  onChange,
}: {
  paragraphs: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-xs font-mono text-muted-foreground pt-2.5 w-6 text-right">
            {i + 1}.
          </span>
          <Textarea
            rows={3}
            defaultValue={p}
            onBlur={(e) => {
              if (e.target.value !== p) {
                const next = [...paragraphs];
                next[i] = e.target.value;
                onChange(next);
              }
            }}
            className="flex-1"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onChange(paragraphs.filter((_, idx) => idx !== i))}
            disabled={paragraphs.length === 1}
            title="Ta bort stycke"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onChange([...paragraphs, ""])}
      >
        <Plus className="h-3 w-3 mr-1.5" /> Lägg till stycke
      </Button>
    </div>
  );
}
