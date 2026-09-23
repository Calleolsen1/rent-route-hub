import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicPricesEnabled } from "@/hooks/usePublicPrices";
import { useTeamPhotos } from "@/hooks/useTeamPhotos";
import { useTeamCrests } from "@/hooks/useTeamCrests";
import { useSeatmap } from "@/hooks/useSeatmap";
import EventImage from "@/components/EventImage";
import InquiryForm from "@/components/InquiryForm";
import TicketPicker from "@/components/TicketPicker";
import { useUserRole } from "@/hooks/useUserRole";
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
  const { isAdmin } = useUserRole();
  // True once the ticket picker has live, priced, buyable tickets.
  const [canBuyOnline, setCanBuyOnline] = useState(false);
  const teamPhotos = useTeamPhotos();
  const teamCrests = useTeamCrests();
  const { url: seatmapUrl, note: seatmapNote } = useSeatmap(
    event?.sport ?? null,
    (event?.sport === "formula1" ? event?.race_name : event?.home_team) ?? null,
  );
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryParts, setInquiryParts] = useState<string[]>(["biljett", "hotell", "flyg"]);
  const [selectedPackage, setSelectedPackage] = useState<string>("komplett");

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
      <section className="relative h-[36vh] min-h-[300px] md:h-[28vh] md:min-h-[200px] flex items-end">
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
          {/* Extra shading at the bottom so the headline stays readable over crests */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-navy via-navy/80 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 pb-5 md:pb-6">
          <p className="text-[11px] sm:text-xs eyebrow text-white/70 uppercase mb-2 font-sans">
            {event.tournament_name}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-white mb-2 leading-tight">
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
              <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans">
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

            {/* Buy tickets online. Only mounts when prices are public or an
                admin is previewing; the picker itself renders nothing when the
                supplier has no tickets for this match. */}
            {(showPrices || isAdmin) && (
              <TicketPicker eventId={event.id} onAvailability={setCanBuyOnline} />
            )}

            {seatmapUrl && (
              <div>
                <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans">
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
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/70 font-sans">
                    Din förfrågan
                  </p>
                  <span className="shrink-0 bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded">
                    Offertbaserad
                  </span>
                </div>
                <p className="font-display text-2xl leading-tight mb-1">{headline}</p>
                <p className="text-sm text-muted-foreground font-medium mb-3">
                  {formatEventDateTime(event.starts_at)}
                </p>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {event.venue_name}
                    {event.city ? `, ${event.city}` : ""}
                  </span>
                </div>
              </div>

              {canBuyOnline && (
                <div className="px-6 pb-4">
                  <a
                    href="#biljetter"
                    className="flex items-center justify-between gap-3 rounded-xl bg-primary text-primary-foreground px-4 py-3.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Ticket className="h-4 w-4" /> Bara biljetter? Köp direkt
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <p className="mt-2 text-[11px] text-muted-foreground text-center">
                    Paket med hotell och flyg offereras nedan.
                  </p>
                </div>
              )}

              {/* Package tiers - shown without prices since every trip is
                  quoted individually. The selected tier drives the enquiry. */}
              <div className="px-6 pb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3 font-sans">
                  Välj ditt paket
                </p>
                <div className="space-y-3">
                  {[
                    { id: "biljetter", icons: [Ticket], label: "Endast biljetter", parts: ["biljett"] },
                    { id: "hotell", icons: [Ticket, Hotel], label: "Biljetter + hotell", parts: ["biljett", "hotell"] },
                    {
                      id: "komplett",
                      icons: [Ticket, Plane, Hotel],
                      label: "Biljetter + flyg + hotell",
                      parts: ["biljett", "hotell", "flyg"],
                    },
                  ].map(({ id, icons, label, parts }) => {
                    const selected = selectedPackage === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedPackage(id);
                          setInquiryParts(parts);
                        }}
                        className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                          selected
                            ? "border-2 border-primary bg-primary/5"
                            : "border border-border bg-background hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        <span className={`text-sm font-semibold ${selected ? "text-foreground" : "text-foreground/80"}`}>
                          {label}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${
                            selected ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {icons.map((Icon, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                              {i > 0 && <Plus className="h-3 w-3 opacity-60" />}
                              <Icon className="h-4 w-4" />
                            </span>
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inquiry action */}
              <div className="px-6 pb-6 pt-4 border-t border-border">
                <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4 font-sans">
                  Pris ges vid förfrågan
                </p>
                <Button
                  onClick={() => setInquiryOpen(true)}
                  className="w-full rounded-xl bg-primary hover:bg-primary/90 tracking-wider text-sm h-12"
                >
                  Efterfråga paket
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="mt-5 text-xs text-muted-foreground leading-relaxed text-center italic">
                  Pris på förfrågan - vi återkommer med biljetter, hotell och flyg
                  efter era önskemål.{" "}
                  <span className="not-italic font-semibold text-foreground">
                    Vi återkommer inom 24h.
                  </span>
                </p>
              </div>
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
