import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
const fotbollImage = PHOTO["sport-fotboll"];
const f1Image = PHOTO["sport-f1"];
import { useSport, useEntry } from "@/hooks/useNavigation";
import UpcomingEventsList from "@/components/UpcomingEventsList";
import { useInquiryDialog } from "@/components/InquiryDialog";
import { useVenuePhotos, venuePhotoFor } from "@/hooks/useVenuePhotos";
import { raceSeasonBounds } from "@/lib/raceSeason";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import { leagueLogos } from "@/data/leagueLogos";
import { slugify } from "@/data/sports";
import { noBreakHyphen } from "@/lib/noBreakHyphen";
import { DEFAULT_FEATURES_BY_KIND } from "@/data/packageFeatures";
import PackageCards from "@/components/site/PackageCards";
import CityBreak from "@/components/site/CityBreak";
import { cityBreakFor } from "@/data/cityBreaks";
import { RACE_FACTS, weekendLabel } from "@/data/raceFacts";
import { RaceFactsGrid, RaceSchedule, RaceTextSections } from "@/components/site/RaceDetails";
import RaceTripFlow from "@/components/trip/RaceTripFlow";
import { PHOTO } from "@/data/photos";

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
    groupLabel: "Liga",
    upcomingTitle: (name: string) => `Fotbollsresor till ${name}`,
    whatsIncluded: "Det här kan ingå",
    packageTitle: (_sportLabel: string, venue?: string | null) =>
      venue ? `Kompletta paket till ${venue}` : "Kompletta paket",
    queryField: "team" as const,
  },
  race: {
    eyebrow: (sportLabel: string, _g?: string | null) => `${sportLabel}-resa`,
    venueLabel: "Bana",
    groupLabel: "Datum",
    upcomingTitle: (name: string) => `Biljetter till ${name}`,
    whatsIncluded: "Det här kan ingå",
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
      <section className="pt-7 md:pt-14 pb-9 md:pb-14 bg-background">
        <div className="sb-container">
          {sport.entry_kind === "race" && (
            <p className="eyebrow text-primary uppercase mb-1">Köp biljett direkt</p>
          )}
          <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px]">{labels.upcomingTitle(info.name)}</h2>
          {intro && (
            <p className="mt-3 md:mt-4 max-w-4xl text-sm md:text-[15px] leading-relaxed text-foreground/80 whitespace-pre-line">
              {intro}
            </p>
          )}
          <div className="mt-5 md:mt-8">
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
              emptyContent={
                isRace ? (
                  <RaceTripFlow
                    raceName={info.name}
                    when={raceWeekend ?? info.date_text}
                    venue={info.venue}
                    raceDay={raceFacts?.schedule.at(-1)?.date ?? null}
                  />
                ) : undefined
              }
            />
          </div>
          {!eventsEmpty && (
            <div className="mt-4 md:mt-6 sb-card bg-cream border-transparent flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 md:px-5 text-center sm:text-left">
              <p className="text-sm text-foreground/80">
                Hittar du inte matchen du letar efter? Hör av dig, så kollar vi vad vi kan ordna.
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
            cityPhoto="https://images.unsplash.com/photo-1753808407728-dc870ab1d450?w=1200&q=80&auto=format&fit=crop"
            onEnquire={enquire}
          />
        </>
      )}

      {/* Facts (race pages show them in the facts grid instead) */}
      {!raceFacts && (info.city || groupOrDate || info.venue) && (
        <section className="sb-section-alt">
          <div className="sb-container">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 [&>*]:bg-card">
              {info.city && (
                <div className="px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Stad</p>
                  <p className="font-display text-xl leading-tight">{info.city}</p>
                </div>
              )}
              {groupOrDate && (
                <div className="px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">{labels.groupLabel}</p>
                  <p className="font-display text-xl leading-tight">{groupOrDate}</p>
                </div>
              )}
              {info.venue && (
                <div className="px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">{labels.venueLabel}</p>
                  <p className="font-display text-xl leading-tight">{noBreakHyphen(info.venue)}</p>
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
