import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, Trash2, Loader2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { invalidateNavigation } from "@/hooks/useNavigation";

type TopMenuItem = {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
};

type Team = {
  slug: string;
  name: string;
  league: string;
  city: string | null;
  stadium: string | null;
  tagline: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type Race = {
  slug: string;
  name: string;
  circuit: string | null;
  city: string | null;
  date_text: string | null;
  short_date: string | null;
  tagline: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/å|ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function AdminNavigation() {
  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-display mb-2">Navigation</h1>
        <p className="text-sm text-muted-foreground">
          Toppmenyn, fotbollsligor/lag och F1-race som visas i menyn och på landningssidorna.
        </p>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Viktigt:</strong> <em>Namnet</em> på lag och race måste exakt matcha det xs2event skickar i <code>events.home_team</code> respektive <code>events.race_name</code> — annars hittas inga biljetter på landningssidan. Slug (URL-segment) kan vara vad som helst.
        </span>
      </div>

      <Tabs defaultValue="menu" className="w-full">
        <TabsList>
          <TabsTrigger value="menu">Toppmeny</TabsTrigger>
          <TabsTrigger value="teams">Fotboll</TabsTrigger>
          <TabsTrigger value="races">F1</TabsTrigger>
        </TabsList>
        <TabsContent value="menu" className="mt-6">
          <TopMenuEditor />
        </TabsContent>
        <TabsContent value="teams" className="mt-6">
          <TeamsEditor />
        </TabsContent>
        <TabsContent value="races" className="mt-6">
          <RacesEditor />
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
    const { data } = await (supabase as any)
      .from("nav_top_menu_items")
      .select("*")
      .order("sort_order");
    setRows((data ?? []) as TopMenuItem[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const addNew = async () => {
    setBusy("new");
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { error } = await (supabase as any).from("nav_top_menu_items").insert({
      label: "Ny länk",
      href: "/",
      sort_order: maxOrder + 10,
      is_active: true,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await load();
  };

  const save = async (row: TopMenuItem) => {
    setBusy(row.id);
    const { error } = await (supabase as any)
      .from("nav_top_menu_items")
      .update({
        label: row.label,
        href: row.href,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })
      .eq("id", row.id);
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
            <Input
              value={row.label}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, label: e.target.value };
                setRows(next);
              }}
              onBlur={() => save(row)}
              className="h-9"
            />
          </div>
          <div className="col-span-5">
            <Label className="text-[10px] uppercase tracking-wider">URL</Label>
            <Input
              value={row.href}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, href: e.target.value };
                setRows(next);
              }}
              onBlur={() => save(row)}
              className="h-9"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-wider">Ordning</Label>
            <Input
              type="number"
              value={row.sort_order}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, sort_order: Number(e.target.value) };
                setRows(next);
              }}
              onBlur={() => save(row)}
              className="h-9"
            />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-3">
            <label className="text-xs flex items-center gap-2">
              Aktiv
              <Switch
                checked={row.is_active}
                onCheckedChange={(v) => {
                  const next = [...rows];
                  next[idx] = { ...row, is_active: v };
                  setRows(next);
                  save({ ...row, is_active: v });
                }}
              />
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

/* --------------------------- TEAMS ------------------------------------- */

