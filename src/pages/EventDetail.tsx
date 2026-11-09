import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTeamPhotos } from "@/hooks/useTeamPhotos";
import { useTeamCrests } from "@/hooks/useTeamCrests";
import { useSeatmap } from "@/hooks/useSeatmap";
import EventImage from "@/components/EventImage";
import InquiryForm from "@/components/InquiryForm";
import TicketList, { TicketListSkeleton } from "@/components/tickets/TicketList";
import TicketPlanCard from "@/components/tickets/TicketPlanCard";
import BookingCard from "@/components/tickets/BookingCard";
import CheckoutBar, { type Extras } from "@/components/tickets/CheckoutBar";
import { goToStep } from "@/components/trip/TripStep";
import { useEventTickets } from "@/hooks/useEventTickets";
import { useEventHotels } from "@/hooks/useEventHotels";
import HotelStep from "@/components/trip/HotelStep";
import FlightStep from "@/components/trip/FlightStep";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowLeft, Calendar, MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import { eventDateParts, formatEventDateTime, formatSek } from "@/lib/formatSek";
import { getStripeEnvironment } from "@/lib/stripe";
import { usePageMeta } from "@/lib/usePageMeta";
import PackageCards from "@/components/site/PackageCards";
import CityBreak from "@/components/site/CityBreak";
import { cityBreakFor } from "@/data/cityBreaks";
import { DEFAULT_FEATURES_BY_KIND, packageTitle } from "@/data/packageFeatures";
import { useEntries } from "@/hooks/useNavigation";
import { useVenuePhotos, venuePhotoFor } from "@/hooks/useVenuePhotos";
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
  // Live supplier tickets, the seating plan and the checkout, shared by the
  // list (left) and the plan + booking card (right).
  const t = useEventTickets(id, event?.sport ?? null);
  // Hotels near the ground from DPA — only in the cities DPA covers.
  const hotels = useEventHotels(id, event?.starts_at ?? null);
  const teamPhotos = useTeamPhotos();
  const venuePhotos = useVenuePhotos();
  const navEntries = useEntries();
  const teamCrests = useTeamCrests();
  const { url: seatmapUrl, note: seatmapNote } = useSeatmap(
    event?.sport ?? null,
    (event?.sport === "formula1" ? event?.race_name : event?.home_team) ?? null,
  );
  const [inquiryOpen, setInquiryOpen] = useState(false);
  // Hotel/flight on top of the tickets — one choice shared by the package
  // buttons in the booking card and the toggles in the bottom bar.
  // Both start unanswered, so the page walks the visitor through steps 2
  // and 3 before the request can be sent.
  const [extras, setExtras] = useState<Extras>({ hotel: null, flight: null });
  const [flightFrom, setFlightFrom] = useState<string | null>(null);
  // Picking a hotel turns the hotel part on; turning it off drops the picks.
  const { clear: clearHotels, selected: pickedHotels } = hotels;
  useEffect(() => {
    if (!extras.hotel && pickedHotels.length) clearHotels();
  }, [extras.hotel, pickedHotels.length, clearHotels]);
  // What the enquiry dialog was opened with, frozen so it doesn't shift
  // under the visitor while they fill it in.
  const [enquiry, setEnquiry] = useState<{ parts: string[]; selection: string[] }>({ parts: ["biljett"], selection: [] });
  const openEnquiry = () => {
    const parts = ["biljett", ...(extras.hotel ? ["hotell"] : []), ...(extras.flight ? ["flyg"] : [])];
    const selection = [
      ...t.lines.map(({ g, n }) => `${n} × ${g.name}`),
      ...(extras.hotel ? [hotels.selectionLine] : []),
      ...(extras.flight ? [`Flyg: ${flightFrom ? `från ${flightFrom}` : "avreseort ej vald"}`] : []),
    ];
    setEnquiry({ parts, selection });
    setInquiryOpen(true);
  };

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
      : "Köp biljetter via KAISEN TRAVEL GROUP - säker betalning, personlig service.",
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
            <Button className="rounded-lg">Tillbaka till Sportresor</Button>
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
  const dateBlock = eventDateParts(event.starts_at);
  const kind = event.sport === "formula1" ? "race" : "team";
  // The club/race menu entry carries the city and package lines.
  const entryName = event.sport === "formula1" ? event.race_name : event.home_team;
  const navEntry = navEntries.find((e) => e.name === entryName);
  const venuePhoto =
    teamPhotos[`${event.sport}|${entryName}`] ?? venuePhotoFor(venuePhotos, event.venue_name) ?? null;
  const cityBreak = cityBreakFor(navEntry?.city ?? event.city);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Match header (reference layout): picture left, facts right */}
      <section className="bg-background pt-6 md:pt-10 pb-6 md:pb-8">
        <div className="sb-container grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-navy-deep">
            <EventImage
              sport={event.sport}
              homeTeam={event.home_team}
              awayTeam={event.away_team}
              raceName={event.race_name}
              venueName={event.venue_name}
              coverUrl={event.cover_image_url}
              photos={teamPhotos}
              crests={teamCrests}
              variant="hero"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-stretch gap-4 md:gap-5">
              <div className="flex flex-col justify-center border-r border-border pr-4 md:pr-5 shrink-0">
                <span className="font-display font-bold text-3xl leading-none whitespace-nowrap">
                  {dateBlock.day} {dateBlock.month}
                </span>
                <span className="mt-1.5 text-xs text-muted-foreground leading-tight">
                  {dateBlock.weekday}{dateBlock.time ? ` ${dateBlock.time}` : ""}
                </span>
                <span className="text-xs text-muted-foreground leading-tight">{dateBlock.year}</span>
              </div>
              <div className="min-w-0">
                <p className="eyebrow text-primary uppercase mb-1">{event.tournament_name}</p>
                <h1 className="font-display text-3xl md:text-[40px] leading-[1.02]">{headline}</h1>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm text-foreground/80">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary shrink-0" /> {formatEventDateTime(event.starts_at)}
              </p>
              {event.venue_name && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" /> {event.venue_name}
                  {event.city ? `, ${event.city}` : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Step tabs - jump to tickets / hotel / flight; sticks under the header */}
      <div className="sticky top-16 md:top-[72px] z-30 bg-background/95 backdrop-blur-sm border-y border-border">
        <div className="sb-container flex justify-center">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              ...(t.hasTickets ? [{ id: "biljetter", label: event.sport === "formula1" ? "Biljetter" : "Matchbiljetter" }] : []),
              { id: "hotell", label: "Hotell" },
              { id: "flyg", label: "Flyg" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => goToStep(tab.id)}
                className="whitespace-nowrap rounded-md px-4 py-1.5 font-display uppercase font-semibold tracking-wide text-[15px] text-foreground/75 hover:bg-cream hover:text-primary transition-colors"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body. Desktop: tickets on the left; on the right the official
          seating plan above the booking card. Phones: plan,
          then tickets, then the booking card (the aside becomes `contents`
          so its two cards can be ordered around the list). */}
      <section className="pt-8 md:pt-10 pb-6 bg-background">
        <div className="sb-container grid lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left */}
          <div className="lg:col-span-2 space-y-10 order-2 lg:order-none min-w-0">
            {/* Live supplier tickets. Buyable when prices are public or an
                admin is previewing; otherwise a guide to the categories for
                the enquiry. Nothing when the supplier has no tickets. */}
            {t.loading ? <TicketListSkeleton /> : t.hasTickets && <TicketList t={t} sport={event.sport} />}
            {t.count > 0 && extras.hotel === null && (
              <Button
                variant="outline"
                onClick={() => goToStep("hotell")}
                className="-mt-6 w-full rounded-lg h-12 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-display uppercase font-semibold tracking-wide text-base"
              >
                Fortsätt till hotell
                <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Steps 2 and 3: what goes with the tickets. The summary on the
                right and the bottom bar only reflect these choices. */}
            <HotelStep
              h={hotels}
              on={extras.hotel}
              onToggle={(on) => {
                setExtras((e) => ({ ...e, hotel: on }));
                // No hotel: straight on to the flight question.
                if (!on && extras.flight === null) setTimeout(() => goToStep("flyg"), 150);
              }}
              onPick={(hotel) => hotel && setExtras((e) => ({ ...e, hotel: true }))}
            />
            <FlightStep
              on={extras.flight}
              onToggle={(on) => setExtras((e) => ({ ...e, flight: on }))}
              from={flightFrom}
              onFrom={setFlightFrom}
            />

            <div>
              <p className="eyebrow text-primary uppercase mb-3">
                Matchen
              </p>
              <div className="sb-card p-5 grid sm:grid-cols-3 gap-4">
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

            {seatmapUrl && !t.hasPlan && (
              <div>
                <p className="eyebrow text-primary uppercase mb-3">
                  Läktarkarta
                </p>
                <div className="sb-card overflow-hidden">
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

          {/* Right */}
          {/* In the normal page flow, not sticky: sticky needed an inner
              scrollbar whenever plan + card were taller than the window. */}
          <aside className="contents lg:block lg:self-start lg:space-y-4">
            <div className="order-1 lg:order-none">
              <TicketPlanCard
                t={t}
                venueName={event.venue_name}
                photoUrl={teamPhotos[`${event.sport}|${event.sport === "formula1" ? event.race_name : event.home_team}`] ?? null}
              />
            </div>
            <div className="order-3 lg:order-none">
              <BookingCard
                t={t}
                headline={headline ?? event.tournament_name}
                when={formatEventDateTime(event.starts_at)}
                venue={event.venue_name ? `${event.venue_name}${event.city ? `, ${event.city}` : ""}` : null}
                hotels={hotels}
                extras={extras}
                onExtras={setExtras}
                flightFrom={extras.flight ? flightFrom : null}
                onEnquire={openEnquiry}
              />
              <Link
                to="/services/sportresor"
                className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Tillbaka till Sportresor
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <PackageCards
        eyebrow="Skräddarsy din resa"
        title={packageTitle(kind, kind === "race" ? "Formel 1" : "Fotboll", event.venue_name)}
        features={navEntry?.features_json?.length ? navEntry.features_json : DEFAULT_FEATURES_BY_KIND[kind]}
        venuePhoto={venuePhoto}
        alt
      />
      {cityBreak && <CityBreak data={cityBreak} />}

      {/* Price-on-request enquiry. Carries the exact event + ticket category
          in presetTopic so ops can quote without asking the customer again. */}
      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <InquiryForm
            key={`${enquiry.parts.join(",")}|${enquiry.selection.join("|")}`}
            type="contact"
            eyebrow="Prisförfrågan"
            heading={`Begär pris - ${headline ?? event.tournament_name}`}
            intro={`${formatEventDateTime(event.starts_at)}${event.venue_name ? ` · ${event.venue_name}` : ""}. Skriv gärna om ni vill sitta ihop eller har andra önskemål - vi återkommer med pris och tillgänglighet.`}
            presetTopic={[
              headline ?? event.tournament_name,
              `event:${event.id}`,
            ].filter(Boolean).join(" · ")}
            showDates={false}
            // Hotel and flight are chosen in steps 2 and 3; the parts still
            // go into the topic line ("Önskar: …") without asking again.
            defaultTripParts={enquiry.parts}
            // Picked tickets are shown in the form and appended to the
            // message KAISEN receives (the topic line is capped at 160).
            selection={enquiry.selection}
            compact
          />
        </DialogContent>
      </Dialog>

      <RequestCta />
      {/* Slides up once a ticket is added: send the request (or, when selling
          is on, check out) from anywhere on the page. */}
      <CheckoutBar
        t={t}
        extras={extras}
        onEnquire={openEnquiry}
      />
      <Footer />
    </div>
  );
}
