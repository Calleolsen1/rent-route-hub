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
      ? `${name} biljetter och fotbollsresor | KAISEN TRAVEL GROUP`
      : "Cupresor | KAISEN TRAVEL GROUP",
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
      <section className="relative min-h-[160px] md:min-h-[200px] flex items-end py-6 md:py-8">
        <div className="absolute inset-0">
          <img src={fotbollImage} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 pb-4 md:pb-6">
          <p className="text-[10px] tracking-[0.28em] text-primary uppercase mb-1 md:mb-1.5 font-sans">
            {sport.label}sresor - Cup
          </p>
          <h1 className="font-display text-2xl md:text-5xl text-white mb-1">{name}</h1>
          <p className="text-white/80 text-sm max-w-xl mb-4 whitespace-pre-line">{description}</p>
          <Link
            to="/contact"
            className="inline-flex items-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-7 py-2.5 text-sm font-medium tracking-wide shadow-lg shadow-navy/30 transition-all hover:scale-105"
          >
            Kontakta oss
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Matches */}
      <section className="py-10 sm:py-14 md:py-16 bg-cream">
        <div className="container mx-auto px-4">
          <UpcomingEventsList
            sport="soccer"
            tournaments={cup.tournaments}
            showFilters
            eyebrow=""
            title={`Matcher i ${name}`}
            compact
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">
            Boka din {name}-resa
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
