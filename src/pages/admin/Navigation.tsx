import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, AlertTriangle, ChevronDown, ChevronRight, X, ExternalLink, Check, AlertCircle, Pencil } from "lucide-react";
import { invalidateNavigation } from "@/hooks/useNavigation";
import { ImageUploader } from "@/components/admin/ImageUploader";

type TopMenuItem = {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
};

type Sport = {
  id: string;
  slug: string;
  label: string;
  sport_filter: string | null;
  menu_style: "grouped" | "list";
  entry_kind: "team" | "race";
  sort_order: number;
  is_active: boolean;
};

type Entry = {
  id: string;
  sport_id: string;
  slug: string;
  name: string;
  group_label: string | null;
  city: string | null;
  venue: string | null;
  date_text: string | null;
  short_date: string | null;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  features_json: string[] | null;
  sort_order: number;
  is_active: boolean;
  show_in_menu: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/å|ä/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * Validates a team / race name against the synced events table in real time.
 * `events.home_team` (or away_team) for teams, `events.race_name` for races.
 *
 * Returns:
 *   - status: "idle" while name is empty/short
 *             "loading" during debounce + query
 *             "match" when at least one event exact-matches
 *             "no-match" when nothing found (with `suggestions` of similar names)
 *   - count:  number of upcoming events matching the name exactly
 */
type EventMatchStatus = "idle" | "loading" | "match" | "no-match";
type EventMatch = {
  status: EventMatchStatus;
  count: number;
  suggestions: string[];
};

function useEventNameMatch(name: string, kind: "team" | "race"): EventMatch {
  const [result, setResult] = useState<EventMatch>({ status: "idle", count: 0, suggestions: [] });
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setResult({ status: "idle", count: 0, suggestions: [] });
      return;
    }
    setResult((r) => ({ ...r, status: "loading" }));
    const handle = setTimeout(async () => {
      try {
        if (kind === "team") {
          // Exact match check - home_team or away_team
          const { data: exactRows } = await (supabase as any)
            .from("events")
            .select("id, home_team, away_team, starts_at, status")
            .or(`home_team.eq.${trimmed},away_team.eq.${trimmed}`)
            .gte("starts_at", new Date().toISOString());
          const count = (exactRows ?? []).length;
          if (count > 0) {
            setResult({ status: "match", count, suggestions: [] });
            return;
          }
          // Fuzzy fallback - show top suggestions
          const { data: fuzzyRows } = await (supabase as any)
            .from("events")
            .select("home_team, away_team")
            .or(`home_team.ilike.%${trimmed}%,away_team.ilike.%${trimmed}%`)
            .limit(20);
          const suggestions = Array.from(
            new Set(
              ((fuzzyRows ?? []) as Array<{ home_team: string | null; away_team: string | null }>)
                .flatMap((r) => [r.home_team, r.away_team])
                .filter((v): v is string => !!v && v !== trimmed)
            ),
          ).slice(0, 5);
          setResult({ status: "no-match", count: 0, suggestions });
        } else {
          const { data: exactRows } = await (supabase as any)
            .from("events")
            .select("id, race_name, starts_at, status")
            .eq("race_name", trimmed)
            .gte("starts_at", new Date().toISOString());
          const count = (exactRows ?? []).length;
          if (count > 0) {
            setResult({ status: "match", count, suggestions: [] });
            return;
          }
          const { data: fuzzyRows } = await (supabase as any)
            .from("events")
            .select("race_name")
            .ilike("race_name", `%${trimmed}%`)
            .limit(10);
          const suggestions = Array.from(
            new Set(
              ((fuzzyRows ?? []) as Array<{ race_name: string | null }>)
                .map((r) => r.race_name)
                .filter((v): v is string => !!v && v !== trimmed)
            ),
          ).slice(0, 5);
          setResult({ status: "no-match", count: 0, suggestions });
        }
      } catch (e) {
        console.warn("[useEventNameMatch]", e);
        setResult({ status: "no-match", count: 0, suggestions: [] });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [name, kind]);
  return result;
}

export default function AdminNavigation() {
  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-display mb-2">Navigation</h1>
        <p className="text-sm text-muted-foreground">
          Här bygger du upp menyn och landningssidorna. Ändringar går live direkt - besökare ser dem nästa gång de fokuserar fliken.
        </p>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Tips:</strong> Namnet på lag/race måste exakt matcha det leverantören skickar (t.ex. "Arsenal", inte "Arsenal FC") - annars hittas inga biljetter på landningssidan.
        </span>
      </div>

      <Tabs defaultValue="sports">
        <TabsList>
          <TabsTrigger value="sports">Sporter & sidor</TabsTrigger>
          <TabsTrigger value="menu">Toppmeny</TabsTrigger>
        </TabsList>
        <TabsContent value="sports" className="mt-6">
          <SportsEditor />
        </TabsContent>
        <TabsContent value="menu" className="mt-6">
          <TopMenuEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* --------------------------- TOP MENU ---------------------------------- */

function TopMenuEditor() {
  const [rows, setRows] = useState<TopMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("nav_top_menu_items").select("*").order("sort_order");
    setRows((data ?? []) as TopMenuItem[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (row: TopMenuItem) => {
    setBusy(row.id);
    const { error } = await (supabase as any).from("nav_top_menu_items").update({
      label: row.label, href: row.href, sort_order: row.sort_order, is_active: row.is_active,
    }).eq("id", row.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    toast.success("Sparat");
  };
  const del = async (id: string) => {
    if (!confirm("Ta bort länken?")) return;
    setBusy(id);
    const { error } = await (supabase as any).from("nav_top_menu_items").delete().eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await load();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laddar…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Länkar som visas till höger i menyn (Grupp & Konferens, Om oss, …).
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3 mr-2" /> Ny länk
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Inga länkar än. Klicka "Ny länk" för att lägga till.
        </div>
      ) : rows.map((row, idx) => (
        <div key={row.id} className="rounded-lg border border-border bg-card p-4 grid grid-cols-12 gap-3 items-end">
          <div className="col-span-3">
            <Label className="text-[10px] uppercase tracking-wider">Text</Label>
            <Input value={row.label} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))} onBlur={() => save(row)} className="h-9" />
          </div>
          <div className="col-span-5">
            <Label className="text-[10px] uppercase tracking-wider">URL</Label>
            <Input value={row.href} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, href: e.target.value } : r))} onBlur={() => save(row)} className="h-9" />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-wider">Ordning</Label>
            <Input type="number" value={row.sort_order} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, sort_order: Number(e.target.value) } : r))} onBlur={() => save(row)} className="h-9" />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-3">
            <Switch checked={row.is_active} onCheckedChange={(v) => { const next = { ...row, is_active: v }; setRows(rows.map((r, i) => i === idx ? next : r)); save(next); }} />
            <Button size="icon" variant="ghost" disabled={busy === row.id} onClick={() => del(row.id)}>
              {busy === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
            </Button>
          </div>
        </div>
      ))}

      <NewTopMenuDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nextOrder={rows.reduce((m, r) => Math.max(m, r.sort_order), 0) + 10}
        onSaved={async () => { await load(); invalidateNavigation(); }}
      />
    </div>
  );
}

