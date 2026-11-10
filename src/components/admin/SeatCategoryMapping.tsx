import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Link2, EyeOff, Eye, Plus, Trash2, Sparkles, X, RefreshCw } from "lucide-react";
import { formatSek } from "@/lib/formatSek";

// Admin: link the suppliers' ticket categories to KAISEN's own categories
// per stadium, so the match page shows one row per seat (sold through the
// better offer) instead of the same seats twice under different names.
//
// Supplier categories appear here once a match page at that stadium has
// been viewed (event-tickets records them). Linking is per stadium and
// holds for every match there.

// New tables, not in the generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Supplier = "travelconnection" | "p1";
type Tier = "match" | "hospitality";

interface LinkRow {
  supplier: Supplier;
  supplier_category_id: string;
  venue_key: string;
  seat_category_id: string | null;
  hidden: boolean;
  supplier_name: string | null;
  supplier_description: string[] | null;
  supplier_color: string | null;
  tier_guess: Tier | null;
  sample_price_sek: number | null;
  last_seen_at: string;
}

interface Seat {
  id: string;
  venue_key: string;
  name: string;
  description: string[];
  tier: Tier;
  color: string | null;
  sort_order: number;
}

const SUPPLIER_LABEL: Record<Supplier, string> = { travelconnection: "TC", p1: "P1" };
const STOP = new Set(["the", "and", "with", "seat", "seats", "package", "ticket", "tickets", "of", "in", "at", "or", "similar", "a", "–", "-"]);

const blocks = (s: string) => new Set((s.match(/\b[a-z]{0,3}\d{1,4}[a-z]?\b/gi) ?? []).map((x) => x.toLowerCase()));
const words = (s: string) => new Set(s.toLowerCase().replace(/(long|short)\s+side/g, "$1side").replace(/half\s*way/g, "halfway").split(/[^a-z0-9åäöéü]+/i).filter((w) => w.length > 2 && !STOP.has(w)));
const text = (name: string | null, desc: string[] | null) => [name ?? "", ...(desc ?? []).slice(0, 2)].join(" ");

/** 0..1 — shared block numbers count most, then shared words. */
function similarity(a: string, b: string): number {
  const ba = blocks(a), bb = blocks(b);
  const sharedBlocks = [...ba].filter((x) => bb.has(x)).length;
  const wa = words(a), wb = words(b);
  const shared = [...wa].filter((x) => wb.has(x)).length;
  const jac = shared / Math.max(1, new Set([...wa, ...wb]).size);
  return Math.min(1, (sharedBlocks ? 0.5 : 0) + jac);
}

