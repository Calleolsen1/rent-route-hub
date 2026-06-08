import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2, Upload, Save, RefreshCw, Star } from "lucide-react";
import { formatSek, formatEventDateTime } from "@/lib/formatSek";
import { getStripeEnvironment } from "@/lib/stripe";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Category = {
  id: string;
  name: string;
  unit_price_sek: number;
  qty_available: number;
  stripe_price_id: string | null;
  markup_pct: number;
  markup_fixed_sek: number;
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

  const load = async () => {
    const [{ data: ev }, { data: dels }, { data: logs }] = await Promise.all([
      (supabase as any)
        .from("events")
        .select("id, source, is_featured, sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at, status, cover_image_url, ticket_categories(id, name, unit_price_sek, qty_available, stripe_price_id, markup_pct, markup_fixed_sek)")
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
        <h2 className="font-display text-xl">Evenemang</h2>
        {events.map((ev) => {
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

              <div className="space-y-2">
                {ev.ticket_categories?.map((c) => (
                  <CategoryRow
                    key={c.id}
                    c={c}
                    isXs2={isXs2}
                    busy={busy}
                    onSync={syncStripe}
                    onSaveMarkup={saveMarkup}
                  />
                ))}
                {!ev.ticket_categories?.length && (
                  <p className="text-xs text-muted-foreground">
                    {isXs2
                      ? "Kategorier hämtas på första sidvisning av evenemanget eller via \"Synka allt\"."
                      : "Inga biljettkategorier för detta evenemang."}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </section>

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

function CategoryRow({
  c,
  isXs2,
  busy,
  onSync,
  onSaveMarkup,
}: {
  c: Category;
  isXs2: boolean;
  busy: string | null;
  onSync: (id: string) => void;
  onSaveMarkup: (id: string, pct: number, fixed: number) => void;
}) {
  const [pct, setPct] = useState<string>(String(c.markup_pct ?? 0));
  const [fixed, setFixed] = useState<string>(String(c.markup_fixed_sek ?? 0));
  const dirty = Number(pct) !== Number(c.markup_pct) || Number(fixed) !== Number(c.markup_fixed_sek);

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
            className="h-9"
          />
        </div>
        <Button
          size="sm"
          variant={dirty ? "default" : "outline"}
          disabled={!dirty || busy === c.id}
          onClick={() => onSaveMarkup(c.id, Number(pct) || 0, Number(fixed) || 0)}
        >
          <Save className="h-3 w-3 mr-1" />
          Spara påslag
        </Button>
      </div>
    </div>
  );
}
