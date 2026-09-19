import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, ArrowRight, Download, AlertTriangle } from "lucide-react";
import { formatEventDateTime, formatSek } from "@/lib/formatSek";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { resolveTicketUrl } from "@/lib/eticket";

type OrderItem = {
  id: string;
  qty: number;
  unit_price_sek: number;
  events: {
    sport: string;
    tournament_name: string;
    home_team: string | null;
    away_team: string | null;
    race_name: string | null;
    venue_name: string | null;
    city: string | null;
    starts_at: string;
  };
  ticket_categories: { name: string };
  ticket_deliveries: Array<{ file_url: string | null; delivered_at: string | null }>;
};

type OrderWithItems = {
  id: string;
  status: string;
  total_sek: number;
  refunded_sek: number | null;
  created_at: string;
  invoice_number: string | null;
  notes: string | null;
  fulfillment_attempt_count: number | null;
  order_items: OrderItem[];
};

// After 48 fulfilment attempts (~2 days) the order genuinely needs ops
// intervention - the UI flips to the warning.
const FULFILLMENT_RETRY_MAX = 48;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pågående",
  awaiting_payment: "Väntar på betalning",
  paid: "Betald",
  fulfilled: "Levererad",
  failed: "Misslyckad",
  refunded: "Återbetald",
  cancelled: "Avbruten",
};

// Mitt Kaisen colour tokens - preserved from the original layout.
const C = {
  text: "hsl(210 30% 92%)",
  textMuted: "hsl(210 20% 70%)",
  textDim: "hsl(210 20% 60%)",
  bgCard: "hsl(222 40% 18%)",
  bgCardBorder: "hsl(222 40% 25%)",
  accent: "hsl(201 100% 35%)",
  warning: "hsl(40 90% 55%)",
};

export default function MittKaisenBiljetter() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("orders")
        .select(
          "id, status, total_sek, refunded_sek, created_at, invoice_number, notes, fulfillment_attempt_count, order_items(id, qty, unit_price_sek, events(sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(name), ticket_deliveries(file_url, delivered_at))",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as unknown as OrderWithItems[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1
        className="text-4xl md:text-5xl font-light mb-2"
        style={{ color: C.text, fontFamily: "'Cormorant Garamond', serif" }}
      >
        Mina biljetter
      </h1>
      <p className="text-sm mb-10" style={{ color: C.textMuted }}>
        Här samlas dina match- och racebiljetter. Klicka på en biljett för att ladda ner den.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: C.textMuted }}>
          Laddar...
        </p>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl p-10 text-center" style={{ backgroundColor: C.bgCard }}>
      <Ticket className="h-12 w-12 mx-auto mb-4" style={{ color: "hsl(201 100% 55%)" }} />
      <p className="text-lg font-light" style={{ color: C.text }}>
        Du har inga biljetter ännu.
      </p>
      <p className="text-sm mt-2 mb-6" style={{ color: C.textMuted }}>
        När du köpt en biljett dyker den upp här.
      </p>
      <Link
        to="/services/sportresor"
        className="inline-flex items-center gap-2 text-sm px-5 py-2 rounded-full"
        style={{ backgroundColor: "hsl(201 100% 45%)", color: "white" }}
      >
        Se evenemang <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const isFulfilled = order.status === "paid" || order.status === "fulfilled";
  const hasAnyTicketFile = order.order_items.some((it) =>
    it.ticket_deliveries?.some((d) => !!d.file_url),
  );
  const attempts = order.fulfillment_attempt_count ?? 0;
  const isPaidButPending = isFulfilled && !hasAnyTicketFile;
  // Friendly "tickets coming soon" while retry job is still working.
  const ticketsPending = isPaidButPending && attempts < FULFILLMENT_RETRY_MAX;
  // Hard failure - retry exhausted, ops needs to step in.
  const fulfillmentStuck = isPaidButPending && attempts >= FULFILLMENT_RETRY_MAX;
  const orderRef = order.invoice_number ?? order.id.slice(0, 8).toUpperCase();

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-20px_rgba(3,15,35,0.7)] relative overflow-hidden"
      style={{
        backgroundColor: C.bgCard,
        border: `1px solid ${C.bgCardBorder}`,
        boxShadow: "0 1px 0 hsl(210 30% 92% / 0.04) inset",
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background: `linear-gradient(to bottom, ${C.accent}, transparent)`,
          opacity: 0.8,
        }}
      />
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider" style={{ color: C.textMuted }}>
            Beställning {orderRef}
          </p>
          <p className="text-xs mt-1" style={{ color: C.textDim }}>
            {new Date(order.created_at).toLocaleDateString("sv-SE")}
          </p>
        </div>
        <span
          className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: C.accent, color: "white" }}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Status banner - calm while retry job works, warning only after retries exhausted */}
      {ticketsPending && (
        <div
          className="rounded-lg p-3 mb-3 flex items-start gap-2 text-xs"
          style={{ backgroundColor: "rgba(120, 180, 220, 0.12)", color: C.textMuted }}
        >
          <Ticket className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Betalningen är klar. Biljetterna släpps från arrangören närmare evenemanget - vi mejlar dig direkt när de finns att ladda ner.
          </span>
        </div>
      )}
      {fulfillmentStuck && (
        <div
          className="rounded-lg p-3 mb-3 flex items-start gap-2 text-xs"
          style={{ backgroundColor: "rgba(220, 150, 30, 0.15)", color: C.warning }}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Betalningen är genomförd men bokningen kräver manuell hantering. En konsult kontaktar dig.
          </span>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3 mb-3">
        {order.order_items.map((it) => (
          <ItemRow key={it.id} it={it} isFulfilled={isFulfilled && !fulfillmentStuck} />
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3 border-t"
        style={{ borderColor: C.bgCardBorder }}
      >
        <Link to={`/order/${order.id}`} className="text-xs underline" style={{ color: C.textMuted }}>
          Visa orderdetaljer
        </Link>
        <div className="text-right">
          <p className="text-lg" style={{ color: C.text }}>
            {formatSek(order.total_sek)}
          </p>
          {Number(order.refunded_sek ?? 0) > 0 && (
            <p className="text-xs" style={{ color: C.warning }}>
              Återbetalat: {formatSek(Number(order.refunded_sek))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemRow({ it, isFulfilled }: { it: OrderItem; isFulfilled: boolean }) {
  const headline =
    it.events.sport === "soccer"
      ? `${it.events.home_team} vs ${it.events.away_team}`
      : it.events.race_name;
  const fileRef = it.ticket_deliveries?.find((d) => d.file_url)?.file_url ?? null;
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (!fileRef) return;
    setBusy(true);
    try {
      const url = await resolveTicketUrl(fileRef);
      window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte öppna biljetten");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-sm flex items-start justify-between gap-4" style={{ color: C.text }}>
      <div className="min-w-0">
        <p>
          {headline} - {it.ticket_categories.name} × {it.qty}
        </p>
        <p className="text-xs" style={{ color: C.textDim }}>
          {formatEventDateTime(it.events.starts_at)} · {it.events.venue_name}
        </p>
      </div>
      {isFulfilled && fileRef ? (
        <Button size="sm" variant="outline" disabled={busy} onClick={handleDownload}>
          <Download className="h-3 w-3 mr-1" /> {busy ? "Öppnar..." : "Ladda ner"}
        </Button>
      ) : isFulfilled ? (
        <span
          className="text-[10px] uppercase tracking-wider flex-shrink-0"
          style={{ color: C.textDim }}
        >
          Skickas snart
        </span>
      ) : null}
    </div>
  );
}
