import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, MapPin, Trophy } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import f1Image from "@/assets/sport-f1.jpg";
import { useSport, useEntriesForSport } from "@/hooks/useNavigation";
import { useVenuePhotos, venuePhotoFor } from "@/hooks/useVenuePhotos";
import { slugify } from "@/data/sports";
import { usePageMeta } from "@/lib/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function SportPage() {
  const { sport: sportSlug } = useParams<{ sport: string }>();
  const sport = useSport(sportSlug);
  const entries = useEntriesForSport(sportSlug);
  const venuePhotos = useVenuePhotos();

  const isRace = sport?.entry_kind === "race";
  const heroImage = isRace ? f1Image : fotbollImage;

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
      ? `Välj liga, lag eller race och få ett komplett reseupplägg med hotell, flyg och transfer från Kaisen Travel Group.`
      : "Res till Europas största sportevenemang med Kaisen Travel Group.",
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
    leagueMap.get(key)!.push(e);
  }
  const leagues = Array.from(leagueMap.entries());

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[38vh] min-h-[280px] flex items-end">
        <div className="absolute inset-0">
          <img src={heroImage} alt={sport.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 pb-10">
          <p className="text-[10px] tracking-[0.28em] text-primary uppercase mb-2 font-sans">
            Sportresor
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white mb-3">{sport.label}</h1>
          <p className="text-white/80 max-w-xl leading-relaxed">
            {isRace
              ? "Välj ett race så bygger vi resan - bra platser vid banan, hotell nära action och all logistik ordnad."
              : "Välj liga och lag så tar vi fram en komplett resa med platser på läktaren, hotell, flyg och transfer."}
          </p>
        </div>
      </section>

      {isRace ? (
        /* Races */
        <section className="py-14 md:py-20 bg-cream">
          <div className="container mx-auto px-4">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans text-center">
              Kalendern
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-center mb-12">Vilket race vill du uppleva?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {entries.map((race) => (
                <Link
                  key={race.id}
                  to={raceEventIds[race.name] ? `/sport/event/${raceEventIds[race.name]}` : `/services/sportresor/${sport.slug}/${race.slug}`}
                  className="group bg-card border border-border overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={
                        venuePhotoFor(venuePhotos, race.venue, race.name) ??
                        race.hero_image_url ??
                        f1Image
                      }
                      alt={race.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl text-foreground mb-1">{race.name}</h3>
                    {race.tagline && (
                      <p className="text-sm text-muted-foreground italic mb-3">{race.tagline}</p>
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
                    <span className="mt-4 inline-flex items-center text-sm text-primary font-medium">
                      Se resan
                      <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : (
        /* Leagues + teams */
        <section className="py-14 md:py-20 bg-cream">
          <div className="container mx-auto px-4">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans text-center">
              Ligor & klubbar
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-center mb-12">Välj liga och lag</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {leagues.map(([league, teams]) => (
                <div key={league} className="bg-card border border-border p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-display text-2xl text-foreground">{league}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{teams.length} lag</p>
                    </div>
                    <Link
                      to={`/services/sportresor/${sport.slug}/liga/${slugify(league)}`}
                      className="text-sm text-primary font-medium inline-flex items-center whitespace-nowrap hover:underline"
                    >
                      Se ligan
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teams.map((team) => (
                      <Link
                        key={team.id}
                        to={`/services/sportresor/${sport.slug}/${team.slug}`}
                        className="text-sm border border-border px-3 py-1.5 text-foreground/80 hover:border-primary hover:text-primary transition-colors"
                      >
                        {team.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">
            Boka din {sport.label.toLowerCase()}resa
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-white mb-6">
            {isRace ? "Hittar du inte ditt race?" : "Hittar du inte ditt lag?"}
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8 leading-relaxed">
            Berätta vad du vill uppleva - vi ordnar resan oavsett arena.
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
