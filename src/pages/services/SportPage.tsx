import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, MapPin, Trophy } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import f1Image from "@/assets/sport-f1.jpg";
import bundesligaLogo from "@/assets/league-bundesliga.png.asset.json";
import laLigaLogo from "@/assets/league-la-liga.png.asset.json";
import premierLeagueLogo from "@/assets/league-premier-league.png.asset.json";
import serieALogo from "@/assets/league-serie-a.png.asset.json";
import scottishPremiershipLogo from "@/assets/league-scottish-premiership.png.asset.json";
import championsLeagueLogo from "@/assets/cup-champions-league.png.asset.json";
import europaLeagueLogo from "@/assets/cup-europa-league.png.asset.json";
import faCupLogo from "@/assets/cup-fa-cup.png.asset.json";
import carabaoCupLogo from "@/assets/cup-carabao-cup.png.asset.json";
import { useSport, useEntriesForSport } from "@/hooks/useNavigation";
import { useVenuePhotos, venuePhotoFor } from "@/hooks/useVenuePhotos";
import { slugify } from "@/data/sports";
import { CUP_GROUP_LABEL, cupHref } from "@/data/cups";
import { usePageMeta } from "@/lib/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const leagueLogos: Record<string, string> = {
  bundesliga: bundesligaLogo.url,
  "la-liga": laLigaLogo.url,
  "premier-league": premierLeagueLogo.url,
  "serie-a": serieALogo.url,
  "scottish-premiership": scottishPremiershipLogo.url,
};

/** Cup logos shown in the "Cuper" chips, keyed by cup slug (src/data/cups.ts). */
const cupLogos: Record<string, string> = {
  "champions-league": championsLeagueLogo.url,
  "europa-league": europaLeagueLogo.url,
  "fa-cup": faCupLogo.url,
  "carabao-cup": carabaoCupLogo.url,
};

