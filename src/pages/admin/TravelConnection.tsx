import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Link2, EyeOff, Ticket, ExternalLink, X } from "lucide-react";
import { formatEventDateTime, formatSek } from "@/lib/formatSek";
import MarkupRulesPanel from "@/components/admin/MarkupRulesPanel";
import SeatCategoryMapping from "@/components/admin/SeatCategoryMapping";

// Travel Connection — the ticket supplier.
//
// Three jobs on one page:
//   1. Sync + review: which supplier products are linked to which of our
//      fixtures, and fix the ones the matcher couldn't place.
//   2. Live tickets: supplier price, FX, markup and final SEK per category.
//   3. Bookings: hold tickets (10 min), confirm with a lead guest, track the
//      supplier invoice and vouchers.
//
// Nothing here creates events. Fixtures come from football-data and Jolpica.

type LinkRow = {
  tc_product_id: number;
  event_id: string | null;
  match_method: "auto" | "manual" | "ignored" | "none";
  match_note: string | null;
  in_scope: boolean;
  tc_type: string;
  tc_name: string;
  tc_competition: string | null;
  tc_starts_at: string | null;
  tc_date_confirmed: boolean;
  tc_currency: string | null;
  events: {
    id: string;
    home_team: string | null;
    away_team: string | null;
    race_name: string | null;
    tournament_name: string;
    starts_at: string;
  } | null;
};

type EventOption = {
  id: string;
  home_team: string | null;
  away_team: string | null;
  race_name: string | null;
  tournament_name: string;
  starts_at: string;
};

type TicketGroup = {
  category_id: string | null;
  name: string;
  available: boolean;
  max_qty: number;
  final_sek?: number;
  ticket_option_id?: number;
  tc_category_id?: number;
  description?: string[];
  supplier_price?: number;
  supplier_currency?: string;
  base_sek?: number;
  markup_pct?: number;
  markup_fixed_sek?: number;
  markup_source?: "category" | "match" | "league" | "standard";
};

type TicketsResponse = {
  supplier: string | null;
  environment?: "sandbox" | "production";
  tc_product_id?: number;
  league?: string | null;
  fx?: { currency: string; rate_to_sek: number; rate_date: string | null; source: string; stale: boolean };
  groups: TicketGroup[];
};

type BookingRow = {
  id: string;
  environment: "sandbox" | "production";
  status: "draft" | "reserved" | "confirmed" | "cancelled" | "expired" | "failed";
  order_id: string | null;
  reservation_num: string | null;
  reservation_expires_at: string | null;
  order_num: string | null;
  agent_reference: string | null;
  lines: { ticket_option_id: number; qty: number; name?: string; price?: number }[];
  supplier_total: number | null;
  supplier_currency: string | null;
  supplier_status: string | null;
  invoice_url: string | null;
  voucher_urls: string[];
  error_message: string | null;
  created_at: string;
  events: { home_team: string | null; away_team: string | null; race_name: string | null; starts_at: string } | null;
};

type SyncLogRow = {
  started_at: string;
  status: "running" | "success" | "partial" | "failed";
  trigger: "manual" | "cron";
  error_message: string | null;
};

const SOURCE_LABEL: Record<NonNullable<TicketGroup["markup_source"]>, string> = {
  category: "kategori",
  match: "match",
  league: "liga",
  standard: "standard",
};

const eventTitle = (e: { home_team: string | null; away_team: string | null; race_name: string | null } | null) =>
  !e ? "-" : e.home_team ? `${e.home_team} – ${e.away_team}` : e.race_name ?? "-";

const STATUS_STYLE: Record<BookingRow["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  reserved: "bg-amber-100 text-amber-900",
  confirmed: "bg-green-100 text-green-900",
  cancelled: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  failed: "bg-red-100 text-red-900",
};

const STATUS_LABEL: Record<BookingRow["status"], string> = {
  draft: "I kassan",
  reserved: "Reserverad",
  confirmed: "Bekräftad",
  cancelled: "Släppt",
  expired: "Utgången",
  failed: "Misslyckad",
};

// tc_product_links / tc_bookings aren't in the generated types until Lovable
// regenerates them after the migration runs; an untyped client reads them.
const db = supabase as unknown as SupabaseClient;

/** supabase.functions.invoke hides the JSON error body behind error.context. */
async function invoke<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      const parsed = ctx ? await ctx.json() : null;
      if (parsed?.error) message = parsed.error;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
}

