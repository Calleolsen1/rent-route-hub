import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Calendar, MapPin, Trophy, Flag } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import f1Image from "@/assets/sport-f1.jpg";
import { useSport, useEntry } from "@/hooks/useNavigation";
import UpcomingEventsList from "@/components/UpcomingEventsList";
import { useInquiryDialog } from "@/components/InquiryDialog";
import { useVenuePhotos, venuePhotoFor } from "@/hooks/useVenuePhotos";

/**
 * Unified landing page for any sport entry - replaces the old TeamPage +
 * F1RacePage split. Labels and the fallback hero image change based on
 * the parent sport's `entry_kind` ('team' vs 'race'), but the page
 * structure is identical so admins editing a new sport (Tennis, MMA, …)
 * get a consistent UI for free.
 */
const FALLBACKS_BY_KIND: Record<string, string> = {
  team: fotbollImage,
  race: f1Image,
};

const KIND_LABELS = {
  team: {
    eyebrow: (sportLabel: string, groupLabel?: string | null) =>
      `${sportLabel}sresor${groupLabel ? ` - ${groupLabel}` : ""}`,
    venueLabel: "Arena",
    venueIcon: Trophy,
    groupLabel: "Liga",
    upcomingTitle: (name: string) => `Fotbollsresor till ${name}`,
    whatsIncluded: "Vad ingår",
    packageTitle: (_sportLabel: string, venue?: string | null) =>
      venue ? `Kompletta paket till ${venue}` : "Kompletta paket",
    queryField: "team" as const,
  },
  race: {
    eyebrow: (sportLabel: string, _g?: string | null) => `${sportLabel}-resa`,
    venueLabel: "Bana",
    venueIcon: Flag,
    groupLabel: "Datum",
    upcomingTitle: (name: string) => `Biljetter till ${name}`,
    whatsIncluded: "Vad som kan ingå",
    packageTitle: (sportLabel: string, venue?: string | null) =>
      venue ? `${sportLabel}-resa till ${venue}` : `${sportLabel}-resa`,
    queryField: "race" as const,
  },
};

const DEFAULT_FEATURES_BY_KIND: Record<string, string[]> = {
  team: [
    "Matchbiljetter med bra sittplatser",
    "Hotell nära arenan",
    "Flyg från valfri svensk flygplats",
    "Transfer till och från matchen",
    "Stadstur och rekommendationer",
    "Svensk reseledare på plats",
  ],
  race: [
    "Biljetter – weekend eller söndag i olika kategorier",
    "Hotell centralt",
    "Flyg från valfri svensk flygplats",
    "Transfer från/till flygplats",
  ],
};

export default function SportEntryPage() {
  const { sport: sportSlug, entry: entrySlug } = useParams<{ sport: string; entry: string }>();
  const sport = useSport(sportSlug);
  const info = useEntry(sportSlug, entrySlug);
  const { open: openInquiry } = useInquiryDialog();
  const venuePhotos = useVenuePhotos();
  // Dölj sidans egen "Hittar du inte matchen"-rad när listan redan visar
  // sitt "Inga evenemang matchade"-box, annars blir det dubbla boxar.
  const [eventsEmpty, setEventsEmpty] = useState(false);

  if (!sport || !info) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display text-4xl mb-4">Sidan hittades inte</h1>
          <Link to="/services/sportresor">
            <Button className="rounded-full">Tillbaka till Sportresor</Button>
          </Link>
        </div>
      <Footer />
      </div>
    );
  }

  const labels = KIND_LABELS[sport.entry_kind] ?? KIND_LABELS.team;
  const VenueIcon = labels.venueIcon;
  const heroSrc =
    venuePhotoFor(venuePhotos, info.venue, info.name) ??
    info.hero_image_url ??
    FALLBACKS_BY_KIND[sport.entry_kind] ??
    fotbollImage;
  const features = (info.features_json && info.features_json.length
    ? info.features_json
    : DEFAULT_FEATURES_BY_KIND[sport.entry_kind] ?? DEFAULT_FEATURES_BY_KIND.team) ?? [];
  const groupOrDate = sport.entry_kind === "race" ? info.date_text : info.group_label;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[24vh] md:min-h-[28vh] flex items-end py-6 md:py-8">
        <div className="absolute inset-0">
          <img src={heroSrc} alt={info.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 pb-3 md:pb-5">
          <p className="text-[10px] tracking-[0.28em] text-primary uppercase mb-1 md:mb-1.5 font-sans">
            {labels.eyebrow(sport.label, info.group_label)}
          </p>
          <h1 className="font-display text-2xl md:text-4xl text-white mb-1">{info.name}</h1>
          {/* Texten under namnet är introtexten (description); tagline används
              bara som reserv när ingen introtext finns sparad. */}
          {(info.description || info.tagline) && (
            <p className="font-display italic font-light text-white/90 text-sm sm:text-base md:text-lg mb-4 max-w-2xl leading-relaxed whitespace-pre-line">
              {info.description || info.tagline}
            </p>
          )}
          <Link
            to="/contact"
            className="inline-flex items-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-7 py-2.5 text-sm font-medium tracking-wide shadow-lg shadow-navy/30 transition-all hover:scale-105"
          >
            Kontakta oss
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Live tickets */}
      <section className="py-4 md:py-5 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <UpcomingEventsList
            {...{ [labels.queryField]: info.name }}
            showFilters
            eyebrow={sport.entry_kind === "race" ? "Köp biljett direkt" : ""}
            title={labels.upcomingTitle(info.name)}
            compact
            onEmptyChange={setEventsEmpty}
          />
          {!eventsEmpty && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                Hittar du inte matchen du letar efter? Vi kan säkert fixa det ändå.
              </p>
            <Button
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() =>
                openInquiry({
                  type: "contact",
                  presetTopic: `Förfrågan: ${info.name}`,
                  defaultDestination: info.name,
                  heading: "Skicka en förfrågan",
                  intro: "Berätta vilken match du vill se så återkommer vi med ett förslag.",
                  showTripParts: true,
                })
              }
            >
              Skicka förfrågan <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            </div>
          )}
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {info.city && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Stad</p>
                  <p className="font-medium">{info.city}</p>
                </div>
              </div>
            )}
            {groupOrDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{labels.groupLabel}</p>
                  <p className="font-medium">{groupOrDate}</p>
                </div>
              </div>
            )}
            {info.venue && (
              <div className="flex items-start gap-3">
                <VenueIcon className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{labels.venueLabel}</p>
                  <p className="font-medium">{info.venue}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Package */}
      <section className="bg-cream py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans text-center">{labels.whatsIncluded}</p>
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">
            {labels.packageTitle(sport.label, info.venue)}
          </h2>
          <ul className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3 bg-card p-4 rounded-lg">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream py-16 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">
            Boka din {info.name}-resa
          </p>
          <h2 className="font-display text-3xl md:text-5xl text-foreground mb-6">
            Redo för {info.name}?
          </h2>
          <Link to="/contact">
            <Button size="lg" className="rounded-full bg-navy hover:bg-navy/90 text-white px-10 tracking-wider text-sm">
              Kontakta oss <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <RequestCta />
      <Footer />
    </div>
  );
}