export default function SportPage() {
  const { sport: sportSlug } = useParams<{ sport: string }>();
  const sport = useSport(sportSlug);
  const entries = useEntriesForSport(sportSlug);
  const venuePhotos = useVenuePhotos();
  const [raceSearch, setRaceSearch] = useState("");

  const isRace = sport?.entry_kind === "race";
  const heroImage = isRace ? f1Image : fotbollImage;

  // Headline sells the trip, not the sport - the menu keeps the short name.
  const heroTitle = sport?.slug === "fotboll" ? "Fotbollsresor" : sport?.label;


  // Map race name -> event id so cards can link straight to the event page.
  const [raceEventIds, setRaceEventIds] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!isRace) return;
    supabase
      .from("events")
      .select("id, race_name")
      .eq("sport", "formula1")
      .not("race_name", "is", null)
      .then(({ data }) => {
        const byName: Record<string, string> = {};
        for (const e of data ?? []) {
          if (e.race_name && !byName[e.race_name.toLowerCase()]) byName[e.race_name.toLowerCase()] = e.id;
        }
        // Swedish nav names -> event race names
        const alias: Record<string, string> = {
          "italiens grand prix": "italian grand prix",
          "ungerns grand prix": "hungarian grand prix",
          "spaniens grand prix": "spanish grand prix",
          "österrikes grand prix": "austrian grand prix",
        };
        const map: Record<string, string> = {};
        for (const race of entries) {
          const key = race.name.toLowerCase();
          const id = byName[key] ?? byName[alias[key] ?? ""];
          if (id) map[race.name] = id;
        }
        setRaceEventIds(map);
      });
  }, [isRace]);

  usePageMeta({
    title: sport
      ? `${sport.label}resor - biljetter, hotell och transfer | Kaisen Travel Group`
      : "Sportresor | Kaisen Travel Group",
    description: sport
      ? `Välj liga, lag eller race och få ett komplett reseupplägg med hotell, flyg och transfer från KAISEN TRAVEL GROUP.`
      : "Res till Europas största sportevenemang med KAISEN TRAVEL GROUP.",
  });

  if (!sport || !entries.length) {
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

  // Group teams by league (grouped sports); races render as a flat grid.
  const leagueMap = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = e.group_label ?? "Övrigt";
    if (!leagueMap.has(key)) leagueMap.set(key, []);
    leagueMap.get(key)?.push(e);
  }
  const leagues = Array.from(leagueMap.entries());

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[26vh] min-h-[200px] md:h-[38vh] md:min-h-[280px] flex">
        <div className="absolute inset-0">
          <img src={heroImage} alt={sport.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 flex flex-col justify-end">
          <p className="text-[10px] tracking-[0.28em] text-primary uppercase mb-1.5 md:mb-2 font-sans">
            Sportresor
          </p>
          <h1 className="font-display text-3xl md:text-6xl text-white mb-1.5 md:mb-3">{heroTitle}</h1>
          <p className="text-white/80 max-w-xl leading-relaxed text-sm sm:text-base">
            {isRace
              ? "Välj ett race så bygger vi resan - bra platser vid banan, hotell nära action och all logistik ordnad."
              : "Upplev världens bästa fotbollsmatcher LIVE. Välj liga, lag och vad din resa ska innehålla så tar vi fram bästa möjliga reseupplägg. Vi hjälper dig med officiella matchbiljetter eller en komplett resa med flyg och hotell."}
          </p>

          {/* Knappen hålls mitt i utrymmet mellan texten och rutans nedre kant. */}
          <div className="flex flex-1 min-h-[84px] md:min-h-[104px] items-center">
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide shadow-lg shadow-navy/30 transition-all hover:scale-105"
            >
              Kontakta oss
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {isRace ? (
        /* Races */
        <section className="py-10 sm:py-14 md:py-20 bg-cream">
          <div className="container mx-auto px-4">
            <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans text-center">
              Kalendern
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-center mb-6 sm:mb-12">Vilket race vill du uppleva?</h2>
            <div className="sm:hidden mb-4">
              <Input type="search" aria-label="Sök lopp" placeholder="Sök lopp, stad eller bana" value={raceSearch} onChange={(event) => setRaceSearch(event.target.value)} className="h-12 bg-card" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-5xl mx-auto">
              {entries.map((race) => (
                <Link
                  key={race.id}
                  to={raceEventIds[race.name] ? `/sport/event/${raceEventIds[race.name]}` : `/services/sportresor/${sport.slug}/${race.slug}`}
                  className={`group bg-card border border-border overflow-hidden hover:shadow-xl transition-shadow grid grid-cols-[6rem_minmax(0,1fr)] sm:block ${raceSearch.trim() && ![race.name, race.city, race.venue, race.date_text].join(" ").toLocaleLowerCase("sv").includes(raceSearch.trim().toLocaleLowerCase("sv")) ? "hidden sm:block" : ""}`}
                >
                  <div className="relative h-full min-h-40 sm:min-h-0 sm:aspect-[4/3] overflow-hidden">
                    <img
                      src={
                        venuePhotoFor(venuePhotos, race.venue, race.name) ??
                        race.hero_image_url ??
                        f1Image
                      }
                      alt={race.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="hidden sm:block absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 via-navy/50 to-transparent px-4 pt-10 pb-3">
                      <p className="font-display text-xl text-primary-foreground leading-tight">{race.name}</p>
                      {race.date_text && <p className="text-xs text-primary-foreground/80 mt-0.5">{race.date_text}</p>}
                    </div>
                  </div>
                  <div className="min-w-0 p-3 sm:p-5">
                    <h3 className="font-display text-lg sm:text-xl text-foreground mb-1">{race.name}</h3>
                    {race.tagline && (
                      <p className="text-sm text-muted-foreground italic mb-2 sm:mb-3">{race.tagline}</p>
                    )}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {race.date_text && (
                        <p className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />
                          {race.date_text}
                        </p>
                      )}
                      {race.venue && (
                        <p className="flex items-center gap-2">
                          <Trophy className="h-3.5 w-3.5 text-primary" />
                          {race.venue}
                        </p>
                      )}
                      {race.city && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {race.city}
                        </p>
                      )}
                    </div>
                    <span className="mt-2 sm:mt-4 inline-flex min-h-8 items-center text-sm text-primary font-medium">
                      Se resan
                      <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {raceSearch.trim() && !entries.some((race) => [race.name, race.city, race.venue, race.date_text].join(" ").toLocaleLowerCase("sv").includes(raceSearch.trim().toLocaleLowerCase("sv"))) && <p className="sm:hidden text-center text-muted-foreground py-6" role="status">Inga lopp matchar sökningen.</p>}
          </div>
        </section>
      ) : (
        /* Leagues + teams */
        <section className="py-10 sm:py-14 md:py-20 bg-cream">
          <div className="container mx-auto px-4">
            <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans text-center">
              Ligor & klubbar
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-center mb-12">Välj liga och lag</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {leagues.map(([league, teams]) => {
                // "Cuper" lists cups instead of clubs - chips link to the cup
                // pages (matches), so there is no league page or logo for it.
                const isCupGroup = league === CUP_GROUP_LABEL;
                return (
                <div key={league} className="bg-card border border-border rounded-lg p-5 sm:p-6 hover:border-primary/40 hover:shadow-lg transition-all motion-reduce:transition-none">
                  <div className="flex items-start justify-between gap-4 mb-5 min-h-[80px]">
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl text-foreground">{league}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {teams.length} {isCupGroup ? "cuper" : "lag"}
                      </p>
                      {!isCupGroup && (
                      <Link
                      to={`/services/sportresor/${sport.slug}/liga/${slugify(league)}`}
                      className="mt-3 text-sm text-primary font-medium inline-flex items-center whitespace-nowrap hover:underline"
                    >
                      Se ligan
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                      )}
                    </div>
                    {!isCupGroup && leagueLogos[slugify(league)] && (
                      <Link
                        to={`/services/sportresor/${sport.slug}/liga/${slugify(league)}`}
                        aria-label={`Se ${league}`}
                        className="flex h-20 w-24 sm:w-28 shrink-0 items-center justify-center"
                      >
                        <img
                          src={leagueLogos[slugify(league)]}
                          alt={`${league} logotyp`}
                          className="h-full w-full object-contain"
                        />
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    {teams.map((team) => {
                      const cupLogo = isCupGroup ? cupLogos[team.slug] : undefined;
                      return (
                      <Link
                        key={team.id}
                        to={isCupGroup ? cupHref(sport.slug, team.slug) : `/services/sportresor/${sport.slug}/${team.slug}`}
                        className="inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-1.5 text-foreground/80 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        {cupLogo && (
                          <img
                            src={cupLogo}
                            alt=""
                            aria-hidden
                            className="h-5 w-5 shrink-0 object-contain"
                          />
                        )}
                        {team.name}
                      </Link>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">
            Boka din {sport.label.toLowerCase()}resa
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-white mb-6">
            Hittar du inte laget eller matchen?
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8 leading-relaxed">
            Hör av dig till oss så undersöker vi möjligheterna via vårt nätverk av leverantörer.
          </p>
          <Link to="/contact">
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm">
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
