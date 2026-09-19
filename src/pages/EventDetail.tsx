import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicPricesEnabled } from "@/hooks/usePublicPrices";
import InquiryForm from "@/components/InquiryForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

type SupplierGroup = {
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
  /** Present on OneClicket groups; manual inventory leaves these undefined. */
  supplier?: "oneclicket";
  /**
   * The exact quantities the supplier will accept. OneClicket versions carry
   * split rules (sell-in-multiples, avoid-leaving-one) that a plain
   * min/max stepper can't express, so the picker walks this list instead.
   */
  allowed_quantities?: number[];
  supplier_version_id?: string;
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [qty, setQty] = useState(2);
  const [busy, setBusy] = useState(false);
  const [compareAtDefaultPct, setCompareAtDefaultPct] = useState<number>(0);
  const { enabled: showPrices } = usePublicPricesEnabled();
  const [inquiryOpen, setInquiryOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).rpc("get_platform_decimal", {
        p_key: "compare_at_default_pct",
        p_default: 0,
      });
      setCompareAtDefaultPct(Number(data ?? 0));
    })();
  }, []);

  const isOneClicket = event?.source === "oneclicket";

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setEvent(ev as EventRow | null);

      const evSource = (ev as EventRow | null)?.source;
      if (evSource === "oneclicket") {
        // Live supplier lookup (with markup applied). Supplier stock moves
        // between syncs, so price/availability is never read from the cached
        // rows.
        try {
          const { data: r } = await supabase.functions.invoke("oneclicket-get-event-tickets", {
            body: { event_id: id },
          });
          const groups = (r?.groups as SupplierGroup[]) ?? [];
          setSupplierGroups(groups);
          if (groups.length) setSelectedCatId(groups[0].category_id);
        } catch (e) {
          console.error(`${evSource} tickets fetch failed`, e);
        } finally {
          setPricesLoading(false);
          setLoading(false);
        }
        return;
      }

      // Manual / Stripe-product inventory
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
    ? `${event.sport === "soccer" ? `${event.home_team} vs ${event.away_team}` : event.race_name ?? event.tournament_name} - Kaisen Travel Group`
    : "Evenemang - Kaisen Travel Group";
  usePageMeta({
    title: metaTitle,
    description: event?.description
      ? event.description.slice(0, 160)
      : "Köp biljetter via Kaisen Travel Group - säker betalning, personlig service.",
    image: event?.cover_image_url ?? undefined,
    type: "article",
  });

  const priceFor = (c: CategoryRow) => livePrices[c.id] ?? Number(c.unit_price_sek);

  // Unified view for the picker - both paths produce { id, name, description,
  // party_size_together, price, available }
  const pickerOptions = useMemo(() => {
    if (isOneClicket) {
      return supplierGroups.map((g) => ({
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
      group: null as SupplierGroup | null,
      cat: c,
    }));
  }, [isOneClicket, supplierGroups, categories, livePrices]);

  const selected = useMemo(
    () => pickerOptions.find((o) => o.id === selectedCatId) ?? null,
    [pickerOptions, selectedCatId],
  );

  /**
   * Quantities the current selection permits.
   *
   * OneClicket versions carry split rules the supplier enforces on order —
   * "sell in multiples of 2", or "avoid leaving one" (stock 5 allows
   * 1,2,3,5 but not 4). A plain +/- stepper would happily land on a number
   * insOrders rejects, so when the supplier tells us the legal set we step
   * through it instead of through the integers.
   */
  const allowedQty = useMemo<number[] | null>(() => {
    const list = selected?.group?.allowed_quantities;
    return list && list.length ? list : null;
  }, [selected]);

  // Keep qty legal when the selection changes — otherwise a stepper left on
  // 3 would carry an illegal value into a multiples-of-2 category.
  useEffect(() => {
    if (!selected) return;
    setQty((q) => {
      if (allowedQty) {
        return allowedQty.includes(q)
          ? q
          : (allowedQty.find((n) => n >= q) ?? allowedQty[allowedQty.length - 1]);
      }
      return Math.min(Math.max(1, q), Math.max(1, selected.available));
    });
  }, [selected, allowedQty]);

  const stepQty = (dir: 1 | -1) => {
    setQty((q) => {
      if (allowedQty) {
        const i = allowedQty.indexOf(q);
        if (i === -1) return allowedQty[0];
        return allowedQty[Math.min(Math.max(i + dir, 0), allowedQty.length - 1)];
      }
      return dir === 1
        ? Math.min(selected?.available ?? 1, q + 1)
        : Math.max(1, q - 1);
    });
  };

  const qtyAtMin = allowedQty ? qty <= allowedQty[0] : qty <= 1;
  const qtyAtMax = allowedQty
    ? qty >= allowedQty[allowedQty.length - 1]
    : qty >= (selected?.available ?? 1);
  const total = selected ? selected.price * qty : 0;

  const handleCheckout = async () => {
    if (!event || !selected) return;
    setBusy(true);
    try {
      if (selected.price <= 0) throw new Error("Pris ej tillgängligt");

      // OneClicket has no reservation step — stock is only committed when the
      // supplier order is placed after payment — so both it and manual
      // inventory create the internal order directly.
      if (isOneClicket && !selected.id) {
        throw new Error("Biljettkategorin kunde inte matchas - ladda om sidan");
      }
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
                  {event.description.replace(/<[^>]+>/g, "")}
                </p>
              </div>
            )}



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
                              {o.description.replace(/<[^>]+>/g, "")}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Sittning ihop: upp till {o.party_size_together} pers
                          </p>
                        </div>
                        <div className="text-right">
                          {!showPrices ? (
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              Pris på förfrågan
                            </p>
                          ) : pricesLoading ? (
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
                          {showPrices && (
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                              per biljett
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right - sticky summary */}
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
                      {!showPrices ? (
                        <span className="text-muted-foreground">Pris på förfrågan</span>
                      ) : pricesLoading ? (
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
                        disabled={qtyAtMin}
                        onClick={() => stepQty(-1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center">{qty}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        disabled={qtyAtMax}
                        onClick={() => stepQty(1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {showPrices && (
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
                  )}

                  {showPrices ? (
                    <>
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
                    <>
                      <Button
                        onClick={() => setInquiryOpen(true)}
                        className="w-full rounded-full bg-primary hover:bg-primary/90 tracking-wider text-sm"
                      >
                        Begär pris
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center mt-3">
                        Vi återkommer med pris och tillgänglighet för {qty} biljett{qty === 1 ? "" : "er"}.
                      </p>
                    </>
                  )}
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

      {/* Price-on-request enquiry. Carries the exact event + ticket category
          in presetTopic so ops can quote without asking the customer again. */}
      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <InquiryForm
            type="contact"
            eyebrow="Prisförfrågan"
            heading={`Begär pris - ${headline ?? event.tournament_name}`}
            intro={`${formatEventDateTime(event.starts_at)}${event.venue_name ? ` · ${event.venue_name}` : ""}. Skriv gärna om ni vill sitta ihop eller har andra önskemål - vi återkommer med pris och tillgänglighet.`}
            presetTopic={[
              headline ?? event.tournament_name,
              selected?.name,
              `${qty} biljett${qty === 1 ? "" : "er"}`,
              `event:${event.id}`,
            ].filter(Boolean).join(" · ")}
            showDates={false}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
