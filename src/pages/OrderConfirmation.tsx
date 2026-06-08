import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Clock, Download } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { formatEventDateTime, formatSek } from "@/lib/formatSek";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || !orderId) return;
    (async () => {
      const [{ data: o }, { data: its }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
        supabase
          .from("order_items")
          .select(
            "id, qty, unit_price_sek, events(sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(name)",
          )
          .eq("order_id", orderId),
      ]);
      setOrder(o);
      setItems(its ?? []);
      setLoading(false);
    })();
  }, [orderId, user, authLoading]);

  if (loading || !order) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">
          Laddar...
        </div>
      </div>
    );
  }

  const isPaid = order.status === "paid" || order.status === "fulfilled";

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          {isPaid ? (
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
          ) : (
            <Clock className="h-14 w-14 text-primary mx-auto mb-4" />
          )}
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
            {isPaid ? "Tack för din beställning" : "Beställning pågående"}
          </p>
          <h1 className="font-display text-4xl md:text-5xl mb-3">
            Beställning #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isPaid
              ? "Dina biljetter dyker upp under Mina biljetter inom kort."
              : "Vi återkommer med betalningslänk. Du kan följa statusen i Mitt Kaisen."}
          </p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
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
                    <span>{formatSek(Number(it.unit_price_sek) * it.qty)}</span>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <span className="font-medium">Totalt</span>
              <span className="font-display text-2xl">{formatSek(order.total_sek)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link to="/mitt-kaisen/biljetter">
              <Button className="rounded-full bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" /> Mina biljetter
              </Button>
            </Link>
            <Link to="/services/sportresor">
              <Button variant="outline" className="rounded-full">
                Fler evenemang <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
