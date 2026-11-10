import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { formatSek } from "@/lib/formatSek";
import { autoPairs, type Offer } from "../../../supabase/functions/_shared/ticket_merge";

// Admin: which Travel Connection category is the same seat as each P1
// category, per stadium. One question per P1 row:
//   "Samma plats som <TC-kategori>"  -> one row on the site, best offer wins
//   "Egen rad"                       -> P1 shown as its own row
//   "Visa inte"                      -> P1 category hidden
// Unanswered rows are pre-filled with the same suggestion the site already
// applies automatically (ticket_merge.ts autoPairs), so a stadium is usually
// one "Godkänn förslagen" click.
//
// Storage (unchanged): an answer is a seat_categories row shared by the
// linked supplier categories; "Egen rad" is a seat holding only the P1 one,
// which also stops automatic pairing for it.

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
}

/** Answer for a P1 row: "tc:<id>" | "own" | "hide" | "" (not answered). */
type Choice = string;

const key = (l: Pick<LinkRow, "supplier" | "supplier_category_id">) => `${l.supplier}:${l.supplier_category_id}`;

const asOffer = (l: LinkRow): Offer => ({
  supplier: l.supplier,
  supplier_category_id: l.supplier_category_id,
  category_id: null,
  name: l.supplier_name ?? "",
  description: l.supplier_description ?? [],
  color: l.supplier_color,
  image_url: null,
  tier: l.tier_guess ?? "match",
  available: true,
  max_qty: 1,
  final_sek: l.sample_price_sek,
  request_only: l.supplier === "p1",
});

function currentChoice(p: LinkRow, links: LinkRow[]): Choice {
  if (p.hidden) return "hide";
  if (!p.seat_category_id) return "";
  const tc = links.find((l) => l.supplier === "travelconnection" && l.seat_category_id === p.seat_category_id);
  return tc ? `tc:${tc.supplier_category_id}` : "own";
}

