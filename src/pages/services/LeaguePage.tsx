import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Trophy } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import { useSport, useEntriesForSport } from "@/hooks/useNavigation";
import { slugify } from "@/data/sports";
import { usePageMeta } from "@/lib/usePageMeta";
import { useTeamCrests } from "@/hooks/useTeamCrests";
import { useVenuePhotos, venuePhotoFor } from "@/hooks/useVenuePhotos";

export default function LeaguePage() {
  const { sport: sportSlug, league: leagueSlug } = useParams<{ sport: string; league: string }>();
  const sport = useSport(sportSlug);
  const entries = useEntriesForSport(sportSlug);
  const crests = useTeamCrests();
  const venuePhotos = useVenuePhotos();

  const teams = entries.filter((e) => e.group_label && slugify(e.group_label) === leagueSlug);
  const leagueName = teams[0]?.group_label ?? "";

  usePageMeta({
    title: leagueName
      ? `${leagueName}-resor - biljetter, hotell och transfer | KAISEN Travel Group`
      : "Ligaresor | KAISEN Travel Group",
    description: leagueName
      ? `Res till ${leagueName} med KAISEN Travel Group. Välj lag och få ett komplett resupplägg med hotell, flyg och transfer.`
      : "Res till Europas största ligor med KAISEN Travel Group.",
  });

  if (!sport || !teams.length) {
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

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[20vh] min-h-[160px] md:h-[26vh] md:min-h-[200px] flex items-end">
        <div className="absolute inset-0">
          <img src={fotbollImage} alt={leagueName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 pb-4 md:pb-6">
          <p className="text-[10px] tracking-[0.28em] text-primary uppercase mb-1 md:mb-1.5 font-sans">
            {sport.label}sresor - Liga
          </p>
          <h1 className="font-display text-2xl md:text-5xl text-white mb-1">{leagueName}</h1>
          <p className="text-white/80 text-sm max-w-xl mb-4">
            Välj ett lag så tar vi fram en komplett resa med biljetter, hotell, flyg och transfer.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-7 py-2.5 text-sm font-medium tracking-wide shadow-lg shadow-navy/30 transition-all hover:scale-105"
          >
            Kontakta oss
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Teams */}
      <section className="py-10 sm:py-14 md:py-20 bg-cream">
        <div className="container mx-auto px-4">
          <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans text-center">
            Klubbar i {leagueName}
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">Vilket lag vill du se live?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {teams.map((team) => {
              const venueImage =
                venuePhotoFor(venuePhotos, team.venue, team.name) || team.hero_image_url || null;
              return (
              <Link
                key={team.id}
                to={`/services/sportresor/${sport.slug}/${team.slug}`}
                className="group bg-card border border-border overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden bg-navy flex items-center justify-center">
                  {venueImage ? (
                    <img
                      src={venueImage}
                      alt={`${team.venue || team.name} arena`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : crests[team.name] ? (
                    <img
                      src={crests[team.name]}
                      alt={`${team.name} klubbmärke`}
                      className="w-full h-full object-contain drop-shadow-lg p-10 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="font-display text-2xl text-primary-foreground text-center">
                      {team.name}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl text-foreground mb-1">{team.name}</h3>
                  {team.tagline && (
                    <p className="text-sm text-muted-foreground italic mb-3">{team.tagline}</p>
                  )}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {team.city && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {team.city}
                      </p>
                    )}
                    {team.venue && (
                      <p className="flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-primary" />
                        {team.venue}
                      </p>
                    )}
                  </div>
                  <span className="mt-4 inline-flex items-center text-sm text-primary font-medium">
                    Se resor
                    <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Boka din {leagueName}-resa</p>
          <h2 className="font-display text-3xl md:text-4xl text-white mb-6">
            Hittar du inte ditt lag?
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8 leading-relaxed">
            Berätta vilken match du vill se - vi ordnar resan oavsett arena.
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
