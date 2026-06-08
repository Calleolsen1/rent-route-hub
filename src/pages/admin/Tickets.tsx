import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2, Upload, Save } from "lucide-react";
import { formatSek, formatEventDateTime } from "@/lib/formatSek";
import { getStripeEnvironment } from "@/lib/stripe";

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
  sport: string;
  tournament_name: string;
  home_team: string | null;
  away_team: string | null;
  race_name: string | null;
  venue_name: string | null;
  city: string | null;
  starts_at: string;
  status: string;
  ticket_categories: Category[];
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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const [{ data: ev }, { data: dels }] = await Promise.all([
      supabase
        .from("events")
        .select("id, sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at, status, ticket_categories(id, name, unit_price_sek, qty_available, stripe_price_id, markup_pct, markup_fixed_sek)")
        .order("starts_at", { ascending: true }),
      supabase
        .from("ticket_deliveries")
        .select("id, order_item_id, file_url, delivered_at, order_items!inner(qty, orders!inner(id, customer_email, customer_name, invoice_number, status), events(home_team, away_team, race_name, starts_at), ticket_categories(name))")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setEvents((ev as unknown as EventRow[]) ?? []);
    const onlyPaid = ((dels as unknown as DeliveryRow[]) ?? []).filter(
      (d: any) => d.order_items?.orders?.status === "paid" || d.order_items?.orders?.status === "fulfilled",
    );
    setPendingDeliveries(onlyPaid);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

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
        <h1 className="text-3xl font-display mb-2">Biljetter & Stripe-priser</h1>
        <p className="text-muted-foreground text-sm">
          Synka biljettkategorier till Stripe innan evenemang publiceras. Ladda upp biljettfiler för betalda ordrar nedan.
        </p>
      </div>

      {/* Events + categories */}
      <section className="space-y-6">
        <h2 className="font-display text-xl">Evenemang</h2>
        {events.map((ev) => {
          const headline = ev.sport === "soccer" ? `${ev.home_team} vs ${ev.away_team}` : ev.race_name;
          return (
            <div key={ev.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-primary">{ev.tournament_name}</p>
                  <h3 className="font-display text-lg">{headline}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatEventDateTime(ev.starts_at)} · {ev.venue_name}{ev.city ? `, ${ev.city}` : ""}
                  </p>
                </div>
                <Badge variant={ev.status === "upcoming" ? "default" : "outline"}>{ev.status}</Badge>
              </div>
              <div className="space-y-2">
                {ev.ticket_categories?.map((c) => (
                  <CategoryRow
                    key={c.id}
                    c={c}
                    busy={busy}
                    onSync={syncStripe}
                    onSaveMarkup={saveMarkup}
                  />
                ))}
                {!ev.ticket_categories?.length && (
                  <p className="text-xs text-muted-foreground">Inga biljettkategorier för detta evenemang.</p>
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