export default function SeatCategoryMapping() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [seatIds, setSeatIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState<{ done: number; total: number } | null>(null);

  const load = async () => {
    const [{ data: l, error: le }, { data: s, error: se }] = await Promise.all([
      db.from("supplier_category_links").select("*"),
      db.from("seat_categories").select("id"),
    ]);
    if (le || se) toast.error((le ?? se).message);
    setLinks((l ?? []) as LinkRow[]);
    setSeatIds(new Set(((s ?? []) as { id: string }[]).map((x) => x.id)));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  // Per stadium: its P1 rows, current answers and suggestions.
  const venues = useMemo(() => {
    const by = new Map<string, LinkRow[]>();
    for (const l of links) by.set(l.venue_key, [...(by.get(l.venue_key) ?? []), l]);
    const price = (l: LinkRow) => l.sample_price_sek ?? 0;
    return [...by.entries()]
      .map(([name, ls]) => {
        const tc = ls.filter((l) => l.supplier === "travelconnection").sort((a, b) => price(a) - price(b));
        const p1 = ls.filter((l) => l.supplier === "p1").sort((a, b) => price(a) - price(b));
        const open = p1.filter((p) => currentChoice(p, ls) === "");
        // Suggestions from ALL categories, so they stay put whatever is
        // answered (a wrong pick never makes the right suggestion vanish).
        const suggestion = new Map<string, string>();
        for (const [a, b] of autoPairs(tc.map(asOffer), p1.map(asOffer))) {
          suggestion.set(`p1:${b.supplier_category_id}`, `tc:${a.supplier_category_id}`);
        }
        const pending = open.filter((p) => suggestion.has(key(p))).length;
        return { name, tc, p1, links: ls, open: tc.length ? open.length : 0, suggestion, pending };
      })
      .filter((x) => x.p1.length > 0)
      .filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()))
      // Work first: stadiums with both suppliers and open rows.
      .sort((a, b) => Number(b.tc.length > 0) - Number(a.tc.length > 0) || b.open - a.open || a.name.localeCompare(b.name));
  }, [links, q]);

  useEffect(() => {
    if (venues.length && !venues.some((x) => x.name === venue)) setVenue(venues[0].name);
  }, [venue, venues]);
  const v = venues.find((x) => x.name === venue) ?? null;

  const updateLink = (l: LinkRow, patch: Partial<LinkRow>) =>
    db.from("supplier_category_links").update(patch)
      .eq("supplier", l.supplier).eq("supplier_category_id", l.supplier_category_id).eq("venue_key", l.venue_key);

  /** The seat a supplier category sits in, creating one from it when it has none. */
  const seatFor = async (l: LinkRow): Promise<string> => {
    if (l.seat_category_id && seatIds.has(l.seat_category_id)) return l.seat_category_id;
    const { data, error } = await db.from("seat_categories").insert({
      venue_key: l.venue_key,
      name: l.supplier_name ?? "Kategori",
      description: l.supplier_description ?? [],
      tier: l.tier_guess ?? "match",
      color: l.supplier_color,
    }).select("id").single();
    if (error) throw error;
    const { error: e2 } = await updateLink(l, { seat_category_id: data.id, hidden: false });
    if (e2) throw e2;
    return data.id;
  };

  /** Save one answer for a P1 row. */
  const apply = async (p: LinkRow, choice: Choice, all: LinkRow[]) => {
    const before = p.seat_category_id;
    let after: string | null = null;
    if (choice === "clear") {
      const { error } = await updateLink(p, { hidden: false, seat_category_id: null });
      if (error) throw error;
    } else if (choice === "hide") {
      const { error } = await updateLink(p, { hidden: true, seat_category_id: null });
      if (error) throw error;
    } else if (choice === "own") {
      after = currentChoice(p, all) === "own" ? before : await seatFor({ ...p, seat_category_id: null });
    } else if (choice.startsWith("tc:")) {
      const tc = all.find((l) => key(l) === `travelconnection:${choice.slice(3)}`);
      if (!tc) throw new Error("Travel Connection-kategorin finns inte längre - läs in arenan igen.");
      after = await seatFor(tc);
      const { error } = await updateLink(p, { seat_category_id: after, hidden: false });
      if (error) throw error;
    }
    // A seat this P1 row held on its own is empty now.
    if (before && before !== after && !all.some((l) => key(l) !== key(p) && l.seat_category_id === before)) {
      await db.from("seat_categories").delete().eq("id", before);
    }
  };

  const run = async (fn: () => Promise<void>, ok: string, undo?: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok, undo ? { action: { label: "Ångra", onClick: () => run(undo, "Ångrat") }, duration: 8000 } : undefined);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
    await load();
  };

  /** Save one row's answer, with an undo back to what it was. */
  const choose = (p: LinkRow, choice: Choice, all: LinkRow[]) => {
    const prev = currentChoice(p, all) || "clear";
    if (choice === prev) return;
    const name = choice === "hide" ? "Dold" : choice === "clear" ? "Återställd" : "Sparat";
    run(
      () => apply(p, choice, all),
      `${name}: ${p.supplier_name}`,
      // Re-read the row before undoing: its seat may have changed.
      async () => {
        const { data } = await db.from("supplier_category_links").select("*")
          .eq("supplier", p.supplier).eq("supplier_category_id", p.supplier_category_id).eq("venue_key", p.venue_key).single();
        const { data: fresh } = await db.from("supplier_category_links").select("*").eq("venue_key", p.venue_key);
        await apply(data as LinkRow, prev, (fresh ?? []) as LinkRow[]);
      },
    );
  };

  /** Fill the list without waiting for page views: one match per stadium where both suppliers sell. */
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
      // A new stadium can cost several TC calls; their 60/min is shared with the site.
      await new Promise((r) => setTimeout(r, 6000));
    }
    setScan(null);
    toast.success(`${ids.length} arenor inlästa`);
    await load();
  };

  const scanButton = (
    <Button size="sm" variant="outline" disabled={!!scan} onClick={scanVenues}>
      {scan ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
      {scan ? `Läser in ${scan.done}/${scan.total}…` : "Läs in arenor"}
    </Button>
  );

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!links.some((l) => l.supplier === "p1")) {
    return (
      <div className="py-10 space-y-3 text-sm text-muted-foreground">
        <p>Inga P1-kategorier inlästa än. De kommer när en matchsida visas - eller läs in alla arenor med båda leverantörerna nu.</p>
        {scanButton}
      </div>
    );
  }

  const openTotal = venues.reduce((n, x) => n + x.open, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Välj vilken Travel Connection-kategori varje P1-kategori motsvarar. Samma plats visas då som{" "}
          <span className="text-foreground">en rad</span> på sajten och säljs via det bästa erbjudandet. Rader märkta{" "}
          <span className="text-primary">auto</span> slås redan ihop enligt förslaget tills du väljer något annat.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{openTotal ? `${openTotal} att granska` : "Allt granskat"}</span>
          {scanButton}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          <Input placeholder="Sök arena…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9" />
          <nav className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-card">
            {venues.map((x) => (
              <button
                key={x.name}
                type="button"
                onClick={() => setVenue(x.name)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm border-b border-border last:border-0 hover:bg-muted/60 ${venue === x.name ? "bg-muted font-medium" : ""}`}
              >
                <span className="truncate">{x.name}</span>
                {!x.tc.length ? (
                  <span className="text-[11px] text-muted-foreground shrink-0">bara P1</span>
                ) : x.open ? (
                  <span className="text-[11px] rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 shrink-0">{x.open}</span>
                ) : (
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-label="Klar" />
                )}
              </button>
            ))}
            {!venues.length && <p className="px-3 py-4 text-sm text-muted-foreground">Ingen arena matchar.</p>}
          </nav>
        </aside>

        {v && (
          <section className="min-w-0 rounded-lg border border-border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border">
              <div>
                <h3 className="font-medium">{v.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {v.p1.length} från P1 · {v.tc.length} från Travel Connection
                </p>
              </div>
              {v.pending > 0 && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      for (const p of v.p1) {
                        const s = v.suggestion.get(key(p));
                        if (s && currentChoice(p, v.links) === "") await apply(p, s, v.links);
                      }
                    }, "Förslagen sparade")
                  }
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Godkänn förslagen ({v.pending})
                </Button>
              )}
            </header>

            {!v.tc.length && (
              <p className="px-4 py-3 text-xs text-muted-foreground border-b border-border">
                Travel Connection säljer inget här, så P1 visas som det är. Välj "Visa inte" för kategorier ni inte vill ha på sajten.
              </p>
            )}

            <ul className="divide-y divide-border">
              {v.p1.map((p) => {
                const cur = currentChoice(p, v.links);
                const sug = v.suggestion.get(key(p));
                const sugTc = sug ? v.tc.find((t) => `tc:${t.supplier_category_id}` === sug) : undefined;
                const showSug = !!sugTc && cur !== sug;
                return (
                  <li key={key(p)} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_minmax(240px,320px)] md:items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">
                        {p.supplier_name}
                        {p.sample_price_sek != null && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">{formatSek(p.sample_price_sek)}</span>
                        )}
                      </p>
                      {p.supplier_description?.[0] && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{p.supplier_description[0]}</p>
                      )}
                      {showSug && (
                        <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-md border border-primary/30 bg-primary/5 pl-2 pr-1 py-1 text-xs">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate">
                            <span className="text-muted-foreground">Förslag: samma som </span>
                            <span className="font-medium text-foreground">{sugTc!.supplier_name}</span>
                          </span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => choose(p, sug!, v.links)}
                            className="shrink-0 rounded bg-primary px-2 py-0.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            Använd
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Motsvarighet för ${p.supplier_name}`}
                        className={`h-9 w-full rounded-md border px-2 text-sm ${cur ? "border-border bg-background" : "border-dashed border-muted-foreground/40 bg-background text-muted-foreground"}`}
                        value={cur}
                        disabled={busy}
                        onChange={(e) => choose(p, e.target.value || "clear", v.links)}
                      >
                        <option value="">{cur ? "Ej vald - återställ" : "Välj…"}</option>
                        {v.tc.length > 0 && (
                          <optgroup label="Samma plats som (Travel Connection)">
                            {v.tc.map((t) => (
                              <option key={t.supplier_category_id} value={`tc:${t.supplier_category_id}`}>
                                {t.supplier_name}
                                {t.sample_price_sek != null ? ` · ${formatSek(t.sample_price_sek)}` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="own">Egen rad - ingen motsvarighet</option>
                        <option value="hide">Visa inte</option>
                      </select>
                      <span className="w-12 shrink-0 text-[11px] text-right">
                        {cur ? (
                          <Check className="ml-auto h-4 w-4 text-emerald-600" aria-label="Sparat" />
                        ) : sug ? (
                          <span className="text-primary" title="Sajten slår redan ihop enligt förslaget tills du väljer">auto</span>
                        ) : (
                          <span className="text-amber-700">ej vald</span>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {v.tc.length > 0 && (
              <footer className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <span className="text-foreground">Travel Connection här: </span>
                {v.tc.map((t) => t.supplier_name).join(" · ")}
              </footer>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
