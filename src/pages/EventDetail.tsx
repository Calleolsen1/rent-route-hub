import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicPricesEnabled } from "@/hooks/usePublicPrices";
import { useTeamPhotos } from "@/hooks/useTeamPhotos";
import { useTeamCrests } from "@/hooks/useTeamCrests";
import { useSeatmap } from "@/hooks/useSeatmap";
import EventImage from "@/components/EventImage";
import InquiryForm from "@/components/InquiryForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calendar, Hotel, MapPin, Minus, Plane, Plus, Ticket, Users } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
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




export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [compareAtDefaultPct, setCompareAtDefaultPct] = useState<number>(0);
  const { enabled: showPrices } = usePublicPricesEnabled();
  const teamPhotos = useTeamPhotos();
  const teamCrests = useTeamCrests();
  const { url: seatmapUrl, note: seatmapNote } = useSeatmap(
    event?.sport ?? null,
    (event?.sport === "formula1" ? event?.race_name : event?.home_team) ?? null,
  );
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryParts, setInquiryParts] = useState<string[]>(["biljett"]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).rpc("get_platform_decimal", {
        p_key: "compare_at_default_pct",
        p_default: 0,
      });
      setCompareAtDefaultPct(Number(data ?? 0));
    })();
  }, []);


  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setEvent(ev as EventRow | null);

      // Fixtures come from a schedule API with no inventory, so there is
      // nothing further to fetch — the page shows the game and routes the
      // visitor into a request.
      setLoading(false);
      setPricesLoading(false);
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
          <EventImage
            sport={event.sport}
            homeTeam={event.home_team}
            awayTeam={event.away_team}
            raceName={event.race_name}
            tournamentName={event.tournament_name}
            venueName={event.venue_name}
            coverUrl={event.cover_image_url}
            photos={teamPhotos}
                    crests={teamCrests}
          />
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
            {/* Match facts + seating chart.
                There is no ticket picker any more: fixtures come from a
                schedule API with no inventory, and the site quotes on
                request. The chart is a reference so a customer can name the
                section they want in the enquiry. */}
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
                Matchen
              </p>
              <div className="rounded-xl border border-border bg-card p-5 grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Datum</p>
                  <p className="text-sm font-medium">{formatEventDateTime(event.starts_at)}</p>
                </div>
                {event.venue_name && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Arena</p>
                    <p className="text-sm font-medium">{event.venue_name}</p>
                  </div>
                )}
                {(event.city || event.country) && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Plats</p>
                    <p className="text-sm font-medium">
                      {[event.city, event.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {seatmapUrl && (
              <div>
                <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
                  Läktarkarta
                </p>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <img
                    src={seatmapUrl}
                    alt={`Läktarkarta ${event.venue_name ?? ""}`}
                    loading="lazy"
                    className="w-full h-auto"
                  />
                  <p className="text-xs text-muted-foreground p-4 border-t border-border">
                    {seatmapNote?.trim()
                      ? seatmapNote
                      : "Berätta i förfrågan vilken del av arenan ni helst vill sitta i, så ordnar vi platser därefter."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right - sticky summary */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
                Din förfrågan
              </p>
              <p className="font-display text-2xl mb-1">{headline}</p>
              <p className="text-xs text-muted-foreground mb-5">
                {formatEventDateTime(event.starts_at)}
              </p>

              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {event.venue_name}
                  {event.city ? `, ${event.city}` : ""}
                </span>
              </div>

              <Button
                onClick={() => {
                  setInquiryParts(["biljett"]);
                  setInquiryOpen(true);
                }}
                className="w-full rounded-full bg-primary hover:bg-primary/90 tracking-wider text-sm"
              >
                Efterfråga biljetter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInquiryParts(["biljett", "hotell", "flyg"]);
                  setInquiryOpen(true);
                }}
                className="w-full rounded-full mt-3 tracking-wider text-sm"
              >
                Efterfråga komplett paket
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-3">
                Pris på förfrågan - vi återkommer med biljetter, hotell och flyg
                efter era önskemål. Vi återkommer inom 24h.
              </p>
            </div>

            {/* Package tiers - inspired by classic travel-package cards,
                shown without prices since every trip is quoted individually. */}
            <div className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">
                Välj ditt paket
              </p>
              <div className="space-y-3 mb-5">
                {[
                  { icons: [Ticket], label: "Endast biljetter" },
                  { icons: [Ticket, Hotel], label: "Biljetter + hotell" },
                  { icons: [Ticket, Plane, Hotel], label: "Biljetter + flyg + hotell" },
                ].map(({ icons, label }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {icons.map((Icon, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          {i > 0 && <Plus className="h-3 w-3 text-muted-foreground/50" />}
                          <Icon className="h-4 w-4" />
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full rounded-full bg-primary hover:bg-primary/90 tracking-wider text-sm"
                onClick={() => {
                  setInquiryParts(["biljett", "hotell", "flyg"]);
                  setInquiryOpen(true);
                }}
              >
                Visa paket
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-3">
                Pris på förfrågan - vi sätter ihop resan efter era önskemål.
              </p>
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
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <InquiryForm
            key={inquiryParts.join(",")}
            type="contact"
            eyebrow="Prisförfrågan"
            heading={`Begär pris - ${headline ?? event.tournament_name}`}
            intro={`${formatEventDateTime(event.starts_at)}${event.venue_name ? ` · ${event.venue_name}` : ""}. Skriv gärna om ni vill sitta ihop eller har andra önskemål - vi återkommer med pris och tillgänglighet.`}
            presetTopic={[
              headline ?? event.tournament_name,
              `event:${event.id}`,
            ].filter(Boolean).join(" · ")}
            showDates={false}
            showTripParts
            defaultTripParts={inquiryParts}
            compact
          />
        </DialogContent>
      </Dialog>

      <RequestCta />
      <Footer />
    </div>
  );
}
