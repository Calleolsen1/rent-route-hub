import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import { useSport, useEntry } from "@/hooks/useNavigation";
import UpcomingEventsList from "@/components/UpcomingEventsList";
import { CUPS, getCup } from "@/data/cups";
import { usePageMeta } from "@/lib/usePageMeta";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import { cupLogos } from "@/data/leagueLogos";

/**
 * Landing page for a football cup (Champions League, Europa League, FA Cup,
 * Carabao Cup). Lists the cup's matches - same ticket cards as team pages -
 * with an inquiry CTA for fixtures not on sale.
 */
export default function CupPage() {
  const { sport: sportSlug, cup: cupSlug } = useParams<{ sport: string; cup: string }>();
  const sport = useSport(sportSlug);
  const info = getCup(cupSlug);
  // Admin-editable intro text from the nav entry (falls back to the constant).
  const dbEntry = useEntry(sportSlug, cupSlug);

  const cup = CUPS.find((c) => c.slug === cupSlug) ?? info;
  const name = cup?.name ?? "";
  const description = dbEntry?.description || cup?.description || "";

  usePageMeta({
    title: name
      ? `${name} biljetter och fotbollsresor | Kaisen Travel Group`
      : "Cupresor | Kaisen Travel Group",
    description: name
      ? `Res till ${name} med KAISEN TRAVEL GROUP. Officiella matchbiljetter, hotell, flyg och transfer - välj match så tar vi fram reseupplägget.`
      : "Res till Europas stora cuper med KAISEN TRAVEL GROUP.",
  });

  if (!sport || !cup) {
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
        imageAlt={name}
        eyebrow={`${sport.label}sresor - Cup`}
        title={name}
        logo={cupLogos[cup.slug]}
        logoAlt={`${name} logotyp`}
      />

      {/* Matches */}
      <section className="pt-7 md:pt-14 pb-6 bg-background">
        <div className="sb-container">
          <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px]">{`Matcher i ${name}`}</h2>
          {description && (
            <p className="mt-3 md:mt-4 max-w-4xl text-sm md:text-[15px] leading-relaxed text-foreground/80 whitespace-pre-line">{description}</p>
          )}
          <div className="mt-5 md:mt-8">
            <UpcomingEventsList
              sport="soccer"
              tournaments={cup.tournaments}
              showFilters
              eyebrow=""
              title=""
              compact
            />
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow={`Boka din ${name}-resa`}
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
