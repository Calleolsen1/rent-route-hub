import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2, Upload, Save, RefreshCw, Star, Plus } from "lucide-react";
import { formatSek, formatEventDateTime } from "@/lib/formatSek";
import { getStripeEnvironment } from "@/lib/stripe";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ManualEventDialog } from "@/components/admin/ManualEventDialog";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { BulkMarkupDialog } from "@/components/admin/BulkMarkupDialog";
import { BulkCompareAtDialog } from "@/components/admin/BulkCompareAtDialog";
import { ChevronDown, ChevronRight, Percent, Tag } from "lucide-react";

type Category = {
  id: string;
  name: string;
  unit_price_sek: number;
  qty_available: number;
  stripe_price_id: string | null;
  markup_pct: number;
  markup_fixed_sek: number;
  compare_at_price_sek: number | null;
  compare_at_pct: number | null;
};

type EventRow = {
  id: string;
  source: string;
  is_featured: boolean;
  sport: string;
  tournament_name: string;
  home_team: string | null;
  away_team: string | null;
  race_name: string | null;
  venue_name: string | null;
  city: string | null;
  starts_at: string;
  status: string;
  cover_image_url: string | null;
  min_price_sek: number | null;
  compare_at_price_sek: number | null;
  compare_at_pct: number | null;
  ticket_categories: Category[];
};

type SyncLogRow = {
  id: string;
  resource_type: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  records_fetched: number;
  records_upserted: number;
  error_message: string | null;
  trigger: string;
};

type DeliveryRow = {
  id: string;
  order_item_id: string;
  file_url: string | null;
  delivered_at: string | null;
  order_items: {
    qty: number;
    orders: { id: string; customer_email: string; customer_name: string | null; invoice_number: string | null };
    events: { home_team: string | null; away_team: string | null; race_name: string | null; starts_at: string };
    ticket_categories: { name: string };
  };
};

