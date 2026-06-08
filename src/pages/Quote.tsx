import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, ShieldCheck, CreditCard } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { formatSek } from "@/lib/formatSek";

type QuoteItem = {
  id: string;
  description: string;
  qty: number;
  unit_price_sek: number;
  sort_order: number;
};

type Quote = {
  id: string;
  public_token: string;
  customer_email: string;
  customer_name: string | null;
  title: string;
  intro_message: string | null;
  total_sek: number;
  currency: string;
  status: "sent" | "accepted" | "expired" | "cancelled" | "draft";
  expires_at: string;
  sent_at: string | null;
  accepted_at: string | null;
  order_id: string | null;
  items: QuoteItem[];
};

export default function QuotePage() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      // Cast to any: the get_quote_by_token RPC ships with the quotes
      // migration and isn't in generated types until those are regen'd.
      const { data, error } = await (supabase as any).rpc("get_quote_by_token", { p_token: token });
      if (error) {
        toast.error("Kunde inte hämta offerten");
      } else if (data) {
        setQuote(data as unknown as Quote);
      }
      setLoading(false);
    })();
  }, [token]);

  const isAccepted = quote?.status === "accepted";
  const isCancelled = quote?.status === "cancelled";
  const isExpired =
    quote?.status === "expired" ||
    (!!quote && new Date(quote.expires_at).getTime() < Date.now() && quote.status === "sent");
  const isPayable = quote?.status === "sent" && !isExpired;

  const handlePay = async () => {
    if (!quote) return;
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-quote-checkout", {
        body: {
          public_token: quote.public_token,
          environment: getStripeEnvironment(),
          returnBase: window.location.origin,
        },
      });
      if (error || !data?.clientSecret || !data?.orderId) {
        throw new Error(error?.message ?? data?.error ?? "Kunde inte starta betalning");
      }
      setOrderId(data.orderId);
      setShowCheckout(true);
    } catch (e: any) {
      toast.error(e.message ?? "Något gick fel");
    } finally {
      setStarting(false);
    }
  };

  const fetchClientSecret = async (): Promise<string> => {
    if (!quote || !orderId) throw new Error("Saknar order");
    // Re-call to ensure freshness if EmbeddedCheckout re-mounts
    const { data, error } = await supabase.functions.invoke("create-quote-checkout", {
      body: {
        public_token: quote.public_token,
        environment: getStripeEnvironment(),
        returnBase: window.location.origin,
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message ?? "Kunde inte starta betalning");
    }
    return data.clientSecret as string;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">
          Laddar offerten...
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center max-w-lg">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-3xl mb-3">Offerten hittades inte</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Länken kan vara felaktig eller offerten är inte längre aktiv. Kontakta oss om du tror att det är fel.
          </p>
          <Link to="/">
            <Button className="rounded-full">Till startsidan</Button>
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

      {/* Hero */}
      <section className="bg-cream py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans text-center">
            Offert från Kaisen Travel Group
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-center mb-4">{quote.title}</h1>
          {quote.intro_message && (
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap text-center">
              {quote.intro_message}
            </p>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          {/* Status banner */}
          {isAccepted && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-medium mb-1">Offerten är betald.</p>
                <p className="text-xs">
                  En av våra konsulter återkommer inom 24 timmar med detaljer. Du hittar
                  också din orderbekräftelse under{" "}
                  {quote.order_id ? (
                    <Link to={`/order/${quote.order_id}`} className="underline">
                      Beställning {quote.order_id.slice(0, 8).toUpperCase()}
                    </Link>
                  ) : (
                    "Mitt Kaisen"
                  )}
                  .
                </p>
              </div>
            </div>
          )}
          {isExpired && !isAccepted && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-medium mb-1">Offerten har gått ut.</p>
                <p className="text-xs">
                  Kontakta oss på{" "}
                  <a href="mailto:info@kaisengroup.se" className="underline">
                    info@kaisengroup.se
                  </a>{" "}
                  så skickar vi en ny.
                </p>
              </div>
            </div>
          )}
          {isCancelled && (
            <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm">
              Den här offerten är avbruten.
            </div>
          )}

          {/* Items */}
          {!showCheckout && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              {quote.items.map((it) => (
                <div key={it.id} className="flex items-start justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{it.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.qty} × {formatSek(Number(it.unit_price_sek))}
                    </p>
                  </div>
                  <span className="text-sm flex-shrink-0">
                    {formatSek(Number(it.unit_price_sek) * it.qty)}
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="font-medium">Totalt</span>
                <span className="font-display text-2xl">{formatSek(Number(quote.total_sek))}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Offerten gäller till och med{" "}
                {new Date(quote.expires_at).toLocaleDateString("sv-SE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                .
              </p>
            </div>
          )}

          {/* Pay button */}
          {isPayable && !showCheckout && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl mb-2">Acceptera och betala</h2>
              <p className="text-xs text-muted-foreground mb-5">
                Säker betalning hanteras av Stripe. Kaisen Travel Group är säljare och fakturautställare.
              </p>
              <div className="flex items-start gap-3 bg-accent/40 rounded-lg p-3 mb-5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Betalning bekräftar att du accepterar offerten.</span>
              </div>
              <Button
                onClick={handlePay}
                disabled={starting}
                className="w-full rounded-full bg-primary hover:bg-primary/90 tracking-wider text-sm"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {starting ? "Förbereder..." : `Betala ${formatSek(Number(quote.total_sek))}`}
              </Button>
            </div>
          )}

          {/* Embedded Stripe */}
          {showCheckout && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl mb-4">Betala säkert med Stripe</h2>
              <div id="checkout">
                <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