export default function SeatCategoryMapping() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState<{ done: number; total: number } | null>(null);

  const load = async () => {
    const [{ data: l, error: le }, { data: s, error: se }] = await Promise.all([
      db.from("supplier_category_links").select("*").order("last_seen_at", { ascending: false }),
      db.from("seat_categories").select("*").order("sort_order"),
    ]);
    if (le || se) toast.error((le ?? se).message);
    setLinks((l ?? []) as LinkRow[]);
    setSeats((s ?? []) as Seat[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  /**
   * Fill this list without waiting for page views: one upcoming match per
   * stadium where BOTH suppliers sell, one every 6 s (Travel Connection
   * allows 60 requests a minute, shared with the live site).
   */
  const scanVenues = async () => {
    const now = new Date().toISOString();
    const [{ data: tcl }, { data: p1l }] = await Promise.all([
      db.from("tc_product_links").select("event_id").in("match_method", ["auto", "manual"]).not("event_id", "is", null),
      db.from("p1_event_links").select("event_id").neq("match_method", "ignored").not("event_id", "is", null),
    ]);
    const tcSet = new Set(((tcl ?? []) as { event_id: string }[]).map((r) => r.event_id));
    const both = ((p1l ?? []) as { event_id: string }[]).map((r) => r.event_id).filter((id) => tcSet.has(id));
    if (!both.length) return toast.info("Inga matcher med båda leverantörerna hittades.");
    const evs: { id: string; venue_name: string | null; race_name: string | null; home_team: string | null }[] = [];
    for (let i = 0; i < both.length; i += 150) {
      const { data } = await db.from("events").select("id, venue_name, race_name, home_team, starts_at")
        .in("id", both.slice(i, i + 150)).gte("starts_at", now).order("starts_at");
      evs.push(...(data ?? []));
    }
    const perVenue = new Map<string, string>();
    for (const e of evs) {
      const k = (e.venue_name || e.race_name || e.home_team || "").trim();
      if (k && !perVenue.has(k)) perVenue.set(k, e.id);
    }
    const ids = [...perVenue.values()];
    setScan({ done: 0, total: ids.length });
    for (let i = 0; i < ids.length; i++) {
      await supabase.functions.invoke("event-tickets", { body: { event_id: ids[i] } }).catch(() => null);
      setScan({ done: i + 1, total: ids.length });
      // A new stadium can cost several TC calls (one per unseen category).
      await new Promise((r) => setTimeout(r, 6000));
    }
    setScan(null);
    toast.success(`${ids.length} arenor inlästa`);
    await load();
  };

  const venues = useMemo(() => {
    const m = new Map<string, { key: string; open: number; total: number; suppliers: Set<Supplier> }>();
    for (const l of links) {
      const v = m.get(l.venue_key) ?? { key: l.venue_key, open: 0, total: 0, suppliers: new Set<Supplier>() };
      v.total++;
      v.suppliers.add(l.supplier);
      if (!l.seat_category_id && !l.hidden) v.open++;
      m.set(l.venue_key, v);
    }
    // Stadiums with both suppliers first (that's where duplicates are), then most open.
    return [...m.values()]
      .filter((v) => !q || v.key.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.suppliers.size - a.suppliers.size || b.open - a.open || a.key.localeCompare(b.key));
  }, [links, q]);

  useEffect(() => {
    if (!venue && venues.length) setVenue(venues[0].key);
  }, [venue, venues]);

  const vLinks = links.filter((l) => l.venue_key === venue);
  const vSeats = seats.filter((s) => s.venue_key === venue);
  const open = vLinks.filter((l) => !l.seat_category_id && !l.hidden);
  const hidden = vLinks.filter((l) => l.hidden);

  const run = async (fn: () => Promise<{ error: { message: string } | null } | void>, ok?: string) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res && res.error) return toast.error(res.error.message);
    if (ok) toast.success(ok);
    await load();
  };

  const updateLink = (l: LinkRow, patch: Partial<LinkRow>) =>
    db.from("supplier_category_links").update(patch)
      .eq("supplier", l.supplier).eq("supplier_category_id", l.supplier_category_id).eq("venue_key", l.venue_key);

  /** New seat category from a supplier category (TC preferred for text + colour), linking all given. */
  const createFrom = (base: LinkRow, also: LinkRow[] = []) =>
    run(async () => {
      const { data, error } = await db.from("seat_categories").insert({
        venue_key: base.venue_key,
        name: base.supplier_name ?? "Kategori",
        description: base.supplier_description ?? [],
        tier: base.tier_guess ?? "match",
        color: base.supplier_color,
        sort_order: vSeats.length,
      }).select("id").single();
      if (error) return { error };
      for (const l of [base, ...also]) {
        const { error: e } = await updateLink(l, { seat_category_id: data.id });
        if (e) return { error: e };
      }
      return { error: null };
    }, also.length ? "Ihopslagna till en kategori" : "Kategori skapad");

  /** Best suggestion for an open supplier category: an existing seat, or an open category from the other supplier. */
  const suggest = (l: LinkRow): { kind: "seat"; seat: Seat; score: number } | { kind: "pair"; other: LinkRow; score: number } | null => {
    const t = text(l.supplier_name, l.supplier_description);
    let bestS: { kind: "seat"; seat: Seat; score: number } | null = null;
    for (const s of vSeats) {
      const linkedText = vLinks.filter((x) => x.seat_category_id === s.id).map((x) => text(x.supplier_name, x.supplier_description)).join(" ");
      const score = Math.max(similarity(t, text(s.name, s.description)), similarity(t, linkedText));
      if (!bestS || score > bestS.score) bestS = { kind: "seat", seat: s, score };
    }
    let bestP: { kind: "pair"; other: LinkRow; score: number } | null = null;
    for (const o of open) {
      if (o.supplier === l.supplier) continue;
      const score = similarity(t, text(o.supplier_name, o.supplier_description));
      if (!bestP || score > bestP.score) bestP = { kind: "pair", other: o, score };
    }
    const top = [bestS, bestP].filter(Boolean).sort((a, b) => b!.score - a!.score)[0] ?? null;
    return top && top.score >= 0.25 ? top : null;
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!links.length) {
    return (
      <div className="py-8 space-y-3">
        <p className="text-sm text-muted-foreground">
          Inga leverantörskategorier än. De dyker upp när en matchsida med biljetter har visats - eller läs in dem direkt.
        </p>
        <Button size="sm" variant="outline" disabled={!!scan} onClick={scanVenues}>
          {scan ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
          {scan ? `Läser in ${scan.done}/${scan.total}…` : "Läs in arenor med båda leverantörerna"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-2">
        <Button size="sm" variant="outline" className="w-full" disabled={!!scan} onClick={scanVenues}>
          {scan ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
          {scan ? `Läser in ${scan.done}/${scan.total}…` : "Läs in arenor med båda"}
        </Button>
        <Input placeholder="Sök arena…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-border divide-y divide-border">
          {venues.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setVenue(v.key)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${venue === v.key ? "bg-muted font-medium" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{v.key}</span>
                {v.open > 0 && <Badge variant="secondary">{v.open}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {[...v.suppliers].map((s) => SUPPLIER_LABEL[s]).join(" + ")}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {venue && (
        <section className="space-y-8 min-w-0">
          <div>
            <h3 className="font-medium mb-1">Att koppla ({open.length})</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Okopplade kategorier visas på sajten som egna rader. Koppla samma platser från båda leverantörerna till en kategori så visas de som en rad - och säljs via det bästa erbjudandet.
            </p>
            {!open.length ? (
              <p className="text-sm text-muted-foreground">Allt är kopplat här.</p>
            ) : (
              <div className="rounded-lg border border-border divide-y divide-border">
                {open.map((l) => {
                  const s = suggest(l);
                  return (
                    <div key={`${l.supplier}:${l.supplier_category_id}`} className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant={l.supplier === "p1" ? "outline" : "default"}>{SUPPLIER_LABEL[l.supplier]}</Badge>
                        {l.supplier_color && <span className="mt-1 h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: l.supplier_color }} />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{l.supplier_name}</p>
                          {l.supplier_description?.[0] && <p className="text-xs text-muted-foreground line-clamp-2">{l.supplier_description[0]}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {l.sample_price_sek != null ? formatSek(l.sample_price_sek) : ""} · {l.tier_guess === "hospitality" ? "Hospitality" : "Match"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {s?.kind === "pair" && (
                          <Button size="sm" disabled={busy} onClick={() => {
                            const [base, other] = l.supplier === "travelconnection" ? [l, s.other] : [s.other, l];
                            createFrom(base, [other]);
                          }}>
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            Slå ihop med {SUPPLIER_LABEL[s.other.supplier]}: {s.other.supplier_name}
                          </Button>
                        )}
                        {s?.kind === "seat" && (
                          <Button size="sm" disabled={busy} onClick={() => run(() => updateLink(l, { seat_category_id: s.seat.id }), "Kopplad")}>
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            Koppla till {s.seat.name}
                          </Button>
                        )}
                        {vSeats.length > 0 && (
                          <select
                            className="h-8 rounded-md border border-border bg-background px-2 text-sm"
                            value=""
                            disabled={busy}
                            onChange={(e) => e.target.value && run(() => updateLink(l, { seat_category_id: e.target.value }), "Kopplad")}
                          >
                            <option value="">Koppla till…</option>
                            {vSeats.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </select>
                        )}
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => createFrom(l)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Ny kategori
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => updateLink(l, { hidden: true }), "Dold på sajten")}>
                          <EyeOff className="h-3.5 w-3.5 mr-1" /> Dölj
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-3">KAISEN-kategorier ({vSeats.length})</h3>
            <div className="space-y-3">
              {vSeats.map((s) => (
                <SeatCard
                  key={s.id}
                  seat={s}
                  linked={vLinks.filter((l) => l.seat_category_id === s.id)}
                  busy={busy}
                  onSave={(patch) => run(() => db.from("seat_categories").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", s.id), "Sparad")}
                  onDelete={() => run(() => db.from("seat_categories").delete().eq("id", s.id), "Borttagen - leverantörskategorierna visas som egna rader igen")}
                  onUnlink={(l) => run(() => updateLink(l, { seat_category_id: null }), "Koppling borttagen")}
                />
              ))}
              {!vSeats.length && <p className="text-sm text-muted-foreground">Inga än - skapa från en leverantörskategori ovan.</p>}
            </div>
          </div>

          {hidden.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Dolda ({hidden.length})</h3>
              <div className="rounded-lg border border-border divide-y divide-border">
                {hidden.map((l) => (
                  <div key={`${l.supplier}:${l.supplier_category_id}`} className="p-3 flex items-center gap-2 text-sm">
                    <Badge variant="outline">{SUPPLIER_LABEL[l.supplier]}</Badge>
                    <span className="flex-1">{l.supplier_name}</span>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => updateLink(l, { hidden: false }), "Visas igen")}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Visa igen
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SeatCard({
  seat, linked, busy, onSave, onDelete, onUnlink,
}: {
  seat: Seat;
  linked: LinkRow[];
  busy: boolean;
  onSave: (p: Partial<Seat>) => void;
  onDelete: () => void;
  onUnlink: (l: LinkRow) => void;
}) {
  const [name, setName] = useState(seat.name);
  const [desc, setDesc] = useState(seat.description.join("\n"));
  const [tier, setTier] = useState<Tier>(seat.tier);
  const dirty = name !== seat.name || desc !== seat.description.join("\n") || tier !== seat.tier;

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center gap-2">
        {seat.color && <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: seat.color }} />}
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
        <select className="h-8 rounded-md border border-border bg-background px-2 text-sm" value={tier} onChange={(e) => setTier(e.target.value as Tier)}>
          <option value="match">Match</option>
          <option value="hospitality">Hospitality</option>
        </select>
        <Button size="icon" variant="ghost" disabled={busy} onClick={onDelete} aria-label="Ta bort kategori">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Beskrivning, en rad per punkt" className="text-sm" />
      {dirty && (
        <Button size="sm" disabled={busy} onClick={() => onSave({ name: name.trim(), description: desc.split("\n").map((x) => x.trim()).filter(Boolean), tier })}>
          Spara
        </Button>
      )}
      <div className="flex flex-wrap gap-1.5">
        {linked.map((l) => (
          <span key={`${l.supplier}:${l.supplier_category_id}`} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs">
            <Link2 className="h-3 w-3" />
            {SUPPLIER_LABEL[l.supplier]}: {l.supplier_name}
            {l.sample_price_sek != null && <span className="text-muted-foreground">· {formatSek(l.sample_price_sek)}</span>}
            <button type="button" onClick={() => onUnlink(l)} disabled={busy} aria-label="Ta bort koppling" className="ml-0.5 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
