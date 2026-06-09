import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, AlertTriangle, ChevronDown, ChevronRight, X } from "lucide-react";
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
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/å|ä/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminNavigation() {
  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-display mb-2">Navigation</h1>
        <p className="text-sm text-muted-foreground">
          Toppmenyn, sporter (med dropdowns + landningssidor) och vad de länkar till. Ändringar går live direkt — besökare ser dem nästa gång de fokuserar fliken.
        </p>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Viktigt:</strong> <em>Namnet</em> på lag/race måste exakt matcha det xs2event skickar i <code>events.home_team</code> respektive <code>events.race_name</code> — annars hittas inga biljetter på landningssidan. Slug (URL-segment) kan vara vad som helst.
        </span>
      </div>

      <Tabs defaultValue="menu">
        <TabsList>
          <TabsTrigger value="menu">Toppmeny</TabsTrigger>
          <TabsTrigger value="sports">Sporter & menyer</TabsTrigger>
        </TabsList>
        <TabsContent value="menu" className="mt-6">
          <TopMenuEditor />
        </TabsContent>
        <TabsContent value="sports" className="mt-6">
          <SportsEditor />
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

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("nav_top_menu_items").select("*").order("sort_order");
    setRows((data ?? []) as TopMenuItem[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addNew = async () => {
    setBusy("new");
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { error } = await (supabase as any).from("nav_top_menu_items").insert({
      label: "Ny länk", href: "/", sort_order: maxOrder + 10, is_active: true,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await load();
  };
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
    if (!confirm("Ta bort menyalternativet?")) return;
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
      {rows.map((row, idx) => (
        <div key={row.id} className="rounded-lg border border-border bg-card p-4 grid grid-cols-12 gap-3 items-end">
          <div className="col-span-3">
            <Label className="text-[10px] uppercase tracking-wider">Etikett</Label>
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
            <label className="text-xs flex items-center gap-2">Aktiv
              <Switch checked={row.is_active} onCheckedChange={(v) => { const next = { ...row, is_active: v }; setRows(rows.map((r, i) => i === idx ? next : r)); save(next); }} />
            </label>
            <Button size="icon" variant="ghost" disabled={busy === row.id} onClick={() => del(row.id)}>
              {busy === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addNew} disabled={busy === "new"}>
        {busy === "new" && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
        <Plus className="h-3 w-3 mr-2" /> Lägg till länk
      </Button>
    </div>
  );
}

/* --------------------------- SPORTS ------------------------------------ */

function SportsEditor() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedSport, setExpandedSport] = useState<string | null>(null);

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

  const addSport = async () => {
    const label = prompt("Sportens namn (visas i menyn, t.ex. Tennis):");
    if (!label) return;
    const sport_filter = prompt(`xs2-sport-filter (t.ex. soccer, formula1, tennis — måste matcha events.sport exakt):`, "");
    const slug = prompt("Slug (URL):", slugify(label)) ?? slugify(label);
    const menu_style = (prompt("Meny-stil (grouped/list):", "list") ?? "list") as "grouped" | "list";
    const entry_kind = (prompt("Inläggstyp (team/race):", "team") ?? "team") as "team" | "race";
    if (!slug || !label) return;
    setBusy("new-sport");
    const maxOrder = sports.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { error } = await (supabase as any).from("nav_sports").insert({
      slug, label, sport_filter: sport_filter || null, menu_style, entry_kind, sort_order: maxOrder + 10, is_active: true,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await load();
  };

  const saveSport = async (s: Sport) => {
    setBusy(s.id);
    const { error } = await (supabase as any).from("nav_sports").update({
      label: s.label, sport_filter: s.sport_filter, menu_style: s.menu_style, entry_kind: s.entry_kind,
      sort_order: s.sort_order, is_active: s.is_active,
    }).eq("id", s.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    toast.success("Sparat");
  };

  const delSport = async (id: string) => {
    if (!confirm("Ta bort sporten OCH alla dess menyalternativ? Detta kan inte ångras.")) return;
    setBusy(id);
    const { error } = await (supabase as any).from("nav_sports").delete().eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await load();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laddar…</p>;

  return (
    <div className="space-y-4">
      {sports.map((sport) => {
        const sportEntries = entries.filter((e) => e.sport_id === sport.id);
        const isOpen = expandedSport === sport.id;
        return (
          <div key={sport.id} className="rounded-lg border border-border bg-card">
            <div className="p-3 grid grid-cols-12 gap-2 items-center">
              <Button size="icon" variant="ghost" onClick={() => setExpandedSport(isOpen ? null : sport.id)} className="col-span-1">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <div className="col-span-3">
                <Label className="text-[10px] uppercase tracking-wider">Etikett (menyn)</Label>
                <Input value={sport.label} onChange={(e) => setSports(sports.map((s) => s.id === sport.id ? { ...s, label: e.target.value } : s))} onBlur={() => saveSport(sport)} className="h-9" />
              </div>
              <div className="col-span-2 text-xs text-muted-foreground font-mono pt-5">/{sport.slug}</div>
              <div className="col-span-2">
                <Label className="text-[10px] uppercase tracking-wider">xs2 sport-filter</Label>
                <Input value={sport.sport_filter ?? ""} placeholder="soccer / formula1 / …" onChange={(e) => setSports(sports.map((s) => s.id === sport.id ? { ...s, sport_filter: e.target.value || null } : s))} onBlur={() => saveSport(sport)} className="h-9" />
              </div>
              <div className="col-span-1">
                <Label className="text-[10px] uppercase tracking-wider">Stil</Label>
                <select value={sport.menu_style} onChange={(e) => { const next = { ...sport, menu_style: e.target.value as "grouped" | "list" }; setSports(sports.map((s) => s.id === sport.id ? next : s)); saveSport(next); }} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                  <option value="grouped">grouped</option>
                  <option value="list">list</option>
                </select>
              </div>
              <div className="col-span-1">
                <Label className="text-[10px] uppercase tracking-wider">Typ</Label>
                <select value={sport.entry_kind} onChange={(e) => { const next = { ...sport, entry_kind: e.target.value as "team" | "race" }; setSports(sports.map((s) => s.id === sport.id ? next : s)); saveSport(next); }} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                  <option value="team">team</option>
                  <option value="race">race</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <Switch checked={sport.is_active} onCheckedChange={(v) => { const next = { ...sport, is_active: v }; setSports(sports.map((s) => s.id === sport.id ? next : s)); saveSport(next); }} />
                <Button size="icon" variant="ghost" disabled={busy === sport.id} onClick={() => delSport(sport.id)}>
                  {busy === sport.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                </Button>
              </div>
            </div>
            {isOpen && (
              <EntriesEditor
                sport={sport}
                entries={sportEntries}
                onRefresh={load}
              />
            )}
          </div>
        );
      })}
      <Button variant="outline" onClick={addSport} disabled={busy === "new-sport"}>
        {busy === "new-sport" && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
        <Plus className="h-3 w-3 mr-2" /> Lägg till sport (t.ex. Tennis, MMA)
      </Button>
    </div>
  );
}

/* --------------------------- ENTRIES ----------------------------------- */

function EntriesEditor({ sport, entries, onRefresh }: { sport: Sport; entries: Entry[]; onRefresh: () => Promise<void> }) {
  const [rows, setRows] = useState<Entry[]>(entries);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => { setRows(entries); }, [entries]);

  const addNew = async () => {
    const name = prompt(`${sport.entry_kind === "team" ? "Lagnamn" : "Race-namn"} (måste matcha xs2 ${sport.entry_kind === "team" ? "home_team" : "race_name"} exakt):`);
    if (!name) return;
    const slug = prompt("Slug (URL):", slugify(name)) ?? slugify(name);
    if (!slug) return;
    setBusy("new");
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { error } = await (supabase as any).from("nav_menu_entries").insert({
      sport_id: sport.id, slug, name, sort_order: maxOrder + 10, is_active: true,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    setExpanded((p) => ({ ...p, [slug]: true }));
    await onRefresh();
  };

  const save = async (row: Entry) => {
    setBusy(row.id);
    const { error } = await (supabase as any).from("nav_menu_entries").update({
      name: row.name, group_label: row.group_label, city: row.city, venue: row.venue,
      date_text: row.date_text, short_date: row.short_date, tagline: row.tagline, description: row.description,
      hero_image_url: row.hero_image_url, features_json: row.features_json ?? [],
      sort_order: row.sort_order, is_active: row.is_active,
    }).eq("id", row.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    toast.success("Sparat");
  };

  const del = async (id: string) => {
    if (!confirm("Ta bort denna entry?")) return;
    setBusy(id);
    const { error } = await (supabase as any).from("nav_menu_entries").delete().eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await onRefresh();
  };

  return (
    <div className="border-t border-border p-4 space-y-2 bg-muted/20">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        {sport.menu_style === "grouped" ? "Grupperade under rubriker (group_label)" : "Listade direkt"} · {rows.length} st
      </p>
      {rows.map((row, idx) => (
        <div key={row.id} className="rounded-md border border-border bg-card p-2">
          <div className="grid grid-cols-12 gap-2 items-center">
            <Button size="icon" variant="ghost" onClick={() => setExpanded((p) => ({ ...p, [row.id]: !p[row.id] }))} className="col-span-1">
              {expanded[row.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div className="col-span-4">
              <Input value={row.name} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, name: e.target.value } : r))} onBlur={() => save(row)} className="h-8 text-sm" />
            </div>
            {sport.menu_style === "grouped" && (
              <div className="col-span-3">
                <Input placeholder="grupp" value={row.group_label ?? ""} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, group_label: e.target.value || null } : r))} onBlur={() => save(row)} className="h-8 text-sm" />
              </div>
            )}
            <div className={sport.menu_style === "grouped" ? "col-span-2" : "col-span-5"}>
              <span className="text-[11px] text-muted-foreground font-mono">{row.slug}</span>
            </div>
            <div className="col-span-1">
              <Input type="number" value={row.sort_order} onChange={(e) => setRows(rows.map((r, i) => i === idx ? { ...r, sort_order: Number(e.target.value) } : r))} onBlur={() => save(row)} className="h-8 text-sm" />
            </div>
            <div className="col-span-1 flex items-center justify-end gap-1">
              <Switch checked={row.is_active} onCheckedChange={(v) => { const next = { ...row, is_active: v }; setRows(rows.map((r, i) => i === idx ? next : r)); save(next); }} />
              <Button size="icon" variant="ghost" disabled={busy === row.id} onClick={() => del(row.id)}>
                {busy === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 text-destructive" />}
              </Button>
            </div>
          </div>
          {expanded[row.id] && (
            <EntryDetail
              row={row}
              kind={sport.entry_kind}
              onChange={(next) => setRows(rows.map((r) => r.id === row.id ? next : r))}
              onSave={save}
            />
          )}
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addNew} disabled={busy === "new"}>
        {busy === "new" && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
        <Plus className="h-3 w-3 mr-2" /> Lägg till {sport.entry_kind === "team" ? "lag" : "race"}
      </Button>
    </div>
  );
}

function EntryDetail({ row, kind, onChange, onSave }: { row: Entry; kind: "team" | "race"; onChange: (next: Entry) => void; onSave: (row: Entry) => void }) {
  const features = row.features_json ?? [];
  return (
    <div className="grid grid-cols-2 gap-3 mt-3 pl-10 pb-2">
      <div>
        <Label className="text-[10px] uppercase tracking-wider">Stad</Label>
        <Input value={row.city ?? ""} onChange={(e) => onChange({ ...row, city: e.target.value || null })} onBlur={() => onSave(row)} className="h-9" />
      </div>
      <div>
        <Label className="text-[10px] uppercase tracking-wider">{kind === "team" ? "Arena" : "Bana"}</Label>
        <Input value={row.venue ?? ""} onChange={(e) => onChange({ ...row, venue: e.target.value || null })} onBlur={() => onSave(row)} className="h-9" />
      </div>
      {kind === "race" && (
        <>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Datum (lång)</Label>
            <Input value={row.date_text ?? ""} onChange={(e) => onChange({ ...row, date_text: e.target.value || null })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Datum (kort, menyn)</Label>
            <Input value={row.short_date ?? ""} onChange={(e) => onChange({ ...row, short_date: e.target.value || null })} onBlur={() => onSave(row)} className="h-9" />
          </div>
        </>
      )}
      <div className="col-span-2">
        <Label className="text-[10px] uppercase tracking-wider">Tagline</Label>
        <Input value={row.tagline ?? ""} onChange={(e) => onChange({ ...row, tagline: e.target.value || null })} onBlur={() => onSave(row)} className="h-9" />
      </div>
      <div className="col-span-2">
        <Label className="text-[10px] uppercase tracking-wider">Beskrivning</Label>
        <textarea value={row.description ?? ""} onChange={(e) => onChange({ ...row, description: e.target.value || null })} onBlur={() => onSave(row)} rows={3} className="w-full text-sm rounded-md border border-input bg-background px-3 py-2" />
      </div>
      <div className="col-span-2">
        <Label className="text-[10px] uppercase tracking-wider">Hero-bild (landningssida)</Label>
        <ImageUploader
          value={row.hero_image_url}
          prefix={`nav-hero/${row.id}`}
          onUploaded={(url) => { const next = { ...row, hero_image_url: url }; onChange(next); onSave(next); }}
          onCleared={() => { const next = { ...row, hero_image_url: null }; onChange(next); onSave(next); }}
        />
      </div>
      <div className="col-span-2">
        <Label className="text-[10px] uppercase tracking-wider mb-1 block">"Vad ingår" — lista (en per rad)</Label>
        <div className="space-y-1.5">
          {features.map((f, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={f}
                onChange={(e) => {
                  const next = [...features];
                  next[i] = e.target.value;
                  onChange({ ...row, features_json: next });
                }}
                onBlur={() => onSave(row)}
                className="h-8 text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  const next = features.filter((_, j) => j !== i);
                  const r = { ...row, features_json: next };
                  onChange(r);
                  onSave(r);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const next = { ...row, features_json: [...features, ""] };
              onChange(next);
            }}
          >
            <Plus className="h-3 w-3 mr-1.5" /> Lägg till rad
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Lämna helt tomt för att visa standard-listan för {kind}.</p>
      </div>
    </div>
  );
}