export default function AdminTickets() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<DeliveryRow[]>([]);
  const [syncLog, setSyncLog] = useState<SyncLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [manualEventOpen, setManualEventOpen] = useState(false);
  const [categoryTarget, setCategoryTarget] = useState<{ eventId: string; label: string } | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "xs2event" | "manual">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "not_featured">("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [tournamentFilter, setTournamentFilter] = useState<string>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [bulkTarget, setBulkTarget] = useState<{ eventIds: string[]; label: string } | null>(null);
  const [bulkCompareTarget, setBulkCompareTarget] = useState<
    | { kind: "sport" | "tournament"; value: string; label: string }
    | null
  >(null);

  const load = async () => {
    const [{ data: ev }, { data: dels }, { data: logs }] = await Promise.all([
      (supabase as any)
        .from("events")
        .select("id, source, is_featured, sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at, status, cover_image_url, min_price_sek, compare_at_price_sek, compare_at_pct, ticket_categories(id, name, unit_price_sek, qty_available, stripe_price_id, markup_pct, markup_fixed_sek, compare_at_price_sek, compare_at_pct)")
        .order("starts_at", { ascending: true }),
      supabase
        .from("ticket_deliveries")
        .select("id, order_item_id, file_url, delivered_at, order_items!inner(qty, orders!inner(id, customer_email, customer_name, invoice_number, status), events(home_team, away_team, race_name, starts_at), ticket_categories(name))")
        .order("created_at", { ascending: false })
        .limit(50),
      (supabase as any)
        .from("xs2_sync_log")
        .select("id, resource_type, started_at, finished_at, status, records_fetched, records_upserted, error_message, trigger")
        .order("started_at", { ascending: false })
        .limit(5),
    ]);
    setEvents((ev as unknown as EventRow[]) ?? []);
    const onlyPaid = ((dels as unknown as DeliveryRow[]) ?? []).filter(
      (d: any) => d.order_items?.orders?.status === "paid" || d.order_items?.orders?.status === "fulfilled",
    );
    setPendingDeliveries(onlyPaid);
    setSyncLog((logs as unknown as SyncLogRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const runSync = async (resource: "events" | "categories" | "all") => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("xs2-sync", {
        body: { resource, trigger: "manual" },
      });
      if (error) throw error;
      const summary = (data as any)?.summary ?? {};
      const msg = Object.entries(summary)
        .map(([r, s]: any) => `${r}: ${s.upserted}/${s.fetched}`)
        .join(", ");
      toast.success(msg ? `Synk klar — ${msg}` : "Synk klar");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Synk misslyckades");
    } finally {
      setSyncing(false);
    }
  };

  const toggleFeatured = async (eventId: string, value: boolean) => {
    setBusy(eventId);
    try {
      const { error } = await (supabase as any)
        .from("events")
        .update({ is_featured: value })
        .eq("id", eventId);
      if (error) throw error;
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, is_featured: value } : e)),
      );
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte uppdatera");
    } finally {
      setBusy(null);
    }
  };

  const saveCompareAt = async (
    eventId: string,
    value: { sek: number | null; pct: number | null },
  ) => {
    setBusy(eventId);
    try {
      const { error } = await (supabase as any)
        .from("events")
        .update({
          compare_at_price_sek: value.sek,
          compare_at_pct: value.pct,
        })
        .eq("id", eventId);
      if (error) throw error;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, compare_at_price_sek: value.sek, compare_at_pct: value.pct }
            : e,
        ),
      );
      const empty = value.sek == null && value.pct == null;
      toast.success(empty ? "Jämförelsepris rensat" : "Jämförelsepris sparat");
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte spara");
    } finally {
      setBusy(null);
    }
  };

  const saveCategoryCompareAt = async (
    categoryId: string,
    value: { sek: number | null; pct: number | null },
  ) => {
    setBusy(categoryId);
    try {
      const { error } = await (supabase as any)
        .from("ticket_categories")
        .update({
          compare_at_price_sek: value.sek,
          compare_at_pct: value.pct,
        })
        .eq("id", categoryId);
      if (error) throw error;
      setEvents((prev) =>
        prev.map((e) => ({
          ...e,
          ticket_categories: e.ticket_categories?.map((c) =>
            c.id === categoryId
              ? { ...c, compare_at_price_sek: value.sek, compare_at_pct: value.pct }
              : c,
          ),
        })),
      );
      const empty = value.sek == null && value.pct == null;
      toast.success(empty ? "Jämförelsepris rensat" : "Jämförelsepris sparat");
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte spara");
    } finally {
      setBusy(null);
    }
  };

  const applyEventMarkupToAll = async (
    eventId: string,
    values: { pct: number; fixed: number },
  ): Promise<number> => {
    setBusy(eventId);
    try {
      const { error, count } = await (supabase as any)
        .from("ticket_categories")
        .update({ markup_pct: values.pct, markup_fixed_sek: values.fixed })
        .eq("event_id", eventId)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      await load();
      toast.success(`Påslag uppdaterat på ${count ?? 0} kategorier`);
      return Number(count ?? 0);
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte uppdatera");
      return 0;
    } finally {
      setBusy(null);
    }
  };

  const applyGroupCompareAtPct = async (
    target: { sport?: string; tournament?: string },
    pct: number | null,
  ): Promise<number> => {
    const { data, error } = await (supabase as any).rpc("set_group_compare_at_pct", {
      p_pct: pct ?? 0,
      p_sport: target.sport ?? null,
      p_tournament_name: target.tournament ?? null,
    });
    if (error) throw error;
    await load();
    return Number(data ?? 0);
  };

  const setCoverImage = async (eventId: string, url: string | null) => {
    const { error } = await (supabase as any)
      .from("events")
      .update({ cover_image_url: url })
      .eq("id", eventId);
    if (error) {
      toast.error(error.message ?? "Kunde inte spara bild");
      return;
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, cover_image_url: url } : e)),
    );
  };

  const syncStripe = async (categoryId: string) => {
    setBusy(categoryId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-stripe-price", {
        body: { categoryId, environment: getStripeEnvironment() },
      });
      if (error || (data as any)?.error) throw new Error(error?.message ?? (data as any)?.error);
      toast.success("Stripe-pris synkat");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Synk misslyckades");
    } finally {
      setBusy(null);
    }
  };

  const saveMarkup = async (categoryId: string, markup_pct: number, markup_fixed_sek: number) => {
    setBusy(categoryId);
    try {
      const { error } = await supabase
        .from("ticket_categories")
        .update({ markup_pct, markup_fixed_sek })
        .eq("id", categoryId);
      if (error) throw error;
      toast.success("Påslag sparat");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte spara påslag");
    } finally {
      setBusy(null);
    }
  };

  const uploadTicket = async (delivery: DeliveryRow, file: File) => {
    setBusy(delivery.id);
    try {
      const orderId = delivery.order_items.orders.id;
      const path = `${orderId}/${delivery.id}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("ticket-files")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("ticket_deliveries")
        .update({ file_url: path, delivered_at: new Date().toISOString() })
        .eq("id", delivery.id);
      if (dbErr) throw dbErr;
      toast.success("Biljett uppladdad");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Uppladdning misslyckades");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground text-sm">Laddar...</div>;
  }

  return (
    <div className="p-8 max-w-7xl space-y-12">
      <div>
        <h1 className="text-3xl font-display mb-2">Biljetter</h1>
        <p className="text-muted-foreground text-sm">
          Synka evenemang och kategorier från xs2event, ställ in påslag per kategori, och hantera leveranser av manuella biljetter.
        </p>
      </div>

      {/* xs2event sync */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl mb-1">xs2event-synk</h2>
            <p className="text-xs text-muted-foreground">
              Hämtar evenemang och kategorier från xs2event och uppdaterar lokal databas. Biljetter och priser hämtas live vid varje sidvisning.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              disabled={syncing}
              onClick={() => runSync("events")}
            >
              {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Synka evenemang
            </Button>
            <Button
              size="sm"
              disabled={syncing}
              onClick={() => runSync("all")}
            >
              {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Synka allt
            </Button>
          </div>
        </div>

        {syncLog.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Senaste körningar</p>
            <div className="space-y-1.5">
              {syncLog.map((l) => {
                const dot =
                  l.status === "success"
                    ? "bg-green-500"
                    : l.status === "running"
                    ? "bg-amber-500"
                    : "bg-red-500";
                return (
                  <div key={l.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                      <span className="font-mono uppercase tracking-wider">{l.resource_type}</span>
                      <span className="text-muted-foreground">
                        {new Date(l.started_at).toLocaleString("sv-SE")}
                      </span>
                      <span className="text-muted-foreground">· {l.trigger}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {l.records_upserted}/{l.records_fetched}
                      {l.error_message && (
                        <span className="ml-2 text-red-600" title={l.error_message}>!</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Events + categories */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Evenemang</h2>
          <Button size="sm" onClick={() => setManualEventOpen(true)}>
            <Plus className="h-3 w-3 mr-1.5" /> Skapa manuellt event
          </Button>
        </div>

        {/* Filter / sök */}
        {(() => {
          const SPORT_LABEL: Record<string, string> = { soccer: "Fotboll", formula1: "Formel 1" };
          const availableSports = Array.from(new Set(events.map((e) => e.sport))).sort();
          const tournamentsForSport = Array.from(
            new Set(
              events
                .filter((e) => sportFilter === "all" || e.sport === sportFilter)
                .map((e) => e.tournament_name)
                .filter(Boolean),
            ),
          ).sort();
          return (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Input
                placeholder="Sök på lag, race, turnering, arena..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select
                  value={sportFilter}
                  onChange={(e) => {
                    setSportFilter(e.target.value);
                    setTournamentFilter("all"); // Reset tournament when sport changes
                  }}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Alla sporter</option>
                  {availableSports.map((s) => (
                    <option key={s} value={s}>{SPORT_LABEL[s] ?? s}</option>
                  ))}
                </select>
                <select
                  value={tournamentFilter}
                  onChange={(e) => setTournamentFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={tournamentsForSport.length === 0}
                >
                  <option value="all">Alla turneringar</option>
                  {tournamentsForSport.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Alla källor</option>
                  <option value="xs2event">Bara xs2event</option>
                  <option value="manual">Bara manuella</option>
                </select>
                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value as typeof featuredFilter)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Alla evenemang</option>
                  <option value="featured">Bara förstasidan</option>
                  <option value="not_featured">Ej förstasidan</option>
                </select>
              </div>
            </div>
          );
        })()}

        {(() => {
          const SPORT_LABEL: Record<string, string> = { soccer: "Fotboll", formula1: "Formel 1" };
          const SPORT_ORDER = ["soccer", "formula1"];

          const filtered = events.filter((ev) => {
            if (sportFilter !== "all" && ev.sport !== sportFilter) return false;
            if (tournamentFilter !== "all" && ev.tournament_name !== tournamentFilter) return false;
            if (sourceFilter === "xs2event" && ev.source !== "xs2event") return false;
            if (sourceFilter === "manual" && ev.source === "xs2event") return false;
            if (featuredFilter === "featured" && !ev.is_featured) return false;
            if (featuredFilter === "not_featured" && ev.is_featured) return false;
            if (search.trim()) {
              const q = search.trim().toLowerCase();
              const haystack = [
                ev.tournament_name,
                ev.home_team,
                ev.away_team,
                ev.race_name,
                ev.venue_name,
                ev.city,
              ].filter(Boolean).join(" ").toLowerCase();
              if (!haystack.includes(q)) return false;
            }
            return true;
          });
          if (filtered.length === 0) {
            return (
              <p className="text-sm text-muted-foreground text-center py-8">
                Inga evenemang matchar filtren.
              </p>
            );
          }

          // Group: sport → tournament_name → events (sorted by date)
          const sportMap = new Map<string, Map<string, EventRow[]>>();
          for (const ev of [...filtered].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
            const tournamentKey = ev.tournament_name ?? "Okänd turnering";
            if (!sportMap.has(ev.sport)) sportMap.set(ev.sport, new Map());
            const tournaments = sportMap.get(ev.sport)!;
            if (!tournaments.has(tournamentKey)) tournaments.set(tournamentKey, []);
            tournaments.get(tournamentKey)!.push(ev);
          }
          const sortedSports = Array.from(sportMap.keys()).sort((a, b) => {
            const ia = SPORT_ORDER.indexOf(a);
            const ib = SPORT_ORDER.indexOf(b);
            if (ia === -1 && ib === -1) return a.localeCompare(b);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
          });

          return sortedSports.map((sport) => {
            const tournaments = sportMap.get(sport)!;
            const sortedTournaments = Array.from(tournaments.keys()).sort();
            const sportTotal = Array.from(tournaments.values()).reduce((s, evs) => s + evs.length, 0);
            return (
              <div key={sport} className="space-y-3">
                <div className="flex items-center justify-between pt-4 border-t border-border gap-3 flex-wrap">
                  <h3 className="font-display text-2xl">
                    {SPORT_LABEL[sport] ?? sport}
                    <span className="text-sm text-muted-foreground font-sans ml-3">{sportTotal} st</span>
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setBulkCompareTarget({
                        kind: "sport",
                        value: sport,
                        label: `${SPORT_LABEL[sport] ?? sport} (${sportTotal} event)`,
                      })
                    }
                  >
                    <Tag className="h-3 w-3 mr-1.5" /> Jämförelsepris för sporten
                  </Button>
                </div>
                {sortedTournaments.map((tournament) => {
                  const evs = tournaments.get(tournament)!;
                  const groupKey = `${sport}::${tournament}`;
                  const isCollapsed = collapsed[groupKey] ?? false;
                  return (
                    <div key={groupKey} className="border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30">
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsed((prev) => ({ ...prev, [groupKey]: !isCollapsed }))
                          }
                          className="flex items-center gap-2 text-left flex-1 min-w-0"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span className="font-medium truncate">{tournament}</span>
                          <span className="text-xs text-muted-foreground">{evs.length} st</span>
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBulkCompareTarget({
                                kind: "tournament",
                                value: tournament,
                                label: `${tournament} (${evs.length} ${evs.length === 1 ? "event" : "event"})`,
                              });
                            }}
                          >
                            <Tag className="h-3 w-3 mr-1.5" /> Jämförelsepris
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBulkTarget({
                                eventIds: evs.map((x) => x.id),
                                label: `${tournament} (${evs.length} ${evs.length === 1 ? "match" : "matcher"})`,
                              });
                            }}
                          >
                            <Percent className="h-3 w-3 mr-1.5" /> Påslag
                          </Button>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div className="space-y-3 p-4">
                          {evs.map((ev) => {
          const headline = ev.sport === "soccer" ? `${ev.home_team} vs ${ev.away_team}` : ev.race_name;
          const isXs2 = ev.source === "xs2event";
          return (
            <div key={ev.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-primary">{ev.tournament_name}</p>
                    <Badge variant={isXs2 ? "default" : "outline"} className="text-[9px] uppercase tracking-wider">
                      {isXs2 ? "xs2event" : "manuell"}
                    </Badge>
                  </div>
                  <h3 className="font-display text-lg">{headline}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatEventDateTime(ev.starts_at)} · {ev.venue_name}{ev.city ? `, ${ev.city}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Star className={`h-3 w-3 ${ev.is_featured ? "fill-amber-400 text-amber-400" : ""}`} />
                    Förstasidan
                    <Switch
                      checked={ev.is_featured}
                      disabled={busy === ev.id}
                      onCheckedChange={(v) => toggleFeatured(ev.id, v)}
                    />
                  </label>
                  <Badge variant={ev.status === "upcoming" ? "default" : "outline"}>{ev.status}</Badge>
                </div>
              </div>
              <div className="mb-4 pb-4 border-b border-border">
                <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
                  Omslagsbild
                </p>
                <ImageUploader
                  value={ev.cover_image_url}
                  prefix={`event-covers/${ev.id}`}
                  onUploaded={(url) => setCoverImage(ev.id, url)}
                  onCleared={() => setCoverImage(ev.id, null)}
                />
              </div>

              <EventDefaultsPanel
                event={ev}
                busy={busy === ev.id}
                onSaveCompareAt={saveCompareAt}
                onApplyMarkupToAll={applyEventMarkupToAll}
              />

              <div className="space-y-2">
                {ev.ticket_categories?.map((c) => (
                  <CategoryRow
                    key={c.id}
                    c={c}
                    isXs2={isXs2}
                    busy={busy}
                    onSync={syncStripe}
                    onSaveMarkup={saveMarkup}
                    onSaveCompareAt={saveCategoryCompareAt}
                  />
                ))}
                {!ev.ticket_categories?.length && (
                  <p className="text-xs text-muted-foreground">
                    {isXs2
                      ? "Kategorier hämtas på första sidvisning av evenemanget eller via \"Synka allt\"."
                      : "Inga biljettkategorier för detta evenemang."}
                  </p>
                )}
                {!isXs2 && (
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setCategoryTarget({
                          eventId: ev.id,
                          label: headline ?? ev.tournament_name,
                        })
                      }
                    >
                      <Plus className="h-3 w-3 mr-1.5" /> Lägg till kategori
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          });
        })()}
      </section>

      {bulkTarget && (
        <BulkMarkupDialog
          open={!!bulkTarget}
          onOpenChange={(o) => !o && setBulkTarget(null)}
          eventIds={bulkTarget.eventIds}
          groupLabel={bulkTarget.label}
          onApplied={load}
        />
      )}

      {bulkCompareTarget && (
        <BulkCompareAtDialog
          open={!!bulkCompareTarget}
          onOpenChange={(o) => !o && setBulkCompareTarget(null)}
          target={
            bulkCompareTarget.kind === "sport"
              ? { sport: bulkCompareTarget.value }
              : { tournament: bulkCompareTarget.value }
          }
          groupLabel={bulkCompareTarget.label}
          onApplied={load}
        />
      )}

      <ManualEventDialog
        open={manualEventOpen}
        onOpenChange={setManualEventOpen}
        onCreated={load}
      />

      {categoryTarget && (
        <CategoryDialog
          eventId={categoryTarget.eventId}
          eventLabel={categoryTarget.label}
          open={!!categoryTarget}
          onOpenChange={(o) => !o && setCategoryTarget(null)}
          onCreated={load}
        />
      )}

      {/* Deliveries */}
      <section className="space-y-4">
        <h2 className="font-display text-xl">Biljettleveranser (senaste 50)</h2>
        {pendingDeliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga betalda beställningar att leverera ännu.</p>
        ) : (
          pendingDeliveries.map((d) => {
            const ev = d.order_items.events;
            const title = ev.home_team ? `${ev.home_team} vs ${ev.away_team}` : ev.race_name;
            return (
              <div key={d.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{title} · {d.order_items.ticket_categories.name} × {d.order_items.qty}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.order_items.orders.customer_name ?? "—"} · {d.order_items.orders.customer_email}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {d.order_items.orders.invoice_number ?? d.order_items.orders.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {d.file_url ? (
                    <Badge variant="default">Levererad</Badge>
                  ) : (
                    <Badge variant="outline">Väntar</Badge>
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-md cursor-pointer hover:bg-accent">
                    <Upload className="h-3 w-3" />
                    {d.file_url ? "Byt fil" : "Ladda upp biljett"}
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      disabled={busy === d.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadTicket(d, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

/**
 * Single source-of-truth row for "what applies to every category under this
 * game by default". Two side-by-side editors: compare-at (resolution-chain,
 * cascades automatically) and markup (writes back to all categories on
 * apply — no event-level markup column, so the value here is just a bulk
 * action against ticket_categories).
 */
function EventDefaultsPanel({
  event,
  busy,
  onSaveCompareAt,
  onApplyMarkupToAll,
}: {
  event: EventRow;
  busy: boolean;
  onSaveCompareAt: (id: string, value: { sek: number | null; pct: number | null }) => void;
  onApplyMarkupToAll: (id: string, values: { pct: number; fixed: number }) => Promise<number>;
}) {
  // Derive a representative markup from the first category (categories may
  // diverge; this is a quick read-out showing what the bulk will start from).
  const firstCat = event.ticket_categories?.[0];
  const representativePct = firstCat ? Number(firstCat.markup_pct ?? 0) : 0;
  const representativeFixed = firstCat ? Number(firstCat.markup_fixed_sek ?? 0) : 0;
  const allSameMarkup = (event.ticket_categories ?? []).every(
    (c) =>
      Number(c.markup_pct ?? 0) === representativePct &&
      Number(c.markup_fixed_sek ?? 0) === representativeFixed,
  );

  const [pctText, setPctText] = useState(String(representativePct));
  const [fixedText, setFixedText] = useState(String(representativeFixed));
  useEffect(() => {
    setPctText(String(representativePct));
    setFixedText(String(representativeFixed));
  }, [representativePct, representativeFixed]);

  const apply = async () => {
    const pct = Number(pctText);
    const fixed = Number(fixedText);
    if (!Number.isFinite(pct) || pct < 0 || pct > 200) {
      toast.error("Procent måste vara 0–200");
      return;
    }
    if (!Number.isFinite(fixed) || fixed < 0) {
      toast.error("Fast påslag kan inte vara negativt");
      return;
    }
    if (
      !confirm(
        `Sätter påslag ${pct}% + ${fixed} kr på alla biljettkategorier för detta event. Per-kategori-värden ersätts. Fortsätta?`,
      )
    ) {
      return;
    }
    await onApplyMarkupToAll(event.id, { pct, fixed });
  };

  return (
    <div className="mb-4 pb-4 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
          Standardvärden för alla biljetter under detta event
        </p>
        {!allSameMarkup && event.ticket_categories?.length ? (
          <span className="text-[10px] text-amber-700">
            ⚠️ Olika påslag per kategori — fält visar första kategorin
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Jämförelsepris */}
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
            Jämförelsepris (överstruket)
          </p>
          <CompareAtEditor
            targetId={event.id}
            minPriceSek={event.min_price_sek}
            valueSek={event.compare_at_price_sek}
            valuePct={event.compare_at_pct}
            busy={busy}
            onSave={onSaveCompareAt}
            label=""
            compact
          />
        </div>
        {/* Påslag (markup) */}
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              Påslag (gäller alla kategorier)
            </p>
            <Button size="sm" variant="outline" disabled={busy} onClick={apply} className="h-7 text-xs">
              <Percent className="h-3 w-3 mr-1" /> Tillämpa
            </Button>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="w-[100px]">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">%</label>
              <div className="relative mt-0.5">
                <Input
                  type="number"
                  min={0}
                  max={200}
                  step="0.1"
                  value={pctText}
                  onChange={(e) => setPctText(e.target.value)}
                  disabled={busy}
                  className="h-9 pr-7 text-sm"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground pb-2">+</span>
            <div className="w-[110px]">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fast</label>
              <div className="relative mt-0.5">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={fixedText}
                  onChange={(e) => setFixedText(e.target.value)}
                  disabled={busy}
                  className="h-9 pr-10 text-sm"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">SEK</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground pb-2 flex-1 min-w-[140px]">
              slutpris = xs2-pris × (1 + %/100) + SEK
            </p>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-amber-700 mt-2">
        ⚠️ Jämförelsepris måste vara ett verkligt tidigare pris (Prisinformationslagen). Per-kategori-värden längre ner vinner över dessa standardvärden.
      </p>
    </div>
  );
}

function CompareAtEditor({
  targetId,
  minPriceSek,
  valueSek,
  valuePct,
  busy,
  onSave,
  label,
  compact = false,
}: {
  targetId: string;
  minPriceSek: number | null;
  valueSek: number | null;
  valuePct: number | null;
  busy: boolean;
  onSave: (id: string, value: { sek: number | null; pct: number | null }) => void;
  label: string;
  /** Tighter layout for the per-category row (no warning, no border). */
  compact?: boolean;
}) {
  const [sekText, setSekText] = useState<string>(valueSek != null ? String(valueSek) : "");
  const [pctText, setPctText] = useState<string>(valuePct != null ? String(valuePct) : "");
  useEffect(() => {
    setSekText(valueSek != null ? String(valueSek) : "");
    setPctText(valuePct != null ? String(valuePct) : "");
  }, [valueSek, valuePct]);

  const cur = Number(minPriceSek);
  const sekNum = Number(sekText);
  const pctNum = Number(pctText);
  // Live preview — SEK wins, then pct
  const previewCompare = Number.isFinite(sekNum) && sekNum > cur
    ? sekNum
    : Number.isFinite(pctNum) && pctNum > 0 && cur > 0
      ? Math.round(cur * (1 + pctNum / 100))
      : null;
  const pctOff =
    previewCompare && cur > 0
      ? Math.round(((previewCompare - cur) / previewCompare) * 100)
      : null;

  const commitSek = () => {
    const t = sekText.trim();
    const next = t === "" ? null : Number(t);
    if (next != null && (!Number.isFinite(next) || next < 0)) {
      toast.error("Ange ett giltigt belopp eller lämna tomt");
      setSekText(valueSek != null ? String(valueSek) : "");
      return;
    }
    if (next === valueSek) return;
    // When SEK is set, clear pct on the same level (SEK wins anyway)
    onSave(targetId, { sek: next, pct: next != null ? null : valuePct });
  };
  const commitPct = () => {
    const t = pctText.trim();
    const next = t === "" ? null : Number(t);
    if (next != null && (!Number.isFinite(next) || next < 0 || next > 500)) {
      toast.error("Procent måste vara 0-500 eller tomt");
      setPctText(valuePct != null ? String(valuePct) : "");
      return;
    }
    if (next === valuePct) return;
    onSave(targetId, { sek: next != null ? null : valueSek, pct: next });
  };
  const clear = () => {
    setSekText("");
    setPctText("");
    onSave(targetId, { sek: null, pct: null });
  };

  return (
    <div className={compact ? "" : "mb-4 pb-4 border-b border-border"}>
      {!compact && (
        <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
          {label}
        </p>
      )}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="w-[120px]">
          {compact && <label className="text-[10px] uppercase tracking-wider text-muted-foreground">SEK</label>}
          <div className="relative mt-0.5">
            <Input
              type="number"
              min={0}
              step="1"
              value={sekText}
              onChange={(e) => setSekText(e.target.value)}
              onBlur={commitSek}
              placeholder={cur > 0 ? `t.ex. ${Math.round(cur * 1.2)}` : "tomt"}
              disabled={busy}
              className="h-9 pr-10 text-sm"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">SEK</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground pb-2">eller</span>
        <div className="w-[100px]">
          {compact && <label className="text-[10px] uppercase tracking-wider text-muted-foreground">%</label>}
          <div className="relative mt-0.5">
            <Input
              type="number"
              min={0}
              max={500}
              step="1"
              value={pctText}
              onChange={(e) => setPctText(e.target.value)}
              onBlur={commitPct}
              placeholder="tomt"
              disabled={busy}
              className="h-9 pr-7 text-sm"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground pb-2 flex-1 min-w-[160px]">
          {cur > 0 ? (
            previewCompare ? (
              <>
                <span className="line-through">{formatSek(previewCompare)}</span> →{" "}
                <strong>{formatSek(Math.round(cur))}</strong>{" "}
                <span className="text-primary font-semibold">−{pctOff}%</span>
              </>
            ) : (
              <>Pris från <strong>{formatSek(cur)}</strong> — fyll i SEK eller % för att visa rabatt</>
            )
          ) : (
            <>Pris saknas</>
          )}
        </div>
        {(valueSek != null || valuePct != null) && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={clear} className="h-9 text-xs">
            Rensa
          </Button>
        )}
      </div>
      {!compact && (
        <p className="text-[10px] text-amber-700 mt-1.5">
          ⚠️ Måste vara ett verkligt tidigare pris (Prisinformationslagen). SEK vinner över % om båda är ifyllda. Per-kategori vinner över event-nivå.
        </p>
      )}
    </div>
  );
}

function CategoryRow({
  c,
  isXs2,
  busy,
  onSync,
  onSaveMarkup,
  onSaveCompareAt,
}: {
  c: Category;
  isXs2: boolean;
  busy: string | null;
  onSync: (id: string) => void;
  onSaveMarkup: (id: string, pct: number, fixed: number) => void;
  onSaveCompareAt: (id: string, value: { sek: number | null; pct: number | null }) => void;
}) {
  const [pct, setPct] = useState<string>(String(c.markup_pct ?? 0));
  const [fixed, setFixed] = useState<string>(String(c.markup_fixed_sek ?? 0));
  const [saved, setSaved] = useState(false);

  // Autosave on blur if either field actually changed. The visible "Sparad"
  // pill confirms the write so operators don't have to hunt for a save button.
  const maybeSave = () => {
    const nextPct = Number(pct) || 0;
    const nextFixed = Number(fixed) || 0;
    if (nextPct === Number(c.markup_pct) && nextFixed === Number(c.markup_fixed_sek)) return;
    onSaveMarkup(c.id, nextPct, nextFixed);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="border-t border-border pt-3 space-y-3">
      <div className="flex items-start justify-between text-sm">
        <div>
          <p className="font-medium">{c.name}</p>
          <p className="text-xs text-muted-foreground">
            Senast visat pris: {formatSek(c.unit_price_sek)} · {c.qty_available} biljetter kvar
          </p>
          {!isXs2 && (
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              lookup_key: {c.stripe_price_id ?? "–"}
            </p>
          )}
        </div>
        {!isXs2 && (
          <div className="flex items-center gap-2">
            {c.stripe_price_id ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={busy === c.id}
              onClick={() => onSync(c.id)}
            >
              {busy === c.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {c.stripe_price_id ? "Uppdatera Stripe-pris" : "Skapa Stripe-pris"}
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1 max-w-[140px]">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Påslag %</label>
          <Input
            type="number"
            step="0.01"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            onBlur={maybeSave}
            className="h-9"
          />
        </div>
        <div className="flex-1 max-w-[140px]">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Påslag SEK</label>
          <Input
            type="number"
            step="1"
            value={fixed}
            onChange={(e) => setFixed(e.target.value)}
            onBlur={maybeSave}
            className="h-9"
          />
        </div>
        {saved && (
          <span className="text-xs text-green-700 flex items-center gap-1 pb-2">
            <CheckCircle2 className="h-3 w-3" /> Sparad
          </span>
        )}
      </div>
      <div className="pt-2 border-t border-dashed border-border/60">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
          Jämförelsepris för denna kategori (valfritt — vinner över event-nivå)
        </p>
        <CompareAtEditor
          targetId={c.id}
          minPriceSek={Number(c.unit_price_sek) || null}
          valueSek={c.compare_at_price_sek}
          valuePct={c.compare_at_pct}
          busy={busy === c.id}
          onSave={onSaveCompareAt}
          label=""
          compact
        />
      </div>
    </div>
  );
}
