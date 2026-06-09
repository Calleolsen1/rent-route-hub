import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Plus, Trash2, ExternalLink } from "lucide-react";

type Row = {
  key: string;
  value: unknown;
  description: string | null;
};

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Editor for site_content. Rows are grouped into one tab per public page so
 * admins see ~5 related fields at a time instead of scrolling through every
 * key on every page. Page assignment is done by key prefix
 * (about_*, contact_*, group_*, training_*) — anything that doesn't match
 * lands in "Övrigt" so developer-added keys aren't lost.
 *
 * Saves on blur for textareas and immediately on paragraph add/remove.
 */

type PageGroup = {
  id: string;
  label: string;
  href: string;
  matchPrefix: string;
};

const PAGE_GROUPS: PageGroup[] = [
  { id: "about", label: "Om oss", href: "/about", matchPrefix: "about_" },
  { id: "contact", label: "Kontakt", href: "/contact", matchPrefix: "contact_" },
  { id: "group", label: "Gruppresor", href: "/group-travel", matchPrefix: "group_" },
  { id: "training", label: "Träningsläger", href: "/services/traningslager", matchPrefix: "training_" },
];

const OTHER_GROUP: PageGroup = { id: "other", label: "Övrigt", href: "/", matchPrefix: "" };

function groupForKey(key: string): PageGroup {
  return PAGE_GROUPS.find((g) => key.startsWith(g.matchPrefix)) ?? OTHER_GROUP;
}

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

  // Group rows by page, but only include groups that actually have rows
  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const group = groupForKey(r.key);
      if (!map.has(group.id)) map.set(group.id, []);
      map.get(group.id)!.push(r);
    }
    const allGroups = [...PAGE_GROUPS, OTHER_GROUP];
    return allGroups
      .map((g) => ({ group: g, items: map.get(g.id) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [rows]);

  if (loading) return <p className="text-sm text-muted-foreground">Laddar...</p>;

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Inga sidtexter konfigurerade — utvecklaren lägger till nya när de
        kopplas in på en sida.
      </p>
    );
  }

  if (grouped.length === 0) {
    return null;
  }

  // Pick the first group as default
  const defaultTab = grouped[0].group.id;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Texter som visas på olika sidor. Välj sidan du vill redigera nedan. Ändringar sparas automatiskt när du klickar bort från ett fält.
      </p>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex flex-wrap h-auto">
          {grouped.map(({ group, items }) => (
            <TabsTrigger key={group.id} value={group.id} className="gap-2">
              {group.label}
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {items.length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {grouped.map(({ group, items }) => (
          <TabsContent key={group.id} value={group.id} className="mt-6">
            <div className="rounded-xl border border-border bg-muted/20 p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-display text-lg">{group.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {items.length} redigerbara fält på den här sidan
                </p>
              </div>
              {group.id !== "other" && (
                <Link
                  to={group.href}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Öppna sidan i ny flik <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {items.map((r) => (
                <ContentField
                  key={r.key}
                  row={r}
                  saved={!!recentlySaved[r.key]}
                  onSave={saveValue}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ContentField({
  row,
  saved,
  onSave,
}: {
  row: Row;
  saved: boolean;
  onSave: (key: string, value: unknown) => void;
}) {
  return (
    <div className="rounded-xl border border-border p-5 space-y-3 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-medium">
            {row.description ?? row.key}
          </Label>
          {row.description && (
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{row.key}</p>
          )}
        </div>
        {saved && (
          <span className="text-xs text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Sparad
          </span>
        )}
      </div>

      {isStringArray(row.value) ? (
        <ParagraphList
          paragraphs={row.value}
          onChange={(next) => onSave(row.key, next)}
        />
      ) : typeof row.value === "string" ? (
        <Textarea
          rows={3}
          defaultValue={row.value}
          onBlur={(e) => {
            if (e.target.value !== row.value) onSave(row.key, e.target.value);
          }}
        />
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Ovanlig datatyp — kontakta utvecklaren för att redigera den här.
        </p>
      )}
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
