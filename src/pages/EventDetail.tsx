import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calendar, MapPin, Minus, Plus, Ticket, Users } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { formatEventDateTime, formatSek } from "@/lib/formatSek";

type EventRow = {
  id: string;
  sport: "soccer" | "formula1";
  tournament_name: string;
  home_team: string | null;
  away_team: string | null;
  race_name: string | null;
  venue_name: string | null;
  city: string | null;
  country: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_image_url: string | null;
  description: string | null;
  status: string;
};

type CategoryRow = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  party_size_together: number;
  unit_price_sek: number;
  currency: string;
  qty_available: number;
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [qty, setQty] = useState(2);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: ev }, { data: cats }] = await Promise.all([
        supabase.from("events").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("ticket_categories")
          .select("*")
          .eq("event_id", id)
          .order("unit_price_sek", { ascending: true }),
      ]);
      setEvent(ev as EventRow | null);
      setCategories((cats as CategoryRow[]) ?? []);
      if (cats && cats.length) setSelectedCatId((cats[0] as CategoryRow).id);
      setLoading(false);
    })();
  }, [id]);

  const selectedCat = useMemo(
    () => categories.find((c) => c.id === selectedCatId) ?? null,
    [categories, selectedCatId],
  );
  const total = selectedCat ? Number(selectedCat.unit_price_sek) * qty : 0;

  const handleCheckout = async () => {
    if (!event || !selectedCat) return;
    if (!user) {
      toast.info("Logga in för att fortsätta till kassan");
      navigate("/mitt-kaisen");
      return;
    }
    setBusy(true);
    try {
      const { data: orderId, error } = await supabase.rpc("create_order_with_items", {
        p_event_id: event.id,
        p_category_id: selectedCat.id,
        p_qty: qty,
        p_customer_email: user.email ?? "",
      });
      if (error || !orderId) throw error ?? new Error("Kunde inte skapa order");
      navigate(`/checkout/${orderId}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Något gick fel");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">
          Laddar evenemang...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display text-4xl mb-4">Evenemanget hittades inte</h1>
          <Link to="/services/sportresor">
            <Button className="rounded-full">Tillbaka till Sportresor</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const headline =
    event.sport === "soccer"
      ? `${event.home_team} vs ${event.away_team}`
      : event.race_name;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[400px] flex items-end">
        <div className="absolute inset-0">
          {event.cover_image_url && (
            <img
              src={event.cover_image_url}
              alt={headline ?? ""}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
            {event.tournament_name}
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white mb-3">
            {headline}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80 text-sm">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {formatEventDateTime(event.starts_at)}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {event.venue_name}
              {event.city ? `, ${event.city}` : ""}
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-10 max-w-6xl">
          {/* Left */}
          <div className="lg:col-span-2 space-y-10">
            {event.description && (
              <div>
                <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
                  Om evenemanget
                </p>
                <p className="text-foreground/80 leading-relaxed text-base">
                  {event.description}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
                Vad ingår
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  "E-biljetter levereras digitalt",
                  "Personlig support från Kaisen",
                  "Trygg betalning via Stripe",
                  "Faktura och kvitto i Mitt Kaisen",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 bg-card border border-border rounded-lg p-3">
                    <Ticket className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
                Välj biljettkategori
              </p>
              <div className="space-y-3">
                {categories.map((c) => {
                  const selected = c.id === selectedCatId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCatId(c.id)}
                      className={`w-full text-left rounded-lg border p-4 transition-colors ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{c.name}</p>
                          {c.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {c.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Sittning ihop: upp till {c.party_size_together} pers
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-xl">
                            {formatSek(c.unit_price_sek)}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            per biljett
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — sticky summary */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
                Din beställning
              </p>
              <p className="font-display text-2xl mb-1">{headline}</p>
              <p className="text-xs text-muted-foreground mb-5">
                {formatEventDateTime(event.starts_at)}
              </p>

              {selectedCat ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm">{selectedCat.name}</span>
                    <span className="text-sm">{formatSek(selectedCat.unit_price_sek)}</span>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm">Antal</span>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center">{qty}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() =>
                          setQty((q) => Math.min(selectedCat.qty_available, q + 1))
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4 mb-6">
                    <span className="font-medium">Totalt</span>
                    <span className="font-display text-2xl">{formatSek(total)}</span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={busy}
                    className="w-full rounded-full bg-primary hover:bg-primary/90 tracking-wider text-sm"
                  >
                    {busy ? "Skapar..." : "Till kassan"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center mt-3">
                    Säker betalning via Stripe. Kaisen är säljare och fakturautställare.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Inga biljetter tillgängliga.</p>
              )}
            </div>

            <Link
              to="/services/sportresor"
              className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Tillbaka till Sportresor
            </Link>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
}