export default function AdminTravelConnection() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingP1, setSyncingP1] = useState(false);
  const [syncingXs2, setSyncingXs2] = useState(false);
  const [environment, setEnvironment] = useState<"sandbox" | "production" | null>(null);
  const [lastSync, setLastSync] = useState<SyncLogRow | null>(null);
  const [linkTarget, setLinkTarget] = useState<LinkRow | null>(null);
  const [ticketsFor, setTicketsFor] = useState<LinkRow | null>(null);
  const [filter, setFilter] = useState("");

  const load = async () => {
    const [{ data: l, error: lErr }, { data: b }, { data: log }] = await Promise.all([
      db
        .from("tc_product_links")
        .select("tc_product_id, event_id, match_method, match_note, in_scope, tc_type, tc_name, tc_competition, tc_starts_at, tc_date_confirmed, tc_currency, events(id, home_team, away_team, race_name, tournament_name, starts_at)")
        .order("tc_starts_at", { ascending: true })
        .limit(5000),
      db
        .from("tc_bookings")
        .select("*, events(home_team, away_team, race_name, starts_at)")
        .order("created_at", { ascending: false })
        .limit(30),
      db
        .from("supplier_sync_log")
        .select("started_at, status, trigger, error_message")
        .eq("source", "travelconnection")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (lErr) toast.error(`Kunde inte läsa kopplingar: ${lErr.message}`);
    setLinks((l as unknown as LinkRow[]) ?? []);
    setBookings((b as unknown as BookingRow[]) ?? []);
    setLastSync((log as SyncLogRow | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    (async () => {
      const { data } = await supabase.functions.invoke("admin-check-config", { body: {} });
      setEnvironment((data as { travelconnection_environment?: "sandbox" | "production" })?.travelconnection_environment ?? null);
    })();
  }, []);

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await invoke<{
        environment: string;
        stats: Record<string, number>;
        plans?: { venues?: number; copied?: number; failed?: number; errors?: string[]; error?: string };
      }>("travelconnection-sync", { trigger: "manual" });
      const s = res.stats;
      toast.success(
        `${s.matched + s.kept_manual} matcher kopplade · ${s.unmatched_in_scope} att granska · ${s.out_of_scope} utanför sortimentet`,
      );
      const p = res.plans;
      if (p?.error) toast.error(`Arenakartor: ${p.error}`);
      else if (p?.failed) {
        toast.error(`${p.failed} arenakartor kunde inte kopieras (${p.copied ?? 0} klara)`, {
          description: p.errors?.join(" · "),
          duration: 15000,
        });
      }
      else if (p?.copied) toast.success(`${p.copied} nya arenakartor`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  // P1 Travel: second supplier, request-only. Links its events onto our
  // football fixtures and F1 races (creating races from the F1 menu when the
  // season isn't in the calendar yet).
  const runP1Sync = async () => {
    setSyncingP1(true);
    try {
      const res = await invoke<{ environment: string; stats: Record<string, number> }>("p1-sync", { trigger: "manual" });
      const s = res.stats;
      toast.success(
        `P1 (${res.environment}): ${s.matched + s.kept_manual} kopplade · ${s.created} nya F1-lopp · ${s.unmatched} utan match · ${s.other} utanför sortimentet${s.packages ? ` · ${s.packages} resepaket hoppades över` : ""}${s.races_hidden ? ` · ${s.races_hidden} dubblettlopp dolda` : ""}`,
      );
    } catch (e) {
      toast.error(`P1: ${(e as Error).message}`);
    } finally {
      setSyncingP1(false);
    }
  };

  // XS2Event: third supplier, read-only key, request-only. Links its events
  // onto our football fixtures and F1 races; never creates events.
  const runXs2Sync = async () => {
    setSyncingXs2(true);
    try {
      const res = await invoke<{ environment: string; stats: Record<string, number> }>("xs2-sync", { trigger: "manual" });
      const s = res.stats;
      toast.success(`XS2 (${res.environment}): ${s.matched + s.kept_manual} kopplade · ${s.unmatched} utan match (fotboll ${s.football}, F1 ${s.f1})`);
    } catch (e) {
      toast.error(`XS2: ${(e as Error).message}`);
    } finally {
      setSyncingXs2(false);
    }
  };

  const setMethod = async (row: LinkRow, patch: Partial<LinkRow>) => {
    const { error } = await db
      .from("tc_product_links")
      .update(patch)
      .eq("tc_product_id", row.tc_product_id);
    if (error) {
      toast.error(
        error.code === "23505"
          ? "Den matchen är redan kopplad till en annan produkt hos leverantören"
          : error.message,
      );
      return false;
    }
    await load();
    return true;
  };

  const q = filter.trim().toLowerCase();
  const matches = (l: LinkRow) =>
    !q || l.tc_name.toLowerCase().includes(q) || (l.tc_competition ?? "").toLowerCase().includes(q);

  const linked = links.filter((l) => (l.match_method === "auto" || l.match_method === "manual") && l.event_id && matches(l));
  const review = links.filter((l) => l.in_scope && l.match_method === "none" && matches(l));
  const ignored = links.filter((l) => l.match_method === "ignored" && matches(l));
  const outOfScope = links.filter((l) => !l.in_scope && l.match_method === "none").length;

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Laddar...</div>;

  return (
    <div className="p-8 max-w-7xl space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display">Biljettleverantör</h1>
            {environment && (
              <Badge className={environment === "sandbox" ? "bg-amber-100 text-amber-900 hover:bg-amber-100" : "bg-red-600 text-white hover:bg-red-600"}>
                {environment === "sandbox" ? "Sandlåda" : "Skarp miljö"}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Travel Connection säljer biljetter till matcherna vi redan listar. Synken kopplar
            leverantörens produkter till våra matcher - den skapar aldrig egna evenemang. Priser
            och lager hämtas live.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={runSync} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Synka katalogen
          </Button>
          <Button variant="outline" onClick={runP1Sync} disabled={syncingP1}>
            {syncingP1 ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Synka P1 Travel
          </Button>
          <Button variant="outline" onClick={runXs2Sync} disabled={syncingXs2}>
            {syncingXs2 ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Synka XS2
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground -mt-4">
        Synkas automatiskt varje natt runt 02–03 svensk tid, direkt efter matcherna från football-data och F1.
        {lastSync && (
          <>
            {" "}Senast: {new Date(lastSync.started_at).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })}
            {lastSync.trigger === "cron" ? " (automatiskt)" : " (manuellt)"}
            {lastSync.status === "failed" && (
              <span className="text-red-700"> - misslyckades: {lastSync.error_message}</span>
            )}
          </>
        )}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Kopplade matcher" value={links.filter((l) => l.event_id && (l.match_method === "auto" || l.match_method === "manual")).length} />
        <Stat label="Att granska" value={links.filter((l) => l.in_scope && l.match_method === "none").length} warn />
        <Stat label="Ignorerade" value={links.filter((l) => l.match_method === "ignored").length} />
        <Stat label="Utanför sortimentet" value={outOfScope} hint="Andra ligor, konserter m.m." />
      </div>

      <Input
        placeholder="Sök på match eller turnering..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      <Tabs defaultValue={review.length ? "review" : "linked"}>
        <TabsList>
          <TabsTrigger value="review">Att granska ({review.length})</TabsTrigger>
          <TabsTrigger value="linked">Kopplade ({linked.length})</TabsTrigger>
          <TabsTrigger value="ignored">Ignorerade ({ignored.length})</TabsTrigger>
          <TabsTrigger value="bookings">Bokningar ({bookings.length})</TabsTrigger>
          <TabsTrigger value="categories">Kategorier</TabsTrigger>
          <TabsTrigger value="markup">Påslag</TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <LinkTable
            rows={review}
            empty="Inget att granska - alla matcher i sortimentet är kopplade."
            renderActions={(l) => (
              <>
                <Button size="sm" variant="outline" onClick={() => setLinkTarget(l)}>
                  <Link2 className="h-3 w-3 mr-1" /> Koppla
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMethod(l, { match_method: "ignored", event_id: null })}>
                  <EyeOff className="h-3 w-3 mr-1" /> Ignorera
                </Button>
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="linked">
          <LinkTable
            rows={linked}
            empty="Inga kopplade matcher ännu. Kör en synk."
            showEvent
            renderActions={(l) => (
              <>
                <Button size="sm" onClick={() => setTicketsFor(l)}>
                  <Ticket className="h-3 w-3 mr-1" /> Biljetter
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setLinkTarget(l)} title="Koppla till en annan match">
                  <Link2 className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMethod(l, { match_method: "ignored", event_id: null })} title="Fel match - ignorera">
                  <EyeOff className="h-3 w-3" />
                </Button>
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="ignored">
          <LinkTable
            rows={ignored}
            empty="Inga ignorerade produkter."
            renderActions={(l) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMethod(l, { match_method: "none", match_note: "Återställd - matchas vid nästa synk" })}
              >
                Återställ
              </Button>
            )}
          />
        </TabsContent>

        <TabsContent value="categories">
          <SeatCategoryMapping />
        </TabsContent>

        <TabsContent value="markup">
          <MarkupRulesPanel
            leagues={[...new Set(links.map((l) => l.events?.tournament_name).filter((n): n is string => !!n))].sort()}
          />
        </TabsContent>

        <TabsContent value="bookings">
          <BookingsTable rows={bookings} onChanged={load} />
        </TabsContent>
      </Tabs>

      <LinkDialog
        target={linkTarget}
        onClose={() => setLinkTarget(null)}
        onPick={async (eventId) => {
          if (!linkTarget) return;
          const ok = await setMethod(linkTarget, { match_method: "manual", event_id: eventId, match_note: null });
          if (ok) {
            toast.success("Kopplad");
            setLinkTarget(null);
          }
        }}
      />

      <TicketsDialog
        target={ticketsFor}
        environment={environment}
        onClose={() => setTicketsFor(null)}
        onBooked={load}
      />
    </div>
  );
}

function Stat({ label, value, warn, hint }: { label: string; value: number; warn?: boolean; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4" title={hint}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-display ${warn && value > 0 ? "text-amber-700" : ""}`}>{value}</p>
    </div>
  );
}

function LinkTable({
  rows,
  empty,
  showEvent,
  renderActions,
}: {
  rows: LinkRow[];
  empty: string;
  showEvent?: boolean;
  renderActions: (l: LinkRow) => React.ReactNode;
}) {
  if (!rows.length) return <p className="text-sm text-muted-foreground py-6">{empty}</p>;
  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto mt-3">
      <table className="w-full text-sm">
        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <tr>
            <th className="text-left p-3">Hos leverantören</th>
            <th className="text-left p-3">Datum (leverantör)</th>
            <th className="text-left p-3">{showEvent ? "Vår match" : "Varför"}</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.tc_product_id} className="border-b border-border last:border-0 align-top">
              <td className="p-3">
                <p className="font-medium">{l.tc_name}</p>
                <p className="text-xs text-muted-foreground">
                  {l.tc_competition ?? l.tc_type} · #{l.tc_product_id}
                  {l.match_method === "manual" && <span className="ml-2 text-primary">manuellt kopplad</span>}
                </p>
              </td>
              <td className="p-3 whitespace-nowrap">
                {l.tc_starts_at ? formatEventDateTime(l.tc_starts_at) : "-"}
                {!l.tc_date_confirmed && l.tc_type === "football_match" && (
                  <p className="text-xs text-muted-foreground">preliminärt</p>
                )}
              </td>
              <td className="p-3">
                {showEvent && l.events ? (
                  <>
                    <p>{eventTitle(l.events)}</p>
                    <p className="text-xs text-muted-foreground">{formatEventDateTime(l.events.starts_at)}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">{l.match_note ?? "-"}</p>
                )}
              </td>
              <td className="p-3">
                <div className="flex gap-1 justify-end">{renderActions(l)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinkDialog({
  target,
  onClose,
  onPick,
}: {
  target: LinkRow | null;
  onClose: () => void;
  onPick: (eventId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Seed the search with the supplier's home team, which is usually enough.
  useEffect(() => {
    if (!target) return;
    setSearch(target.tc_name.split(/\s+v(s)?\s+/i)[0] ?? "");
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const term = search.trim();
    if (term.length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const safe = term.replace(/[,()%]/g, " ");
      const { data } = await db
        .from("events")
        .select("id, home_team, away_team, race_name, tournament_name, starts_at")
        .in("source", ["football-data", "espn", "jolpica", "travelconnection-cup"])
        .eq("status", "upcoming")
        .or(`home_team.ilike.%${safe}%,away_team.ilike.%${safe}%,race_name.ilike.%${safe}%`)
        .order("starts_at")
        .limit(40);
      setOptions((data as EventOption[]) ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [search, target]);

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Koppla till vår match</DialogTitle>
        </DialogHeader>
        {target && (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-medium">{target.tc_name}</span>
              <span className="text-muted-foreground">
                {" "}· {target.tc_starts_at ? formatEventDateTime(target.tc_starts_at) : "inget datum"}
              </span>
            </p>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök lag eller race..." autoFocus />
            <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-md border border-border">
              {loading && <p className="p-3 text-sm text-muted-foreground">Söker...</p>}
              {!loading && !options.length && <p className="p-3 text-sm text-muted-foreground">Inga matcher.</p>}
              {!loading &&
                options.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onPick(e.id)}
                    className="w-full text-left p-3 hover:bg-muted/50"
                  >
                    <p className="text-sm font-medium">{eventTitle(e)}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.tournament_name} · {formatEventDateTime(e.starts_at)}
                    </p>
                  </button>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TicketsDialog({
  target,
  environment,
  onClose,
  onBooked,
}: {
  target: LinkRow | null;
  environment: "sandbox" | "production" | null;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [reserving, setReserving] = useState(false);
  const [held, setHeld] = useState<BookingRow | null>(null);
  const [textFor, setTextFor] = useState<number | null>(null);

  const fetchTickets = async () => {
    if (!target?.event_id) return;
    setLoading(true);
    try {
      setData(await invoke<TicketsResponse>("travelconnection-tickets", { event_id: target.event_id }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData(null);
    setQty({});
    setHeld(null);
    if (target) fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const selected = useMemo(
    () => Object.entries(qty).filter(([, n]) => n > 0).map(([id, n]) => ({ ticket_option_id: Number(id), qty: n })),
    [qty],
  );

  const reserve = async () => {
    if (!target?.event_id || !selected.length) return;
    setReserving(true);
    try {
      const res = await invoke<{ tc_booking_id: string }>("travelconnection-book", {
        action: "reserve",
        event_id: target.event_id,
        lines: selected,
      });
      const { data: row } = await db
        .from("tc_bookings")
        .select("*, events(home_team, away_team, race_name, starts_at)")
        .eq("id", res.tc_booking_id)
        .single();
      setHeld(row as BookingRow);
      toast.success("Biljetterna är reserverade i 10 minuter");
      onBooked();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReserving(false);
    }
  };

  const fx = data?.fx;

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{target ? eventTitle(target.events) : ""}</DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Hämtar live-priser...
          </p>
        )}

        {data && (
          <div className="space-y-4">
            {fx && (
              <p className="text-xs text-muted-foreground">
                1 {fx.currency} = {fx.rate_to_sek.toFixed(4)} SEK ({fx.source}
                {fx.rate_date ? `, ${fx.rate_date}` : ""})
                {fx.stale && <span className="text-amber-700"> · kunde inte hämta ny kurs, använder senaste</span>}
              </p>
            )}

            {!data.groups.length ? (
              <p className="text-sm text-muted-foreground">Leverantören har inga biljetter till den här matchen just nu.</p>
            ) : (
              <div className="rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="text-left p-3">Kategori</th>
                      <th className="text-right p-3">Inköp</th>
                      <th className="text-right p-3">I SEK</th>
                      <th className="text-right p-3">Påslag</th>
                      <th className="text-right p-3">Kundpris</th>
                      <th className="text-right p-3">Max/order</th>
                      <th className="text-right p-3">Antal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.map((g) => (
                      <tr key={g.ticket_option_id ?? g.name} className={`border-b border-border last:border-0 ${g.available ? "" : "opacity-50"}`}>
                        <td className="p-3">
                          <p>{g.name}</p>
                          {g.description?.[0] && <p className="text-xs text-muted-foreground">{g.description[0]}</p>}
                          {g.tc_category_id != null && (
                            <button
                              type="button"
                              className="text-xs text-primary hover:underline"
                              onClick={() => setTextFor(g.tc_category_id!)}
                            >
                              Text
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {g.supplier_price != null ? `${g.supplier_price} ${g.supplier_currency}` : "-"}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">{g.base_sek != null ? formatSek(g.base_sek) : "-"}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <CategoryMarkup group={g} onSaved={fetchTickets} />
                        </td>
                        <td className="p-3 text-right whitespace-nowrap font-medium">
                          {g.final_sek != null ? formatSek(g.final_sek) : "-"}
                        </td>
                        <td className="p-3 text-right">{g.available ? g.max_qty : "Slut"}</td>
                        <td className="p-3 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={g.max_qty}
                            disabled={!g.available || !!held}
                            value={qty[g.ticket_option_id!] ?? 0}
                            onChange={(e) =>
                              setQty((p) => ({
                                ...p,
                                [g.ticket_option_id!]: Math.max(0, Math.min(g.max_qty, Number(e.target.value) || 0)),
                              }))
                            }
                            className="w-16 h-8 ml-auto text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <CategoryTextDialog
              categoryId={textFor}
              onClose={() => setTextFor(null)}
              onSaved={() => {
                setTextFor(null);
                fetchTickets();
              }}
            />

            {target?.event_id && (
              <MatchMarkup eventId={target.event_id} league={data.league ?? null} onSaved={fetchTickets} />
            )}

            {!held && data.groups.some((g) => g.available) && (
              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground max-w-md">
                  {environment === "production"
                    ? "Skarp miljö: en bekräftad bokning blir en riktig faktura från Travel Connection."
                    : "Sandlåda: inga riktiga köp."}{" "}
                  En reservation håller biljetterna i 10 minuter.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Uppdatera
                  </Button>
                  <Button size="sm" onClick={reserve} disabled={!selected.length || reserving}>
                    {reserving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    Reservera {selected.reduce((s, l) => s + l.qty, 0) || ""}
                  </Button>
                </div>
              </div>
            )}

            {held && (
              <HeldBooking
                booking={held}
                onDone={() => {
                  setHeld(null);
                  setQty({});
                  onBooked();
                  fetchTickets();
                }}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function useCountdown(iso: string | null): number {
  const [left, setLeft] = useState(() => (iso ? new Date(iso).getTime() - Date.now() : 0));
  useEffect(() => {
    if (!iso) return;
    const t = setInterval(() => setLeft(new Date(iso).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [iso]);
  return Math.max(0, left);
}

function HeldBooking({ booking, onDone }: { booking: BookingRow; onDone: () => void }) {
  const left = useCountdown(booking.reservation_expires_at);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const mm = Math.floor(left / 60000);
  const ss = Math.floor((left % 60000) / 1000).toString().padStart(2, "0");

  const act = async (action: "confirm" | "cancel") => {
    setBusy(action);
    try {
      const res = await invoke<{ order_num?: string }>("travelconnection-book", {
        action,
        tc_booking_id: booking.id,
        ...(action === "confirm" && { lead: { first_name: first, last_name: last, email: email || null } }),
      });
      toast.success(action === "confirm" ? `Bekräftad - order ${res.order_num}` : "Reservationen släppt");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-amber-900">
          Reservation {booking.reservation_num} · {booking.supplier_total} {booking.supplier_currency}
        </p>
        <p className={`font-mono text-sm ${left < 120000 ? "text-red-700" : "text-amber-900"}`}>
          {left > 0 ? `${mm}:${ss}` : "Utgången"}
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <Input placeholder="Förnamn (huvudresenär)" value={first} onChange={(e) => setFirst(e.target.value)} />
        <Input placeholder="Efternamn" value={last} onChange={(e) => setLast(e.target.value)} />
        <Input placeholder="E-post (valfritt)" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <p className="text-xs text-amber-900/80">
        Bara huvudresenären krävs - övriga namn begär leverantören senare om klubben behöver dem.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => act("cancel")} disabled={!!busy}>
          {busy === "cancel" && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          Släpp
        </Button>
        <Button size="sm" onClick={() => act("confirm")} disabled={!!busy || left <= 0 || !first.trim() || !last.trim()}>
          {busy === "confirm" && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          Bekräfta bokning
        </Button>
      </div>
    </div>
  );
}

function BookingsTable({ rows, onChanged }: { rows: BookingRow[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (row: BookingRow, action: "refresh" | "cancel" | "fulfil") => {
    setBusy(row.id);
    try {
      await invoke(
        "travelconnection-book",
        action === "fulfil" ? { action, order_id: row.order_id } : { action, tc_booking_id: row.id },
      );
      if (action === "fulfil") toast.success("Biljetterna är bokade");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!rows.length) return <p className="text-sm text-muted-foreground py-6">Inga bokningar hos leverantören ännu.</p>;

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto mt-3">
      <table className="w-full text-sm">
        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <tr>
            <th className="text-left p-3">Match</th>
            <th className="text-left p-3">Biljetter</th>
            <th className="text-left p-3">Nummer</th>
            <th className="text-right p-3">Inköp</th>
            <th className="text-left p-3">Status</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-b border-border last:border-0 align-top">
              <td className="p-3">
                <p className="font-medium">{eventTitle(b.events)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(b.created_at).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })}
                  {b.environment === "sandbox" && " · sandlåda"}
                </p>
                {b.order_id && (
                  <p className="text-xs text-muted-foreground">Webbköp · order {b.order_id.slice(0, 8).toUpperCase()}</p>
                )}
              </td>
              <td className="p-3 text-xs">
                {b.lines.map((l, i) => (
                  <p key={i}>
                    {l.qty} × {l.name ?? `#${l.ticket_option_id}`}
                  </p>
                ))}
              </td>
              <td className="p-3 text-xs font-mono">
                <p>{b.order_num ?? b.reservation_num ?? "-"}</p>
                <p className="text-muted-foreground">{b.agent_reference}</p>
              </td>
              <td className="p-3 text-right whitespace-nowrap">
                {b.supplier_total != null ? `${b.supplier_total} ${b.supplier_currency}` : "-"}
              </td>
              <td className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                {b.supplier_status && <p className="text-xs text-muted-foreground mt-1">{b.supplier_status}</p>}
                {b.error_message && <p className="text-xs text-red-700 mt-1 max-w-xs">{b.error_message}</p>}
                {b.invoice_url && (
                  <a href={b.invoice_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                    Faktura <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {(b.voucher_urls ?? []).map((v, i) => (
                  <a key={v} href={v} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1 mr-2">
                    Voucher {i + 1} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </td>
              <td className="p-3">
                <div className="flex gap-1 justify-end">
                  {(b.status === "reserved" || b.status === "confirmed") && (
                    <Button size="sm" variant="ghost" disabled={busy === b.id} onClick={() => act(b, "refresh")} title="Hämta status, faktura och vouchers">
                      {busy === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                  )}
                  {b.status === "failed" && b.order_id && (
                    <Button size="sm" variant="outline" disabled={busy === b.id} onClick={() => act(b, "fulfil")} title="Kunden har betalat - försök boka biljetterna igen">
                      {busy === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Försök igen"}
                    </Button>
                  )}
                  {b.status === "reserved" && (
                    <Button size="sm" variant="ghost" disabled={busy === b.id} onClick={() => act(b, "cancel")} title="Släpp reservationen">
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Markup cell in the live-price table: shows where it comes from, edits the category's own. */
function CategoryMarkup({ group, onSaved }: { group: TicketGroup; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pct, setPct] = useState("");
  const [fixed, setFixed] = useState("");
  const [busy, setBusy] = useState(false);

  const open = () => {
    setPct(String(group.markup_pct ?? 0));
    setFixed(group.markup_fixed_sek ? String(group.markup_fixed_sek) : "");
    setEditing(true);
  };

  const save = async (override: boolean) => {
    if (!group.category_id) return;
    const p = Number(pct.replace(",", "."));
    const f = Number((fixed || "0").replace(",", "."));
    if (override && (!Number.isFinite(p) || !Number.isFinite(f) || p < 0 || f < 0)) {
      toast.error("Ange ett tal, 0 eller mer");
      return;
    }
    setBusy(true);
    const { error } = await db
      .from("ticket_categories")
      .update(override ? { markup_override: true, markup_pct: p, markup_fixed_sek: f } : { markup_override: false })
      .eq("id", group.category_id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditing(false);
    toast.success(override ? `${group.name}: ${p}%${f ? ` + ${f} kr` : ""}` : `${group.name} följer match/liga/standard igen`);
    onSaved();
  };

  if (!editing) {
    return (
      <button type="button" onClick={open} className="text-right group" title="Ändra påslag för kategorin">
        <span className="group-hover:underline">
          {group.markup_pct ?? 0}%{group.markup_fixed_sek ? ` + ${formatSek(group.markup_fixed_sek)}` : ""}
        </span>
        {group.markup_source && (
          <span className={`block text-[10px] ${group.markup_source === "category" ? "text-primary" : "text-muted-foreground"}`}>
            {SOURCE_LABEL[group.markup_source]}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Input value={pct} onChange={(e) => setPct(e.target.value)} className="w-14 h-7 text-right" inputMode="decimal" autoFocus />
      <span className="text-xs">%+</span>
      <Input value={fixed} onChange={(e) => setFixed(e.target.value)} placeholder="0" className="w-14 h-7 text-right" inputMode="decimal" />
      <span className="text-xs">kr</span>
      <Button size="sm" className="h-7 px-2" disabled={busy} onClick={() => save(true)}>
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Spara"}
      </Button>
      {group.markup_source === "category" && (
        <Button size="sm" variant="ghost" className="h-7 px-2" disabled={busy} onClick={() => save(false)} title="Följ match/liga/standard igen">
          Återställ
        </Button>
      )}
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(false)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

/** One markup for every category of this match, above league/standard. */
function MatchMarkup({ eventId, league, onSaved }: { eventId: string; league: string | null; onSaved: () => void }) {
  const [pct, setPct] = useState("");
  const [fixed, setFixed] = useState("");
  const [hasRule, setHasRule] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await db
        .from("markup_rules")
        .select("markup_pct, markup_fixed_sek")
        .eq("scope", "event")
        .eq("event_id", eventId)
        .maybeSingle();
      setHasRule(!!data);
      setPct(data ? String(data.markup_pct) : "");
      setFixed(data && Number(data.markup_fixed_sek) ? String(data.markup_fixed_sek) : "");
    })();
  }, [eventId]);

  const save = async () => {
    const p = Number(pct.replace(",", "."));
    const f = Number((fixed || "0").replace(",", "."));
    if (pct.trim() === "" || !Number.isFinite(p) || !Number.isFinite(f) || p < 0 || f < 0) {
      toast.error("Ange procent, 0 eller mer");
      return;
    }
    setBusy(true);
    const { error } = await db
      .from("markup_rules")
      .upsert({ scope: "event", event_id: eventId, markup_pct: p, markup_fixed_sek: f, updated_at: new Date().toISOString() }, { onConflict: "event_id" });
    setBusy(false);
    if (error) return toast.error(error.message);
    setHasRule(true);
    toast.success(`Matchpåslag: ${p}%${f ? ` + ${f} kr` : ""}`);
    onSaved();
  };

  const clear = async () => {
    setBusy(true);
    const { error } = await db.from("markup_rules").delete().eq("scope", "event").eq("event_id", eventId);
    setBusy(false);
    if (error) return toast.error(error.message);
    setHasRule(false);
    setPct("");
    setFixed("");
    toast.success("Matchen följer liga/standard igen");
    onSaved();
  };

  return (
    <div className="rounded-lg border border-border p-3 flex flex-wrap items-center gap-2 text-xs">
      <span className="font-medium">Påslag för hela matchen</span>
      <Input value={pct} onChange={(e) => setPct(e.target.value)} placeholder="%" className="w-16 h-7 text-right" inputMode="decimal" />
      <span>%+</span>
      <Input value={fixed} onChange={(e) => setFixed(e.target.value)} placeholder="0" className="w-16 h-7 text-right" inputMode="decimal" />
      <span>kr</span>
      <Button size="sm" className="h-7 px-2" disabled={busy} onClick={save}>
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Spara"}
      </Button>
      {hasRule && (
        <Button size="sm" variant="ghost" className="h-7 px-2" disabled={busy} onClick={clear}>
          Ta bort
        </Button>
      )}
      <span className="text-muted-foreground">
        {hasRule ? "Gäller alla kategorier utan eget påslag." : `Inget satt - följer ${league ? `${league}/` : ""}standard.`} Klicka på ett påslag i tabellen för att ändra en enskild kategori.
      </span>
    </div>
  );
}

/** The Swedish text customers see for a supplier ticket category. */
function CategoryTextDialog({
  categoryId,
  onClose,
  onSaved,
}: {
  categoryId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [row, setRow] = useState<{
    name: string | null;
    description: string[];
    name_sv: string | null;
    description_sv: string[] | null;
    sv_source: "ai" | "manual" | null;
  } | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (categoryId == null) return;
    setRow(null);
    (async () => {
      const { data } = await db
        .from("tc_ticket_category_info")
        .select("name, description, name_sv, description_sv, sv_source")
        .eq("tc_category_id", categoryId)
        .maybeSingle();
      setRow(data);
      setName(data?.name_sv ?? "");
      setText((data?.description_sv ?? []).join("\n"));
    })();
  }, [categoryId]);

  const save = async (patch: Record<string, unknown>, message: string) => {
    if (categoryId == null) return;
    setBusy(true);
    const { error } = await db.from("tc_ticket_category_info").update(patch).eq("tc_category_id", categoryId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(message);
    onSaved();
  };

  return (
    <Dialog open={categoryId != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Text på hemsidan</DialogTitle>
        </DialogHeader>
        {!row ? (
          <p className="text-sm text-muted-foreground">Laddar...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Leverantören (engelska)</p>
              <p className="text-sm font-medium mb-2">{row.name}</p>
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                {row.description.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Kunden ser (svenska)
                {row.sv_source === "manual" ? " · redigerad" : row.sv_source === "ai" ? " · automatiskt översatt" : " · inte översatt än"}
              </p>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Namn" />
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={Math.max(6, row.description.length + 1)}
                placeholder="En punkt per rad"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">En punkt per rad. Namn som "CAT 2" visas alltid som "Kategori 2".</p>
              <div className="flex justify-end gap-2">
                {row.sv_source === "manual" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      save(
                        { sv_source: "ai", translated_from: null },
                        "Översätts automatiskt igen nästa gång biljetterna visas",
                      )}
                  >
                    Återställ till automatisk
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={busy || !text.trim()}
                  onClick={() =>
                    save(
                      {
                        name_sv: name.trim() || null,
                        description_sv: text.split("\n").map((l) => l.trim()).filter(Boolean),
                        sv_source: "manual",
                        translated_at: new Date().toISOString(),
                      },
                      "Texten är sparad",
                    )}
                >
                  {busy && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  Spara
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