function NewTopMenuDialog({ open, onOpenChange, nextOrder, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; nextOrder: number; onSaved: () => Promise<void> }) {
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("/");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (open) { setLabel(""); setHref("/"); } }, [open]);

  const submit = async () => {
    if (!label.trim()) return toast.error("Text krävs");
    if (!href.trim()) return toast.error("URL krävs");
    setSubmitting(true);
    const { error } = await (supabase as any).from("nav_top_menu_items").insert({
      label: label.trim(), href: href.trim(), sort_order: nextOrder, is_active: true,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Länk skapad");
    await onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny menylänk</DialogTitle>
          <DialogDescription>Visas till höger i toppmenyn. URL kan vara en sida på sajten (t.ex. /about) eller en extern länk.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Text i menyn</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="t.ex. Blogg" autoFocus />
          </div>
          <div>
            <Label>URL</Label>
            <Input value={href} onChange={(e) => setHref(e.target.value)} placeholder="/blog eller https://…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            Skapa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- SPORTS ------------------------------------ */

function SportsEditor() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedSport, setExpandedSport] = useState<string | null>(null);
  const [newSportOpen, setNewSportOpen] = useState(false);
  const [editSport, setEditSport] = useState<Sport | null>(null);
  const [newEntryFor, setNewEntryFor] = useState<Sport | null>(null);
  const [editEntry, setEditEntry] = useState<{ entry: Entry; sport: Sport } | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, e] = await Promise.all([
      (supabase as any).from("nav_sports").select("*").order("sort_order"),
      (supabase as any).from("nav_menu_entries").select("*").order("sort_order"),
    ]);
    setSports((s.data ?? []) as Sport[]);
    setEntries((e.data ?? []) as Entry[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const delSport = async (id: string, label: string) => {
    if (!confirm(`Ta bort sporten "${label}" OCH alla dess sidor? Detta kan inte ångras.`)) return;
    setBusy(id);
    const { error } = await (supabase as any).from("nav_sports").delete().eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await load();
  };

  const delEntry = async (entry: Entry) => {
    if (!confirm(`Ta bort "${entry.name}"?`)) return;
    setBusy(entry.id);
    const { error } = await (supabase as any).from("nav_menu_entries").delete().eq("id", entry.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await load();
  };

  const toggleSportActive = async (sport: Sport, v: boolean) => {
    const { error } = await (supabase as any).from("nav_sports").update({ is_active: v }).eq("id", sport.id);
    if (error) return toast.error(error.message);
    setSports(sports.map((s) => s.id === sport.id ? { ...s, is_active: v } : s));
    invalidateNavigation();
  };

  const toggleEntryActive = async (entry: Entry, v: boolean) => {
    const { error } = await (supabase as any).from("nav_menu_entries").update({ is_active: v }).eq("id", entry.id);
    if (error) return toast.error(error.message);
    setEntries(entries.map((e) => e.id === entry.id ? { ...e, is_active: v } : e));
    invalidateNavigation();
  };

  const toggleEntryShowInMenu = async (entry: Entry, v: boolean) => {
    const { error } = await (supabase as any).from("nav_menu_entries").update({ show_in_menu: v }).eq("id", entry.id);
    if (error) {
      if (/show_in_menu/.test(error.message)) {
        toast.error("Migrationen för 'Visa i meny' är inte applicerad än. Be Lovable köra 20260609200000_nav_show_in_menu.sql.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    setEntries(entries.map((e) => e.id === entry.id ? { ...e, show_in_menu: v } : e));
    invalidateNavigation();
  };

  const renameLeague = async (sportId: string, oldLabel: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed || trimmed === oldLabel) return;
    const { error } = await (supabase as any)
      .from("nav_menu_entries")
      .update({ group_label: trimmed })
      .eq("sport_id", sportId)
      .eq("group_label", oldLabel);
    if (error) return toast.error(error.message);
    setEntries(entries.map((e) =>
      e.sport_id === sportId && e.group_label === oldLabel ? { ...e, group_label: trimmed } : e,
    ));
    invalidateNavigation();
    toast.success(`Bytte namn på "${oldLabel}" till "${trimmed}"`);
  };

  const deleteLeague = async (sportId: string, label: string) => {
    const { error } = await (supabase as any)
      .from("nav_menu_entries")
      .update({ group_label: null })
      .eq("sport_id", sportId)
      .eq("group_label", label);
    if (error) return toast.error(error.message);
    setEntries(entries.map((e) =>
      e.sport_id === sportId && e.group_label === label ? { ...e, group_label: null } : e,
    ));
    invalidateNavigation();
    toast.success(`Tog bort gruppen "${label}". Sidorna finns kvar utan grupp.`);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laddar…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Varje sport är en dropdown i menyn med en lista av sidor under sig.
        </p>
        <Button onClick={() => setNewSportOpen(true)}>
          <Plus className="h-3 w-3 mr-2" /> Ny sport
        </Button>
      </div>

      {sports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Inga sporter än. Klicka "Ny sport" för att lägga till (t.ex. Fotboll, F1, Tennis).
        </div>
      ) : sports.map((sport) => {
        const sportEntries = entries.filter((e) => e.sport_id === sport.id);
        const isOpen = expandedSport === sport.id;
        return (
          <div key={sport.id} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 flex items-center gap-3 hover:bg-muted/30 cursor-pointer" onClick={() => setExpandedSport(isOpen ? null : sport.id)}>
              {isOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <h3 className="font-display text-lg">{sport.label}</h3>
                  <span className="text-xs text-muted-foreground font-mono">/{sport.slug}</span>
                  <span className="text-xs text-muted-foreground">· {sportEntries.length} sid{sportEntries.length === 1 ? "a" : "or"}</span>
                  {!sport.is_active && <span className="text-xs text-amber-700">· dold</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sport.menu_style === "grouped" ? "Grupperad meny (sub-rubriker)" : "Enkel lista"} ·
                  Sport-filter: <code className="bg-muted px-1 rounded">{sport.sport_filter ?? "-"}</code>
                </p>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Switch checked={sport.is_active} onCheckedChange={(v) => toggleSportActive(sport, v)} />
                <Button size="sm" variant="ghost" onClick={() => setEditSport(sport)}>Redigera</Button>
                <Button size="icon" variant="ghost" disabled={busy === sport.id} onClick={() => delSport(sport.id, sport.label)}>
                  {busy === sport.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                </Button>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    Sidor under <strong>{sport.label}</strong>
                    {sport.menu_style === "grouped" && ` - grupperade efter "${sport.entry_kind === "team" ? "liga" : "kategori"}"`}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setNewEntryFor(sport)}>
                    <Plus className="h-3 w-3 mr-1.5" /> Lägg till {sport.entry_kind === "team" ? "lag" : "race"}
                  </Button>
                </div>
                {sportEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Inga sidor under {sport.label} än.
                  </p>
                ) : (
                  <EntriesList
                    sport={sport}
                    entries={sportEntries}
                    busy={busy}
                    onEdit={(entry) => setEditEntry({ entry, sport })}
                    onDelete={delEntry}
                    onToggleActive={toggleEntryActive}
                    onToggleShowInMenu={toggleEntryShowInMenu}
                    onRenameLeague={async (oldLabel, newLabel) => { await renameLeague(sport.id, oldLabel, newLabel); }}
                    onDeleteLeague={async (label) => { await deleteLeague(sport.id, label); }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      <SportDialog
        open={newSportOpen || !!editSport}
        onOpenChange={(o) => { if (!o) { setNewSportOpen(false); setEditSport(null); } }}
        initial={editSport}
        nextOrder={sports.reduce((m, r) => Math.max(m, r.sort_order), 0) + 10}
        onSaved={async () => { await load(); invalidateNavigation(); }}
      />

      {newEntryFor && (
        <EntryDialog
          open={!!newEntryFor}
          onOpenChange={(o) => { if (!o) setNewEntryFor(null); }}
          sport={newEntryFor}
          initial={null}
          nextOrder={(entries.filter((e) => e.sport_id === newEntryFor.id).reduce((m, r) => Math.max(m, r.sort_order), 0)) + 10}
          existingGroupLabels={Array.from(new Set(entries.filter((e) => e.sport_id === newEntryFor.id && e.group_label).map((e) => e.group_label!))).sort()}
          onSaved={async () => { await load(); invalidateNavigation(); }}
        />
      )}

      {editEntry && (
        <EntryDialog
          open={!!editEntry}
          onOpenChange={(o) => { if (!o) setEditEntry(null); }}
          sport={editEntry.sport}
          initial={editEntry.entry}
          nextOrder={editEntry.entry.sort_order}
          existingGroupLabels={Array.from(new Set(entries.filter((e) => e.sport_id === editEntry.sport.id && e.group_label).map((e) => e.group_label!))).sort()}
          onSaved={async () => { await load(); invalidateNavigation(); }}
        />
      )}
    </div>
  );
}

/* --------------------------- ENTRIES LIST ------------------------------ */

function EntriesList({
  sport,
  entries,
  busy,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleShowInMenu,
  onRenameLeague,
  onDeleteLeague,
}: {
  sport: Sport;
  entries: Entry[];
  busy: string | null;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
  onToggleActive: (entry: Entry, v: boolean) => void;
  onToggleShowInMenu: (entry: Entry, v: boolean) => void;
  onRenameLeague: (oldLabel: string, newLabel: string) => Promise<void>;
  onDeleteLeague: (label: string) => Promise<void>;
}) {
  // For grouped sports (Fotboll), group entries by league inside the sport.
  // For list sports (F1), render flat.
  const groups = (() => {
    if (sport.menu_style !== "grouped") return [["", entries] as [string, Entry[]]];
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const key = e.group_label ?? "Övriga (ingen liga)";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  })();

  return (
    <div className="space-y-4">
      {groups.map(([groupLabel, items]) => (
        <div key={groupLabel || "__flat__"}>
          {groupLabel && (
            <LeagueHeader
              label={groupLabel}
              count={items.length}
              isRealLeague={groupLabel !== "Övriga (ingen liga)"}
              onRename={async (newLabel) => onRenameLeague(groupLabel, newLabel)}
              onDelete={async () => onDeleteLeague(groupLabel)}
            />
          )}
          <div className="space-y-1">
            {items.map((entry) => (
              <div key={entry.id} className="rounded-md border border-border bg-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">/{sport.slug}/{entry.slug}</span>
                    {!entry.is_active && <span className="text-xs text-amber-700">· dold (inaktiv)</span>}
                    {entry.is_active && entry.show_in_menu === false && <span className="text-xs text-muted-foreground">· dold från meny</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {[entry.city, entry.venue].filter(Boolean).join(" · ") || <span className="italic">Saknar info - klicka redigera</span>}
                  </div>
                </div>
                <a
                  href={`/services/sportresor/${sport.slug}/${entry.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  title="Öppna landningssidan"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
                <label className="flex flex-col items-center gap-0.5 text-[9px] uppercase tracking-wider text-muted-foreground" title="Visa i navbar-dropdown">
                  Meny
                  <Switch checked={entry.show_in_menu ?? true} onCheckedChange={(v) => onToggleShowInMenu(entry, v)} />
                </label>
                <label className="flex flex-col items-center gap-0.5 text-[9px] uppercase tracking-wider text-muted-foreground" title="Sidan är publicerad och nåbar via URL">
                  Aktiv
                  <Switch checked={entry.is_active} onCheckedChange={(v) => onToggleActive(entry, v)} />
                </label>
                <Button size="sm" variant="ghost" onClick={() => onEdit(entry)}>Redigera</Button>
                <Button size="icon" variant="ghost" disabled={busy === entry.id} onClick={() => onDelete(entry)}>
                  {busy === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 text-destructive" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------- LEAGUE HEADER ----------------------------- */

function LeagueHeader({
  label,
  count,
  isRealLeague,
  onRename,
  onDelete,
}: {
  label: string;
  count: number;
  isRealLeague: boolean;
  onRename: (newLabel: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setDraft(label); }, [label]);

  const commit = async () => {
    const next = draft.trim();
    if (!next || next === label) {
      setEditing(false);
      setDraft(label);
      return;
    }
    setBusy(true);
    try {
      await onRename(next);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Ta bort gruppen "${label}"? Sidorna stannar kvar men flyttas till "Övriga".`)) return;
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-1.5 px-1 group">
      {editing ? (
        <>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setEditing(false); setDraft(label); }
            }}
            onBlur={commit}
            autoFocus
            disabled={busy}
            className="h-7 text-xs uppercase tracking-[0.2em] font-semibold text-primary max-w-[280px]"
          />
          {busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </>
      ) : (
        <>
          <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-primary">
            {label}
          </span>
          <span className="text-[10px] text-muted-foreground">({count})</span>
          {isRealLeague && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-primary"
                title="Döp om hela ligan"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                title="Ta bort gruppen (sidorna behålls)"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
          <div className="flex-1 border-t border-border/50 ml-1" />
        </>
      )}
    </div>
  );
}

/* --------------------------- GROUP LABEL PICKER ------------------------ */

const NEW_GROUP_SENTINEL = "__new__";

function GroupLabelPicker({
  kind,
  existing,
  value,
  onChange,
}: {
  kind: "team" | "race";
  existing: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const label = kind === "team" ? "Liga (gruppering i menyn)" : "Kategori";
  const placeholder = kind === "team" ? "t.ex. Premier League" : "t.ex. Slam";
  // The select is in "add new" mode when value is non-empty AND not in the existing list
  const isNewValue = !!value && !existing.includes(value);
  const [adding, setAdding] = useState(isNewValue);

  // Re-sync when initial value or existing list changes (e.g. editing existing entry)
  useEffect(() => {
    setAdding(!!value && !existing.includes(value));
  }, [value, existing]);

  return (
    <div>
      <Label>{label}</Label>
      {!adding ? (
        <select
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === NEW_GROUP_SENTINEL) {
              onChange("");
              setAdding(true);
            } else {
              onChange(v);
            }
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">- ingen gruppering -</option>
          {existing.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          <option disabled>──────────</option>
          <option value={NEW_GROUP_SENTINEL}>+ Lägg till ny liga…</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("");
              setAdding(false);
            }}
          >
            Avbryt
          </Button>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground mt-1">
        Sidor med samma värde grupperas tillsammans i dropdownen.
      </p>
    </div>
  );
}

/* --------------------------- SPORT DIALOG ------------------------------ */

function SportDialog({ open, onOpenChange, initial, nextOrder, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; initial: Sport | null; nextOrder: number; onSaved: () => Promise<void> }) {
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [sportFilter, setSportFilter] = useState("");
  const [menuStyle, setMenuStyle] = useState<"grouped" | "list">("list");
  const [entryKind, setEntryKind] = useState<"team" | "race">("team");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setLabel(initial.label);
      setSlug(initial.slug);
      setSlugTouched(true);
      setSportFilter(initial.sport_filter ?? "");
      setMenuStyle(initial.menu_style);
      setEntryKind(initial.entry_kind);
    } else {
      setLabel("");
      setSlug("");
      setSlugTouched(false);
      setSportFilter("");
      setMenuStyle("list");
      setEntryKind("team");
    }
  }, [open, initial]);

  const isEdit = !!initial;
  const effectiveSlug = slugTouched ? slug : slugify(label);

  const submit = async () => {
    if (!label.trim()) return toast.error("Sportens namn krävs");
    if (!effectiveSlug.trim()) return toast.error("URL-slug krävs");
    setSubmitting(true);
    const payload = {
      label: label.trim(),
      slug: effectiveSlug.trim(),
      sport_filter: sportFilter.trim() || null,
      menu_style: menuStyle,
      entry_kind: entryKind,
    };
    const { error } = isEdit
      ? await (supabase as any).from("nav_sports").update(payload).eq("id", initial!.id)
      : await (supabase as any).from("nav_sports").insert({ ...payload, sort_order: nextOrder, is_active: true });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Sport uppdaterad" : "Sport skapad");
    await onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Redigera ${initial!.label}` : "Ny sport"}</DialogTitle>
          <DialogDescription>
            En sport blir en dropdown i toppmenyn. Den får automatiskt sin egen URL-sektion på sajten under <code>/services/sportresor/{effectiveSlug || "slug"}/…</code>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Sportens namn <span className="text-muted-foreground">(visas i menyn)</span></Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="t.ex. Tennis" autoFocus />
          </div>
          <div>
            <Label>URL-slug <span className="text-muted-foreground">(autogenereras)</span></Label>
            <Input value={effectiveSlug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} placeholder="t.ex. tennis" />
            <p className="text-[11px] text-muted-foreground mt-1">Slug är delen efter <code>/services/sportresor/</code> i URL:en. Ändra bara om du vet vad du gör.</p>
          </div>
          <div>
            <Label>Sport-filter</Label>
            <Input value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} placeholder="soccer / formula1 / tennis" />
            <p className="text-[11px] text-muted-foreground mt-1">Det här värdet används för att filtrera biljetter på landningssidan. Måste matcha värdet i <code>events.sport</code>.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Meny-stil</Label>
              <select value={menuStyle} onChange={(e) => setMenuStyle(e.target.value as any)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="list">Enkel lista (som F1)</option>
                <option value="grouped">Grupperad (som Fotboll med ligor)</option>
              </select>
            </div>
            <div>
              <Label>Sidornas typ</Label>
              <select value={entryKind} onChange={(e) => setEntryKind(e.target.value as any)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="team">Lag (rubriker: Liga, Arena)</option>
                <option value="race">Race (rubriker: Datum, Bana)</option>
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            {isEdit ? "Spara" : "Skapa sport"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- ENTRY DIALOG ------------------------------ */

function EntryDialog({ open, onOpenChange, sport, initial, nextOrder, existingGroupLabels, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; sport: Sport; initial: Entry | null; nextOrder: number; existingGroupLabels: string[]; onSaved: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [groupLabel, setGroupLabel] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [dateText, setDateText] = useState("");
  const [shortDate, setShortDate] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [showInMenu, setShowInMenu] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [forceSave, setForceSave] = useState(false);
  const evMatch = useEventNameMatch(name, sport.entry_kind);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setSlug(initial.slug);
      setSlugTouched(true);
      setGroupLabel(initial.group_label ?? "");
      setCity(initial.city ?? "");
      setVenue(initial.venue ?? "");
      setDateText(initial.date_text ?? "");
      setShortDate(initial.short_date ?? "");
      setTagline(initial.tagline ?? "");
      setDescription(initial.description ?? "");
      setHeroImageUrl(initial.hero_image_url);
      setFeatures(initial.features_json ?? []);
      setShowInMenu(initial.show_in_menu ?? true);
      setForceSave(true); // existing entries can be re-saved without re-validation
    } else {
      setName(""); setSlug(""); setSlugTouched(false); setGroupLabel("");
      setCity(""); setVenue(""); setDateText(""); setShortDate("");
      setTagline(""); setDescription(""); setHeroImageUrl(null); setFeatures([]);
      setShowInMenu(true);
      setForceSave(false);
    }
  }, [open, initial]);

  const isEdit = !!initial;
  const effectiveSlug = slugTouched ? slug : slugify(name);
  const isRace = sport.entry_kind === "race";

  const submit = async () => {
    if (!name.trim()) return toast.error(`${isRace ? "Race-namn" : "Lagnamn"} krävs`);
    if (!effectiveSlug.trim()) return toast.error("URL-slug krävs");
    setSubmitting(true);
    const payload = {
      sport_id: sport.id,
      slug: effectiveSlug.trim(),
      name: name.trim(),
      group_label: groupLabel.trim() || null,
      city: city.trim() || null,
      venue: venue.trim() || null,
      date_text: dateText.trim() || null,
      short_date: shortDate.trim() || null,
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      hero_image_url: heroImageUrl,
      features_json: features.filter((f) => f.trim().length > 0),
      show_in_menu: showInMenu,
    };
    const { error } = isEdit
      ? await (supabase as any).from("nav_menu_entries").update(payload).eq("id", initial!.id)
      : await (supabase as any).from("nav_menu_entries").insert({ ...payload, sort_order: nextOrder, is_active: true });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Sparat" : "Skapad");
    await onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Redigera ${initial!.name}` : `Lägg till ${isRace ? "race" : "lag"} under ${sport.label}`}
          </DialogTitle>
          <DialogDescription>
            Allt här hamnar på den publika landningssidan <code>/services/sportresor/{sport.slug}/{effectiveSlug || "slug"}</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRace ? "Race-namn" : "Lagets namn"} <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setForceSave(false); }}
                  placeholder={isRace ? "t.ex. Monacos GP" : "t.ex. Arsenal"}
                  autoFocus
                  className={
                    evMatch.status === "match" ? "border-green-500 pr-9" :
                    evMatch.status === "no-match" ? "border-amber-500 pr-9" :
                    "pr-9"
                  }
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  {evMatch.status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {evMatch.status === "match" && <Check className="h-4 w-4 text-green-600" />}
                  {evMatch.status === "no-match" && <AlertCircle className="h-4 w-4 text-amber-600" />}
                </span>
              </div>
              <EventMatchHint match={evMatch} isRace={isRace} onPickSuggestion={(s) => { setName(s); setForceSave(false); }} />
            </div>
            <div>
              <Label>URL-slug</Label>
              <Input value={effectiveSlug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} placeholder={isRace ? "monaco" : "arsenal"} />
            </div>
          </div>

          {sport.menu_style === "grouped" && (
            <GroupLabelPicker
              kind={sport.entry_kind}
              existing={existingGroupLabels}
              value={groupLabel}
              onChange={setGroupLabel}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stad</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="t.ex. London, England" />
            </div>
            <div>
              <Label>{isRace ? "Bana" : "Arena"}</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={isRace ? "t.ex. Hungaroring" : "t.ex. Emirates Stadium"} />
            </div>
          </div>

          {isRace && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Datum (lång form)</Label>
                <Input value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="t.ex. 26 juli 2026" />
              </div>
              <div>
                <Label>Datum (kort form, visas i menyn)</Label>
                <Input value={shortDate} onChange={(e) => setShortDate(e.target.value)} placeholder="t.ex. 26 juli" />
              </div>
            </div>
          )}

          <div>
            <Label>Tagline <span className="text-muted-foreground">(kort fångfras under titeln)</span></Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="t.ex. North London is red" />
          </div>

          <div>
            <Label>Beskrivning</Label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full text-sm rounded-md border border-input bg-background px-3 py-2" placeholder="2-3 meningar som visas på landningssidan." />
          </div>

          <div className="rounded-lg border border-border p-3 flex items-start justify-between gap-3">
            <div>
              <Label className="mb-0.5 block">Visa i menyn</Label>
              <p className="text-[11px] text-muted-foreground">
                Av = sidan är publicerad och nåbar via URL, men syns inte i navbarens dropdown.
                Bra om du vill ha många landningssidor utan att meny-listan svämmar över.
              </p>
            </div>
            <Switch checked={showInMenu} onCheckedChange={setShowInMenu} />
          </div>

          <div>
            <Label className="mb-1 block">Hero-bild</Label>
            <ImageUploader
              value={heroImageUrl}
              prefix={`nav-hero/${effectiveSlug || "draft"}`}
              onUploaded={setHeroImageUrl}
              onCleared={() => setHeroImageUrl(null)}
            />
            <p className="text-[11px] text-muted-foreground mt-1">Lämna tomt för att använda sportens standardbild.</p>
          </div>

          <div>
            <Label className="mb-1 block">"Vad ingår" på landningssidan</Label>
            <div className="space-y-1.5">
              {features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={f}
                    onChange={(e) => setFeatures(features.map((x, j) => j === i ? e.target.value : x))}
                    placeholder="t.ex. Matchbiljetter med bra sittplatser"
                    className="h-9 text-sm"
                  />
                  <Button size="icon" variant="ghost" onClick={() => setFeatures(features.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setFeatures([...features, ""])}>
                <Plus className="h-3 w-3 mr-1.5" /> Lägg till rad
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Lämna helt tom för standard-lista för {isRace ? "race" : "lag"}.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row sm:items-center">
          {evMatch.status === "no-match" && name.trim().length >= 2 && !forceSave && (
            <label className="text-xs text-amber-700 flex items-center gap-2 mr-auto">
              <input type="checkbox" checked={forceSave} onChange={(e) => setForceSave(e.target.checked)} />
              Spara ändå - sidan visar inga biljetter förrän det finns ett matchande event
            </label>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button
            onClick={submit}
            disabled={
              submitting ||
              evMatch.status === "loading" ||
              (evMatch.status === "no-match" && !forceSave)
            }
          >
            {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            {isEdit ? "Spara" : "Skapa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventMatchHint({ match: evMatch, isRace, onPickSuggestion }: { match: EventMatch; isRace: boolean; onPickSuggestion: (s: string) => void }) {
  if (evMatch.status === "idle") {
    return <p className="text-[11px] text-muted-foreground mt-1">Måste matcha eventets {isRace ? "race_name" : "home_team"} exakt - vi söker direkt när du skriver.</p>;
  }
  if (evMatch.status === "loading") {
    return <p className="text-[11px] text-muted-foreground mt-1">Söker bland event…</p>;
  }
  if (evMatch.status === "match") {
    return (
      <p className="text-[11px] text-green-700 mt-1 flex items-center gap-1">
        <Check className="h-3 w-3" /> Hittade {evMatch.count} kommande {evMatch.count === 1 ? "event" : "event"}.
      </p>
    );
  }
  // no-match
  return (
    <div className="text-[11px] mt-1">
      <p className="text-amber-700 flex items-start gap-1">
        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>Ingen exakt matchning bland event. Sidan kommer att visa noll biljetter.</span>
      </p>
      {evMatch.suggestions.length > 0 && (
        <div className="mt-1.5">
          <p className="text-muted-foreground mb-1">Liknande namn (klicka för att använda):</p>
          <div className="flex flex-wrap gap-1.5">
            {evMatch.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onPickSuggestion(s)}
                className="text-[11px] px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {evMatch.suggestions.length === 0 && (
        <p className="text-muted-foreground mt-1">
          Tips: kör "Synka allt" i Admin → Biljetter om du tror namnet borde finnas.
        </p>
      )}
    </div>
  );
}
