import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { formatEventDateTime, formatSek } from "@/lib/formatSek";

type OrderRow = {
  id: string;
  user_id: string | null;
  status: string;
  total_sek: number;
  currency: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  xs2_reservation_id: string | null;
  reservation_expires_at: string | null;
};

type ItemRow = {
  id: string;
  qty: number;
  unit_price_sek: number;
  events: {
    id: string;
    sport: string;
    tournament_name: string;
    home_team: string | null;
    away_team: string | null;
    race_name: string | null;
    venue_name: string | null;
    city: string | null;
    starts_at: string;
  };
  ticket_categories: { id: string; name: string };
};

export default function Checkout() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!orderId) return;
    (async () => {
      const [{ data: o }, { data: its }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
        supabase
          .from("order_items")
          .select(
            "id, qty, unit_price_sek, events(id, sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(id, name)",
          )
          .eq("order_id", orderId),
      ]);
      setOrder(o as unknown as OrderRow | null);
      setItems((its as unknown as ItemRow[]) ?? []);
      if (o) {
        setEmail((o as unknown as OrderRow).customer_email ?? user?.email ?? "");
        setName((o as unknown as OrderRow).customer_name ?? "");
        setPhone((o as unknown as OrderRow).customer_phone ?? "");
      }
      setLoading(false);
    })();
  }, [orderId, user, authLoading, navigate]);

  // Reservation hold countdown — xs2 holds tickets for 10 minutes. Refuse to
  // start payment once expired; nudge the user back to the event page.
  useEffect(() => {
    if (!order?.reservation_expires_at) return;
    const tick = () => {
      const ms = new Date(order.reservation_expires_at!).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const handle = setInterval(tick, 1000);
    return () => clearInterval(handle);
  }, [order?.reservation_expires_at]);

  const reservationExpired = secondsLeft !== null && secondsLeft <= 0;
  const formattedHold =
    secondsLeft == null
      ? null
      : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const handleRenew = async () => {
    if (!order) return;
    setRenewing(true);
    try {
      const { data, error } = await supabase.functions.invoke("xs2-renew-reservation", {
        body: { order_id: order.id },
      });
      if (error || (data as any)?.error) {
        const eventId = items[0]?.events?.id;
        toast.error(
          (data as any)?.error ?? error?.message ?? "Kunde inte förnya reservationen",
        );
        if (eventId) navigate(`/sport/event/${eventId}`);
        return;
      }
      // Refresh the order so the countdown picks up the new expires_at.
      const { data: o } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order.id)
        .maybeSingle();
      if (o) setOrder(o as unknown as OrderRow);
      if ((data as any)?.price_changed) {
        toast.warning("Priset har ändrats — granska summan innan du betalar.");
        // Reload items so the right-column summary shows the new prices
        const { data: its } = await supabase
          .from("order_items")
          .select(
            "id, qty, unit_price_sek, events(id, sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(id, name)",
          )
          .eq("order_id", order.id);
        setItems((its as unknown as ItemRow[]) ?? []);
      } else {
        toast.success("Reservationen är förnyad — 10 nya minuter.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte förnya reservationen");
    } finally {
      setRenewing(false);
    }
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (reservationExpired) {
      toast.error("Reservationen har gått ut — gå tillbaka och välj biljetter igen.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
        })
        .eq("id", order.id);
      if (error) throw error;
      setShowCheckout(true);
    } catch (err: any) {
      toast.error(err.message ?? "Något gick fel");
      setSubmitting(false);
    }
  };

  const fetchClientSecret = async (): Promise<string> => {
    const returnUrl = `${window.location.origin}/order/${order!.id}?session_id={CHECKOUT_SESSION_ID}`;
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { orderId: order!.id, environment: getStripeEnvironment(), returnUrl },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Kunde inte starta betalningen");
    }
    return data.clientSecret as string;
  };

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
          <Link to="/services/sportresor">
            <Button className="rounded-full">Tillbaka</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <Navbar />
      <section className="bg-cream py-12">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
            Kassan
          </p>
          <h1 className="font-display text-4xl md:text-5xl">Slutför din beställning</h1>
        </div>
      </section>

      {order?.reservation_expires_at && (
        <div
          className={`border-b ${
            reservationExpired
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="container mx-auto px-4 py-3 text-sm text-center font-medium flex items-center justify-center gap-3 flex-wrap">
            {reservationExpired ? (
              <>
                <span>Reservationen har gått ut.</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={renewing}
                  onClick={handleRenew}
                >
                  {renewing ? "Förnyar..." : "Reservera om"}
                </Button>
              </>
            ) : (
              <span>
                Biljetterna är reserverade i {formattedHold} — slutför betalningen innan dess.
              </span>
            )}
          </div>
        </div>
      )}

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-5xl grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {!showCheckout ? (
              <form onSubmit={handleStartPayment} className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-display text-2xl mb-1">Kontaktuppgifter</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Vi skickar biljetter och kvitto till din e-post.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Namn</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="email">E-post</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-display text-2xl mb-1">Betalning</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Säker betalning hanteras av Stripe. Du kan betala med kort eller annan tillgänglig betalmetod.
                  </p>
                  <div className="flex items-start gap-3 bg-accent/40 rounded-lg p-4 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Säljare och fakturautställare: Kaisen Travel Group.</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-6 rounded-full bg-primary hover:bg-primary/90 tracking-wider text-sm"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {submitting ? "Förbereder..." : `Gå till betalning (${formatSek(order.total_sek)})`}
                  </Button>
                </div>

                <Link
                  to="/services/sportresor"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" /> Fortsätt handla
                </Link>
              </form>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display text-2xl mb-4">Betala säkert med Stripe</h2>
                <div id="checkout">
                  <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="rounded-xl border border-border bg-card p-6 h-fit">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">
              Sammanfattning
            </p>
            <div className="space-y-5">
              {items.map((it) => {
                const headline =
                  it.events.sport === "soccer"
                    ? `${it.events.home_team} vs ${it.events.away_team}`
                    : it.events.race_name;
                return (
                  <div key={it.id} className="text-sm">
                    <p className="font-medium">{headline}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDateTime(it.events.starts_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {it.events.venue_name}
                      {it.events.city ? `, ${it.events.city}` : ""}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs">
                        {it.ticket_categories.name} × {it.qty}
                      </span>
                      <span className="text-sm">
                        {formatSek(Number(it.unit_price_sek) * it.qty)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border mt-6 pt-4 flex items-center justify-between">
              <span className="font-medium">Totalt</span>
              <span className="font-display text-2xl">{formatSek(order.total_sek)}</span>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
}
