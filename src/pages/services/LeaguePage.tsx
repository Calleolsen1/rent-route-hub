import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Trophy } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import { leagueLogos } from "@/data/leagueLogos";
import { useSport, useEntriesForSport } from "@/hooks/useNavigation";
import { slugify } from "@/data/sports";
import { useSiteContent } from "@/hooks/useSiteContent";
import { usePageMeta } from "@/lib/usePageMeta";
import { useTeamCrests } from "@/hooks/useTeamCrests";
import { useVenuePhotos, venuePhotoFor } from "@/hooks/useVenuePhotos";

const DEFAULT_LEAGUE_INTRO =
  "Välj ett lag så tar vi fram en komplett resa med biljetter, hotell, flyg och transfer.";

export default function LeaguePage() {
  const { sport: sportSlug, league: leagueSlug } = useParams<{ sport: string; league: string }>();
  const sport = useSport(sportSlug);
  const entries = useEntriesForSport(sportSlug);
  const crests = useTeamCrests();
  const venuePhotos = useVenuePhotos();

  // Per-league hero intro, editable in admin under site_content key league_intro_<slug>.
  const introKey = leagueSlug ? `league_intro_${leagueSlug}` : "";
  const { get } = useSiteContent(introKey ? [introKey] : []);

  const teams = entries.filter((e) => e.group_label && slugify(e.group_label) === leagueSlug);
  const leagueName = teams[0]?.group_label ?? "";

  usePageMeta({
    title: leagueName
      ? `${leagueName}-resor - biljetter, hotell och transfer | Kaisen Travel Group`
      : "Ligaresor | Kaisen Travel Group",
    description: leagueName
      ? `Res till ${leagueName} med KAISEN TRAVEL GROUP. Välj lag och få ett komplett resupplägg med hotell, flyg och transfer.`
      : "Res till Europas största ligor med KAISEN TRAVEL GROUP.",
  });

  if (!sport || !teams.length) {
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

  return (
    <div className="min-h-screen">
      <Navbar />

      <PageHero
        image={fotbollImage}
        imageAlt={leagueName}
        eyebrow={`${sport.label}sresor - Liga`}
        title={leagueName}
        logo={leagueLogos[leagueSlug ?? ""]}
        logoAlt={`${leagueName} logotyp`}
      >
        {get(introKey, DEFAULT_LEAGUE_INTRO)}
      </PageHero>

      {/* Teams */}
      <section className="sb-section">
        <div className="sb-container">
          <p className="eyebrow text-primary uppercase mb-1">
            Klubbar i {leagueName}
          </p>
          <h2 className="font-display text-[26px] sm:text-3xl md:text-[36px] lg:text-[44px] mb-5 sm:mb-10">Vilket lag vill du se live?</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {teams.map((team) => {
              const venueImage =
                venuePhotoFor(venuePhotos, team.venue, team.name) || team.hero_image_url || null;
              return (
              <Link
                key={team.id}
                to={`/services/sportresor/${sport.slug}/${team.slug}`}
                className="group sb-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-navy-deep flex items-center justify-center">
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
                      className="w-full h-full object-contain drop-shadow-lg p-6 sm:p-12 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-deep/95 via-navy-deep/40 to-transparent px-3 sm:px-4 pt-10 pb-2.5 sm:pb-3">
                    <h3 className="font-display text-[13px] min-[400px]:text-[15px] sm:text-xl italic font-bold leading-tight text-white">{team.name}</h3>
                  </div>
                </div>
                <div className="p-2.5 sm:p-4">
                  {team.tagline && (
                    <p className="hidden sm:block text-sm text-muted-foreground italic mb-3 line-clamp-2">{team.tagline}</p>
                  )}
                  <div className="space-y-0.5 text-[11px] sm:space-y-1.5 sm:text-xs text-muted-foreground">
                    {team.city && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {team.city}
                      </p>
                    )}
                    {team.venue && (
                      <p className="hidden sm:flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-primary" />
                        {team.venue}
                      </p>
                    )}
                  </div>
                  <span className="mt-2 sm:mt-3 inline-flex items-center font-display uppercase font-semibold tracking-wide text-sm sm:text-[15px] text-primary">
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

      <CtaBand
        eyebrow={`Boka din ${leagueName}-resa`}
        title="Hittar du inte laget eller matchen?"
        text="Hör av dig till oss så undersöker vi möjligheterna via vårt nätverk av leverantörer."
      >
        <Link to="/contact" className="sb-btn-light">
          Kontakta oss <ArrowRight className="h-4 w-4" />
        </Link>
      </CtaBand>

      <RequestCta />
      <Footer />
    </div>
  );
}
