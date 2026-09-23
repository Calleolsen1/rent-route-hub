import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { usePublicPricesEnabled } from "@/hooks/usePublicPrices";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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
  ticket_categories: { id: string; name: string; description: string | null };
};

type CheckoutPayload = {
  order: OrderRow;
  items: ItemRow[];
  hold_expires_at: string | null;
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
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { enabled: pricesPublic, loading: flagLoading } = usePublicPricesEnabled();
  const { isAdmin, loading: roleLoading } = useUserRole();
  // Admins can go through the whole purchase while the shop is closed, to
  // test it with Stripe's test mode and the supplier sandbox.
  const sellingEnabled = pricesPublic || isAdmin;

  useEffect(() => {
    if (authLoading) return;
    if (!orderId) return;
    (async () => {
      // One order by its exact id, through a database function: guests can't
      // read the orders table directly (that used to expose every order).
      const { data } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
      }).rpc("get_checkout_order", { p_order_id: orderId });
      const payload = data as CheckoutPayload | null;
      setOrder(payload?.order ?? null);
      setItems(payload?.items ?? []);
      if (payload?.order) {
        setEmail(payload.order.customer_email || user?.email || "");
        setName(payload.order.customer_name ?? "");
        setPhone(payload.order.customer_phone ?? "");
      }
      setLoading(false);
    })();
  }, [orderId, user, authLoading, navigate]);

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmitting(true);
    try {
      const { data: saved, error } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
      }).rpc("set_checkout_contact", {
        p_order_id: order.id,
        p_name: name,
        p_email: email,
        p_phone: phone,
      });
      if (error) throw new Error(error.message);
      if (saved !== true) throw new Error("Beställningen kan inte längre ändras");
      setShowCheckout(true);
    } catch (err) {
      toast.error((err as Error).message ?? "Något gick fel");
      setSubmitting(false);
    }
  };

  const fetchClientSecret = async (): Promise<string> => {
    const returnUrl = `${window.location.origin}/order/${order!.id}?session_id={CHECKOUT_SESSION_ID}`;
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { orderId: order!.id, environment: getStripeEnvironment(), returnUrl },
    });
    if (error || !data?.clientSecret) {
      // Sold out / price changed come back as 409 with a customer-readable
      // message in the body; supabase-js hides that behind error.context.
      let message = "Kunde inte starta betalningen";
      try {
        const parsed = await (error as { context?: Response })?.context?.json();
        if (parsed?.error) message = parsed.error;
      } catch {
        /* keep the generic message */
      }
      setShowCheckout(false);
      setSubmitting(false);
      setPaymentError(message);
      throw new Error(message);
    }
    return data.clientSecret as string;
  };

  // Selling is off — the site takes requests instead. No order can be created
  // in this state, so anyone landing here has a stale link; show the enquiry
  // route rather than a payment page with prices on it.
  if (!flagLoading && !roleLoading && !sellingEnabled) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center max-w-lg">
          <h1 className="font-display text-3xl mb-4">Bokning sker via förfrågan</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Vi tar inte betalt online just nu. Skicka en förfrågan så återkommer vi
            med pris och tillgänglighet för hotell, biljett och flyg.
          </p>
          <Link to="/contact">
            <Button className="rounded-full">Skicka förfrågan</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

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
          <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans">
            Kassan
          </p>
          <h1 className="font-display text-4xl md:text-5xl">Slutför din beställning</h1>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-5xl grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {paymentError && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
                <p>{paymentError}</p>
                {items[0]?.events?.id && (
                  <Link to={`/sport/event/${items[0].events.id}`} className="mt-2 inline-block underline">
                    Tillbaka till matchen
                  </Link>
                )}
              </div>
            )}
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
            <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">
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
                        {it.ticket_categories.description && (
                          <span className="block text-muted-foreground">{it.ticket_categories.description}</span>
                        )}
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
