import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  Mail,
  Copy,
} from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { formatEventDateTime, formatSek } from "@/lib/formatSek";
import { resolveTicketUrl } from "@/lib/eticket";
import { toast } from "sonner";

type OrderRow = {
  id: string;
  status: string;
  total_sek: number;
  refunded_sek: number | null;
  customer_email: string;
  customer_name: string | null;
  user_id: string | null;
  invoice_number: string | null;
  quote_id: string | null;
  notes: string | null;
  created_at: string;
};

type ItemRow = {
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

type QuoteItemRow = {
  id: string;
  description: string;
  qty: number;
  unit_price_sek: number;
};

const TERMINAL_STATES = new Set(["paid", "fulfilled", "failed", "refunded", "cancelled"]);

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const justPaid = !!sessionId;
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !orderId) return;
    let cancelled = false;
    let attempts = 0;

    // Two load paths:
    //  - With session_id (right after Stripe redirect, possibly as a guest):
    //    use the public get_order_by_session RPC. SECURITY DEFINER bypasses
    //    RLS so guests can see their order before the auto-created Mitt
    //    Kaisen account is activated.
    //  - Without session_id (deep-link from Mitt Kaisen): authenticated user,
    //    standard RLS-gated table reads.
    const loadViaSession = async () => {
      const { data } = await (supabase as any).rpc("get_order_by_session", {
        p_order_id: orderId,
        p_session_id: sessionId,
      });
      if (cancelled) return;
      if (data) {
        const payload = data as {
          order: OrderRow;
          items: ItemRow[];
          quote_items: QuoteItemRow[];
        };
        setOrder(payload.order);
        setItems(payload.items ?? []);
        setQuoteItems(payload.quote_items ?? []);
      }
    };

    const loadViaAuth = async () => {
      const [{ data: o }, { data: its }] = await Promise.all([
        (supabase as any)
          .from("orders")
          .select(
            "id, status, total_sek, refunded_sek, customer_email, customer_name, user_id, invoice_number, quote_id, notes, created_at",
          )
          .eq("id", orderId)
          .maybeSingle(),
        supabase
          .from("order_items")
          .select(
            "id, qty, unit_price_sek, events(sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(name), ticket_deliveries(file_url, delivered_at)",
          )
          .eq("order_id", orderId),
      ]);
      if (cancelled) return;
      const orderRow = o as OrderRow | null;
      setOrder(orderRow);
      setItems((its as unknown as ItemRow[]) ?? []);
      if (orderRow?.quote_id) {
        const { data: qits } = await (supabase as any)
          .from("quote_items")
          .select("id, description, qty, unit_price_sek")
          .eq("quote_id", orderRow.quote_id)
          .order("sort_order");
        if (!cancelled) setQuoteItems((qits as QuoteItemRow[]) ?? []);
      }
    };

    const load = async () => {
      if (sessionId) {
        await loadViaSession();
      } else {
        await loadViaAuth();
      }
      if (cancelled) return;
      setLoading(false);

      // Webhook may not have updated status by the time of the Stripe redirect.
      // Read latest order from local state and retry until terminal.
      setOrder((current) => {
        if (
          justPaid &&
          current?.status &&
          !TERMINAL_STATES.has(current.status) &&
          attempts < 6
        ) {
          attempts += 1;
          setTimeout(load, 1500);
        }
        return current;
      });
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, sessionId, justPaid, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">
          Laddar...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display text-4xl mb-4">Beställningen hittades inte</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Är du inloggad med samma konto som lade beställningen? Annars - kontrollera länken i orderbekräftelsen i din e-post.
          </p>
          <Link to="/">
            <Button className="rounded-full">Till startsidan</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isPaid = order.status === "paid" || order.status === "fulfilled";
  const isPending = order.status === "pending" || order.status === "awaiting_payment";
  const confirmFailed = !!(order.notes && order.notes.startsWith("supplier confirm failed"));
  const isGuest = !order.user_id || !user;
  const orderRef = order.invoice_number ?? order.id.slice(0, 8).toUpperCase();
  const isQuote = !!order.quote_id;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          {confirmFailed ? (
            <AlertTriangle className="h-14 w-14 text-amber-600 mx-auto mb-4" />
          ) : isPaid ? (
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
          ) : (
            <Clock className="h-14 w-14 text-primary mx-auto mb-4" />
          )}
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
            {confirmFailed
              ? "Betalningen mottagen"
              : isPaid
              ? "Tack för din beställning"
              : isPending
              ? "Beställning pågående"
              : "Beställning"}
          </p>
          <h1 className="font-display text-4xl md:text-5xl mb-3">
            Beställning {orderRef}
          </h1>
          <p className="text-muted-foreground text-sm">
            {confirmFailed
              ? "Vi har tagit emot din betalning. En av våra konsulter slutför bokningen manuellt och hör av sig inom 24 timmar."
              : isPaid && isQuote
              ? "Betalningen är genomförd. En av våra konsulter återkommer inom 24 timmar med detaljer för din resa."
              : isPaid
              ? "Betalningen är genomförd. Dina biljetter ligger på Mina biljetter."
              : justPaid
              ? "Betalningen behandlas. Statusen uppdateras automatiskt."
              : "Vi återkommer med betalningslänk. Du kan följa statusen i Mitt Kaisen."}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          {/* Items + total */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            {isQuote
              ? quoteItems.map((qi) => <QuoteItemBlock key={qi.id} qi={qi} />)
              : items.map((it) => (
                  <ItemBlock key={it.id} it={it} isPaid={isPaid && !confirmFailed} />
                ))}
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <span className="font-medium">Totalt</span>
              <span className="font-display text-2xl">{formatSek(order.total_sek)}</span>
            </div>
            {Number(order.refunded_sek ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm text-amber-700 -mt-2">
                <span>Återbetalat</span>
                <span>−{formatSek(Number(order.refunded_sek))}</span>
              </div>
            )}
          </div>

          {/* Guest signup CTA */}
          {isGuest && isPaid && (
            <div className="rounded-xl border border-border bg-accent/30 p-5 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Vi har skickat dig en länk för att aktivera ditt Mitt Kaisen-konto</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Kolla din inkorg (även skräppost) på <span className="font-mono">{order.customer_email}</span>. När du har satt ditt lösenord hittar du dina biljetter på Mitt Kaisen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reference info */}
          <div className="rounded-xl border border-border bg-card p-5 text-sm">
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
              Vid kontakt med support
            </p>
            <ReferenceRow label="Order-ID" value={order.id} mono />
            {order.invoice_number && <ReferenceRow label="Fakturanummer" value={order.invoice_number} />}
            <ReferenceRow label="E-post" value={order.customer_email} />
            <p className="text-xs text-muted-foreground mt-4">
              Frågor? Mejla <a href="mailto:info@kaisengroup.se" className="underline">info@kaisengroup.se</a> och ange order-ID.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            {!isGuest && !isQuote && (
              <Link to="/mitt-kaisen/biljetter">
                <Button className="rounded-full bg-primary hover:bg-primary/90">
                  <Download className="mr-2 h-4 w-4" /> Mina biljetter
                </Button>
              </Link>
            )}
            <Link to={isQuote ? "/" : "/services/sportresor"}>
              <Button variant="outline" className="rounded-full">
                {isQuote ? "Till startsidan" : "Fler evenemang"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ItemBlock({ it, isPaid }: { it: ItemRow; isPaid: boolean }) {
  const headline =
    it.events.sport === "soccer"
      ? `${it.events.home_team} vs ${it.events.away_team}`
      : it.events.race_name;
  const delivery = it.ticket_deliveries?.find((d) => d.file_url);
  const fileRef = delivery?.file_url ?? null;
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
    <div className="text-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">{headline}</p>
          <p className="text-xs text-muted-foreground">
            {formatEventDateTime(it.events.starts_at)}
          </p>
          <p className="text-xs text-muted-foreground">
            {it.events.venue_name}
            {it.events.city ? `, ${it.events.city}` : ""}
          </p>
        </div>
        <span className="text-sm flex-shrink-0">
          {formatSek(Number(it.unit_price_sek) * it.qty)}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2 gap-3">
        <span className="text-xs text-muted-foreground">
          {it.ticket_categories.name} × {it.qty}
        </span>
        {isPaid && fileRef ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={handleDownload}>
            <Download className="h-3 w-3 mr-1" /> {busy ? "Öppnar..." : "Ladda ner"}
          </Button>
        ) : isPaid ? (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Skickas snart
          </span>
        ) : null}
      </div>
    </div>
  );
}

function QuoteItemBlock({ qi }: { qi: QuoteItemRow }) {
  return (
    <div className="text-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">{qi.description}</p>
          <p className="text-xs text-muted-foreground">
            {qi.qty} × {formatSek(Number(qi.unit_price_sek))}
          </p>
        </div>
        <span className="text-sm flex-shrink-0">
          {formatSek(Number(qi.unit_price_sek) * qi.qty)}
        </span>
      </div>
    </div>
  );
}

function ReferenceRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const copy = () => {
    navigator.clipboard.writeText(value).then(
      () => toast.success("Kopierat"),
      () => toast.error("Kunde inte kopiera"),
    );
  };
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-xs truncate ${mono ? "font-mono" : ""}`}>{value}</span>
        <button onClick={copy} className="text-muted-foreground hover:text-foreground flex-shrink-0">
          <Copy className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