function TeamsEditor() {
  const [rows, setRows] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("nav_teams")
      .select("*")
      .order("sort_order");
    setRows((data ?? []) as Team[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const addNew = async () => {
    const name = prompt("Lagnamn (måste matcha xs2 home_team exakt):");
    if (!name) return;
    const league = prompt("Liga (Bundesliga, La Liga, Premier League, Serie A, …):") ?? "";
    const slug = prompt("Slug (URL):", slugify(name)) ?? slugify(name);
    if (!slug || !league) return;
    setBusy("new");
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { error } = await (supabase as any).from("nav_teams").insert({
      slug,
      name,
      league,
      sort_order: maxOrder + 10,
      is_active: true,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    setExpanded((prev) => ({ ...prev, [slug]: true }));
    await load();
  };

  const save = async (row: Team) => {
    setBusy(row.slug);
    const { error } = await (supabase as any)
      .from("nav_teams")
      .update({
        name: row.name,
        league: row.league,
        city: row.city,
        stadium: row.stadium,
        tagline: row.tagline,
        description: row.description,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })
      .eq("slug", row.slug);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    toast.success("Sparat");
  };

  const del = async (slug: string) => {
    if (!confirm(`Ta bort laget "${slug}"?`)) return;
    setBusy(slug);
    const { error } = await (supabase as any).from("nav_teams").delete().eq("slug", slug);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await load();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laddar…</p>;

  const byLeague = new Map<string, Team[]>();
  for (const t of rows) {
    if (!byLeague.has(t.league)) byLeague.set(t.league, []);
    byLeague.get(t.league)!.push(t);
  }

  return (
    <div className="space-y-4">
      {Array.from(byLeague.entries()).map(([league, teams]) => (
        <div key={league} className="rounded-lg border border-border">
          <div className="px-4 py-3 bg-muted/30 font-medium">
            {league}
            <span className="ml-2 text-xs text-muted-foreground">({teams.length} lag)</span>
          </div>
          <div className="divide-y divide-border">
            {teams.map((row) => (
              <TeamRow
                key={row.slug}
                row={row}
                busy={busy === row.slug}
                expanded={!!expanded[row.slug]}
                onToggle={() => setExpanded((p) => ({ ...p, [row.slug]: !p[row.slug] }))}
                onChange={(next) => {
                  setRows((prev) => prev.map((r) => (r.slug === row.slug ? next : r)));
                }}
                onSave={save}
                onDelete={() => del(row.slug)}
              />
            ))}
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addNew} disabled={busy === "new"}>
        {busy === "new" && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
        <Plus className="h-3 w-3 mr-2" /> Lägg till lag
      </Button>
    </div>
  );
}

function TeamRow({
  row,
  busy,
  expanded,
  onToggle,
  onChange,
  onSave,
  onDelete,
}: {
  row: Team;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: Team) => void;
  onSave: (row: Team) => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-3">
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={onToggle}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <div className="flex-1 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5">
            <Input
              value={row.name}
              onChange={(e) => onChange({ ...row, name: e.target.value })}
              onBlur={() => onSave(row)}
              className="h-9"
            />
          </div>
          <div className="col-span-3 text-xs text-muted-foreground font-mono truncate">{row.slug}</div>
          <div className="col-span-2">
            <Input
              type="number"
              value={row.sort_order}
              onChange={(e) => onChange({ ...row, sort_order: Number(e.target.value) })}
              onBlur={() => onSave(row)}
              className="h-9"
            />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-2">
            <Switch
              checked={row.is_active}
              onCheckedChange={(v) => {
                onChange({ ...row, is_active: v });
                onSave({ ...row, is_active: v });
              }}
            />
            <Button size="icon" variant="ghost" disabled={busy} onClick={onDelete}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
            </Button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="grid grid-cols-2 gap-3 mt-3 pl-10">
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Liga</Label>
            <Input value={row.league} onChange={(e) => onChange({ ...row, league: e.target.value })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Stad</Label>
            <Input value={row.city ?? ""} onChange={(e) => onChange({ ...row, city: e.target.value })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Arena</Label>
            <Input value={row.stadium ?? ""} onChange={(e) => onChange({ ...row, stadium: e.target.value })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Tagline</Label>
            <Input value={row.tagline ?? ""} onChange={(e) => onChange({ ...row, tagline: e.target.value })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-wider">Beskrivning (visas på landningssidan)</Label>
            <textarea
              value={row.description ?? ""}
              onChange={(e) => onChange({ ...row, description: e.target.value })}
              onBlur={() => onSave(row)}
              rows={3}
              className="w-full text-sm rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- RACES ------------------------------------- */

function RacesEditor() {
  const [rows, setRows] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("nav_races").select("*").order("sort_order");
    setRows((data ?? []) as Race[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const addNew = async () => {
    const name = prompt("Race-namn (måste matcha xs2 race_name exakt):");
    if (!name) return;
    const slug = prompt("Slug (URL):", slugify(name)) ?? slugify(name);
    if (!slug) return;
    setBusy("new");
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { error } = await (supabase as any).from("nav_races").insert({
      slug,
      name,
      sort_order: maxOrder + 10,
      is_active: true,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    setExpanded((prev) => ({ ...prev, [slug]: true }));
    await load();
  };

  const save = async (row: Race) => {
    setBusy(row.slug);
    const { error } = await (supabase as any)
      .from("nav_races")
      .update({
        name: row.name,
        circuit: row.circuit,
        city: row.city,
        date_text: row.date_text,
        short_date: row.short_date,
        tagline: row.tagline,
        description: row.description,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })
      .eq("slug", row.slug);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    toast.success("Sparat");
  };

  const del = async (slug: string) => {
    if (!confirm(`Ta bort racet "${slug}"?`)) return;
    setBusy(slug);
    const { error } = await (supabase as any).from("nav_races").delete().eq("slug", slug);
    setBusy(null);
    if (error) return toast.error(error.message);
    invalidateNavigation();
    await load();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laddar…</p>;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <RaceRow
          key={row.slug}
          row={row}
          busy={busy === row.slug}
          expanded={!!expanded[row.slug]}
          onToggle={() => setExpanded((p) => ({ ...p, [row.slug]: !p[row.slug] }))}
          onChange={(next) => setRows((prev) => prev.map((r) => (r.slug === row.slug ? next : r)))}
          onSave={save}
          onDelete={() => del(row.slug)}
        />
      ))}
      <Button variant="outline" onClick={addNew} disabled={busy === "new"}>
        {busy === "new" && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
        <Plus className="h-3 w-3 mr-2" /> Lägg till race
      </Button>
    </div>
  );
}

function RaceRow({
  row,
  busy,
  expanded,
  onToggle,
  onChange,
  onSave,
  onDelete,
}: {
  row: Race;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: Race) => void;
  onSave: (row: Race) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={onToggle}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <div className="flex-1 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5">
            <Input
              value={row.name}
              onChange={(e) => onChange({ ...row, name: e.target.value })}
              onBlur={() => onSave(row)}
              className="h-9"
            />
          </div>
          <div className="col-span-3 text-xs text-muted-foreground font-mono truncate">{row.slug}</div>
          <div className="col-span-2">
            <Input
              type="number"
              value={row.sort_order}
              onChange={(e) => onChange({ ...row, sort_order: Number(e.target.value) })}
              onBlur={() => onSave(row)}
              className="h-9"
            />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-2">
            <Switch
              checked={row.is_active}
              onCheckedChange={(v) => {
                onChange({ ...row, is_active: v });
                onSave({ ...row, is_active: v });
              }}
            />
            <Button size="icon" variant="ghost" disabled={busy} onClick={onDelete}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
            </Button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="grid grid-cols-2 gap-3 mt-3 pl-10">
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Bana</Label>
            <Input value={row.circuit ?? ""} onChange={(e) => onChange({ ...row, circuit: e.target.value })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Ort</Label>
            <Input value={row.city ?? ""} onChange={(e) => onChange({ ...row, city: e.target.value })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Datum (text på landningssida)</Label>
            <Input value={row.date_text ?? ""} onChange={(e) => onChange({ ...row, date_text: e.target.value })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Kort datum (meny)</Label>
            <Input value={row.short_date ?? ""} onChange={(e) => onChange({ ...row, short_date: e.target.value })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-wider">Tagline</Label>
            <Input value={row.tagline ?? ""} onChange={(e) => onChange({ ...row, tagline: e.target.value })} onBlur={() => onSave(row)} className="h-9" />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-wider">Beskrivning</Label>
            <textarea
              value={row.description ?? ""}
              onChange={(e) => onChange({ ...row, description: e.target.value })}
              onBlur={() => onSave(row)}
              rows={3}
              className="w-full text-sm rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}
