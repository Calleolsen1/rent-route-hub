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
import { raceSeasonBounds } from "@/lib/raceSeason";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import { leagueLogos } from "@/data/leagueLogos";
import { slugify } from "@/data/sports";
import { DEFAULT_FEATURES_BY_KIND } from "@/data/packageFeatures";
import PackageCards from "@/components/site/PackageCards";
import CityBreak from "@/components/site/CityBreak";
import { cityBreakFor } from "@/data/cityBreaks";
import { RACE_FACTS, weekendLabel } from "@/data/raceFacts";
import { RaceFactsGrid, RaceSchedule, RaceTextSections } from "@/components/site/RaceDetails";

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
    whatsIncluded: "Skräddarsy din resa",
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
    whatsIncluded: "Skräddarsy din resa",
    packageTitle: (sportLabel: string, venue?: string | null) =>
      venue ? `${sportLabel}-resa till ${venue}` : `${sportLabel}-resa`,
    queryField: "race" as const,
  },
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
            <Button className="rounded-lg">Tillbaka till Sportresor</Button>
          </Link>
        </div>
      <Footer />
      </div>
    );
  }

  const labels = KIND_LABELS[sport.entry_kind] ?? KIND_LABELS.team;
  const VenueIcon = labels.venueIcon;
  const venuePhoto = venuePhotoFor(venuePhotos, info.venue, info.name);
  const cityBreak = cityBreakFor(info.city);
  const heroSrc =
    venuePhoto ??
    info.hero_image_url ??
    FALLBACKS_BY_KIND[sport.entry_kind] ??
    fotbollImage;
  const features = (info.features_json && info.features_json.length
    ? info.features_json
    : DEFAULT_FEATURES_BY_KIND[sport.entry_kind] ?? DEFAULT_FEATURES_BY_KIND.team) ?? [];
  const groupOrDate = sport.entry_kind === "race" ? info.date_text : info.group_label;
  const raceSeason = sport.entry_kind === "race" ? raceSeasonBounds(info.date_text) : {};

  const leagueLogo =
    sport.entry_kind === "team" && info.group_label ? leagueLogos[slugify(info.group_label)] : undefined;
  // The intro text (description) sits under the fixtures heading, like the
  // reference layout; tagline is still the fallback when no intro is saved.
  const intro = info.description || info.tagline;
  const isRace = sport.entry_kind === "race";
  const raceFacts = isRace ? RACE_FACTS[info.slug] : undefined;
  const raceWeekend = weekendLabel(raceFacts, info.date_text);
  const enquire = () =>
    openInquiry({
      type: "contact",
      presetTopic: `Förfrågan: ${info.name}`,
      defaultDestination: `${info.name}${raceWeekend ? ` – ${raceWeekend}` : ""}`,
      heading: "Skicka en förfrågan",
      intro: "Berätta vilka platser och vad du vill ska ingå i resan så återkommer vi med ett förslag.",
      showTripParts: true,
    });

  return (
    <div className="min-h-screen">
      <Navbar />

      <PageHero
        image={heroSrc}
        imageAlt={info.name}
        eyebrow={labels.eyebrow(sport.label, info.group_label)}
        title={info.name}
        logo={leagueLogo}
        logoAlt={info.group_label ? `${info.group_label} logotyp` : undefined}
      >
        {raceFacts?.officialName && (
          <span className="block font-display text-base md:text-lg font-semibold uppercase tracking-wide text-white/80">
            {raceFacts.officialName}
          </span>
        )}
      </PageHero>

      {raceFacts && <RaceFactsGrid facts={raceFacts} weekend={raceWeekend} city={info.city} venue={info.venue} />}

      {/* Fixtures */}
      <section className="pt-10 md:pt-14 pb-10 md:pb-14 bg-background">
        <div className="sb-container">
          {sport.entry_kind === "race" && (
            <p className="eyebrow text-primary uppercase mb-1">Köp biljett direkt</p>
          )}
          <h2 className="font-display text-3xl md:text-[44px]">{labels.upcomingTitle(info.name)}</h2>
          {intro && (
            <p className="mt-4 max-w-4xl text-[15px] leading-relaxed text-foreground/80 whitespace-pre-line">
              {intro}
            </p>
          )}
          <div className="mt-8">
            <UpcomingEventsList
              {...{ [labels.queryField]: info.name }}
              {...raceSeason}
              sport={sport.entry_kind === "race" ? "formula1" : undefined}
              emptyMessage={sport.entry_kind === "race" ? "Biljetter för detta lopp finns ännu inte i listan. Skicka en förfrågan så undersöker vi möjligheterna." : undefined}
              hideEmptyMessage={sport.entry_kind === "race"}
              inquiryDestination={isRace ? `${info.name}${raceWeekend ?? info.date_text ? ` – ${raceWeekend ?? info.date_text}` : ""}` : undefined}
              showFilters
              eyebrow=""
              title=""
              compact
              onEmptyChange={setEventsEmpty}
            />
          </div>
          {!eventsEmpty && (
            <div className="mt-6 sb-card bg-cream border-transparent flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 text-center sm:text-left">
              <p className="text-sm text-foreground/80">
                Hittar du inte matchen du letar efter? Vi kan säkert fixa det ändå.
              </p>
              <button
                type="button"
                className="sb-btn-outline shrink-0"
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
                Skicka förfrågan <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {raceFacts && (
        <>
          <RaceSchedule facts={raceFacts} />
          <RaceTextSections
            facts={raceFacts}
            raceName={info.name}
            trackName={info.venue}
            trackPhoto={heroSrc}
            cityPhoto={f1Image}
            onEnquire={enquire}
          />
        </>
      )}

      {/* Facts (race pages show them in the facts grid instead) */}
      {!raceFacts && (info.city || groupOrDate || info.venue) && (
        <section className="sb-section-alt">
          <div className="sb-container">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {info.city && (
                <div className="sb-card flex items-center gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-white"><MapPin className="h-5 w-5" /></span>
                  <div>
                    <p className="eyebrow !text-[13px] !tracking-[0.04em] text-muted-foreground uppercase">Stad</p>
                    <p className="font-display text-xl font-semibold uppercase leading-tight">{info.city}</p>
                  </div>
                </div>
              )}
              {groupOrDate && (
                <div className="sb-card flex items-center gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-white"><Calendar className="h-5 w-5" /></span>
                  <div>
                    <p className="eyebrow !text-[13px] !tracking-[0.04em] text-muted-foreground uppercase">{labels.groupLabel}</p>
                    <p className="font-display text-xl font-semibold uppercase leading-tight">{groupOrDate}</p>
                  </div>
                </div>
              )}
              {info.venue && (
                <div className="sb-card flex items-center gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-white"><VenueIcon className="h-5 w-5" /></span>
                  <div>
                    <p className="eyebrow !text-[13px] !tracking-[0.04em] text-muted-foreground uppercase">{labels.venueLabel}</p>
                    <p className="font-display text-xl font-semibold uppercase leading-tight">{info.venue}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <PackageCards
        eyebrow={labels.whatsIncluded}
        title={labels.packageTitle(sport.label, info.venue)}
        features={features}
        venuePhoto={venuePhoto}
      />

      {cityBreak && <CityBreak data={cityBreak} alt />}

      <CtaBand eyebrow={`Boka din ${info.name}-resa`} title={`Redo för ${info.name}?`}>
        <Link to="/contact" className="sb-btn-light">
          Kontakta oss <ArrowRight className="h-4 w-4" />
        </Link>
      </CtaBand>

      <RequestCta />
      <Footer />
    </div>
  );
}
