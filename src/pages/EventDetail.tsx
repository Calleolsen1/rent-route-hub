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
import { getStripeEnvironment } from "@/lib/stripe";
import { usePageMeta } from "@/lib/usePageMeta";
import { PriceTag, resolveCompareAt } from "@/components/PriceTag";

type EventRow = {
  id: string;
  source: string;
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
  min_price_sek: number | null;
  compare_at_price_sek: number | null;
  compare_at_pct: number | null;
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
  compare_at_price_sek: number | null;
  compare_at_pct: number | null;
};

type ReserveLine = {
  ticket_id: string;
  net_rate: number;
  currency_code: string;
  stock: number;
};

type Xs2Group = {
  category_id: string;
  external_category_id: string;
  external_sub_category: string;
  name: string;
  description: string | null;
  party_size_together: number;
  total_stock: number;
  base_sek: number;
  final_sek: number;
  currency: string;
  reserve_lines: ReserveLine[];
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [xs2Groups, setXs2Groups] = useState<Xs2Group[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [qty, setQty] = useState(2);
  const [busy, setBusy] = useState(false);
  const [compareAtDefaultPct, setCompareAtDefaultPct] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).rpc("get_platform_decimal", {
        p_key: "compare_at_default_pct",
        p_default: 0,
      });
      setCompareAtDefaultPct(Number(data ?? 0));
    })();
  }, []);

  const isXs2 = event?.source === "xs2event";

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setEvent(ev as EventRow | null);

      if ((ev as EventRow | null)?.source === "xs2event") {
        // Live lookup against xs2event (with markup applied)
        try {
          const { data: r } = await supabase.functions.invoke("xs2-get-event-tickets", {
            body: { event_id: id },
          });
          const groups = (r?.groups as Xs2Group[]) ?? [];
          setXs2Groups(groups);
          if (groups.length) setSelectedCatId(groups[0].category_id);
        } catch (e) {
          console.error("xs2 tickets fetch failed", e);
        } finally {
          setPricesLoading(false);
          setLoading(false);
        }
        return;
      }

      // Non-xs2 path (manual/Stripe-product inventory) — unchanged
      const { data: cats } = await supabase
        .from("ticket_categories")
        .select("*")
        .eq("event_id", id)
        .order("unit_price_sek", { ascending: true });
      setCategories((cats as CategoryRow[]) ?? []);
      if (cats && cats.length) setSelectedCatId((cats[0] as CategoryRow).id);
      setLoading(false);

      if (cats && cats.length) {
        try {
          const { data: pr } = await supabase.functions.invoke("get-ticket-prices", {
            body: { event_id: id, environment: getStripeEnvironment() },
          });
          const map: Record<string, number> = {};
          for (const p of (pr?.prices ?? [])) map[p.category_id] = p.final_sek;
          setLivePrices(map);
        } catch (e) {
          console.error("price fetch failed", e);
        } finally {
          setPricesLoading(false);
        }
      } else {
        setPricesLoading(false);
      }
    })();
  }, [id]);

  // Build the page-meta title from whichever event data is available; the
  // hook re-runs when event loads and overwrites with the real title.
  const metaTitle = event
    ? `${event.sport === "soccer" ? `${event.home_team} vs ${event.away_team}` : event.race_name ?? event.tournament_name} — Kaisen Travel Group`
    : "Evenemang — Kaisen Travel Group";
  usePageMeta({
    title: metaTitle,
    description: event?.description
      ? event.description.slice(0, 160)
      : "Köp biljetter via Kaisen Travel Group — säker betalning, personlig service.",
    image: event?.cover_image_url ?? undefined,
    type: "article",
  });

  const priceFor = (c: CategoryRow) => livePrices[c.id] ?? Number(c.unit_price_sek);

  // Unified view for the picker — both paths produce { id, name, description,
  // party_size_together, price, available }
  const pickerOptions = useMemo(() => {
    if (isXs2) {
      return xs2Groups.map((g) => ({
        id: g.category_id,
        name: g.name,
        description: g.description,
        party_size_together: g.party_size_together,
        price: g.final_sek,
        available: g.total_stock,
        group: g,
        cat: null as CategoryRow | null,
      }));
    }
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      party_size_together: c.party_size_together,
      price: priceFor(c),
      available: c.qty_available,
      group: null as Xs2Group | null,
      cat: c,
    }));
  }, [isXs2, xs2Groups, categories, livePrices]);

  const selected = useMemo(
    () => pickerOptions.find((o) => o.id === selectedCatId) ?? null,
    [pickerOptions, selectedCatId],
  );
  const total = selected ? selected.price * qty : 0;

  const handleCheckout = async () => {
    if (!event || !selected) return;
    setBusy(true);
    try {
      if (selected.price <= 0) throw new Error("Pris ej tillgängligt");

      if (isXs2 && selected.group) {
        const g = selected.group;
        const { data, error } = await supabase.functions.invoke("xs2-reserve", {
          body: {
            event_id: event.id,
            qty,
            reserve_lines: g.reserve_lines,
            external_category_id: g.external_category_id,
            external_sub_category: g.external_sub_category,
            customer_email: user?.email ?? "",
          },
        });
        if (error || !data?.order_id) {
          throw new Error(error?.message ?? "Kunde inte reservera biljetter");
        }
        navigate(`/checkout/${data.order_id}`);
        return;
      }

      // Non-xs2 fallback path
      const { data: orderId, error } = await supabase.rpc("create_order_with_items", {
        p_event_id: event.id,
        p_category_id: selected.id,
        p_qty: qty,
        p_unit_price_sek: selected.price,
        p_customer_email: user?.email ?? "",
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
      <section className="relative h-[28vh] min-h-[200px] flex items-end">
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
        <div className="relative container mx-auto px-4 pb-6">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-2 font-sans">
            {event.tournament_name}
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
            {headline}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-white/80 text-sm">
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
      <section className="py-6 md:py-8 bg-background">

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
                {pickerOptions.map((o) => {
                  const isSel = o.id === selectedCatId;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelectedCatId(o.id)}
                      className={`w-full text-left rounded-lg border p-4 transition-colors ${
                        isSel
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{o.name}</p>
                          {o.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {o.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Sittning ihop: upp till {o.party_size_together} pers
                          </p>
                        </div>
                        <div className="text-right">
                          {pricesLoading ? (
                            <p className="font-display text-xl">…</p>
                          ) : (
                            <PriceTag
                              currentSek={o.price}
                              compareAt={{
                                categorySek: o.cat?.compare_at_price_sek,
                                categoryPct: o.cat?.compare_at_pct,
                                eventSek: event.compare_at_price_sek,
                                eventPct: event.compare_at_pct,
                                defaultPct: compareAtDefaultPct,
                              }}
                              showFrom={false}
                            />
                          )}
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
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

              {selected ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm">{selected.name}</span>
                    <span className="text-sm">
                      {pricesLoading ? (
                        "…"
                      ) : (
                        (() => {
                          const compare = resolveCompareAt(selected.price, {
                            categorySek: selected.cat?.compare_at_price_sek,
                            categoryPct: selected.cat?.compare_at_pct,
                            eventSek: event.compare_at_price_sek,
                            eventPct: event.compare_at_pct,
                            defaultPct: compareAtDefaultPct,
                          });
                          return compare ? (
                            <>
                              <span className="text-foreground/40 line-through mr-1.5">{formatSek(compare)}</span>
                              <span className="font-medium">{formatSek(selected.price)}</span>
                            </>
                          ) : (
                            <>{formatSek(selected.price)}</>
                          );
                        })()
                      )}
                    </span>
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
                          setQty((q) => Math.min(selected.available, q + 1))
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4 mb-6">
                    <span className="font-medium">Totalt</span>
                    {(() => {
                      const compare = resolveCompareAt(total, {
                        categorySek: selected.cat?.compare_at_price_sek != null
                          ? Number(selected.cat.compare_at_price_sek) * qty
                          : null,
                        categoryPct: selected.cat?.compare_at_pct,
                        eventSek: event.compare_at_price_sek != null
                          ? Number(event.compare_at_price_sek) * qty
                          : null,
                        eventPct: event.compare_at_pct,
                        defaultPct: compareAtDefaultPct,
                      });
                      return compare ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-base text-foreground/40 line-through">{formatSek(compare)}</span>
                          <span className="font-display text-2xl">{formatSek(total)}</span>
                        </div>
                      ) : (
                        <span className="font-display text-2xl">{formatSek(total)}</span>
                      );
                    })()}
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={busy}
                    className="w-full rounded-full bg-primary hover:bg-primary/90 tracking-wider text-sm"
                  >
                    {busy ? (isXs2 ? "Reserverar..." : "Skapar...") : "Till kassan"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center mt-3">
                    {isXs2
                      ? "Biljetterna reserveras i 10 minuter när du går till kassan."
                      : "Säker betalning via Stripe. Kaisen är säljare och fakturautställare."}
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
