import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import weekendImage from "@/assets/kaisen-weekend.jpg";

const destinations = [
  {
    city: "Paris",
    country: "Frankrike",
    emoji: "🇫🇷",
    tagline: "Romantikens huvudstad",
    description:
      "Frodiga bistroer, världsklassiga museer och utsikter som tar andan ur en. Paris är alltid en bra idé för en helg.",
    highlights: ["Seine-kryssning i solnedgången", "Privat guidning i Louvren", "Michelin-middag i Le Marais", "Shoppingtur längs Rue Saint-Honoré"],
  },
  {
    city: "Amsterdam",
    country: "Nederländerna",
    emoji: "🇳🇱",
    tagline: "Kanalernas stad",
    description:
      "Kanal efter kanal, cykelvägar och ett rikt kulturliv. Amsterdam erbjuder en perfekt mix av avslappning och upplevelser.",
    highlights: ["Privat kanalbåtstur", "Rijksmuseum & Van Gogh Museum", "Blomstermarknader & design-butiker", "Provsmakning av Goudaost & jenever"],
  },
  {
    city: "Barcelona",
    country: "Spanien",
    emoji: "🇪🇸",
    tagline: "Arkitektur & Sol",
    description:
      "Gaudís mästerverk, Barceloneta-stranden och en tapaskultur som sträcker sig in på natten. En perfekt söderländsk helg.",
    highlights: ["Sagrada Família tidigt på morgonen (inga köer)", "Tapasrunda i El Born", "Privat strand-access", "FC Barcelona-match"],
  },
  {
    city: "Köpenhamn",
    country: "Danmark",
    emoji: "🇩🇰",
    tagline: "Norden i världsklass",
    description:
      "Noma-effekten har gjort Köpenhamn till en gastronomisk destination utan like. Lägg till design, hygge och Tivoli.",
    highlights: ["Noma-inspirerat finmatlagning", "Designmuseum & Louisiana", "Tivoli Gardens på kvällen", "Cykeltur längs hamnfronten"],
  },
  {
    city: "Prag",
    country: "Tjeckien",
    emoji: "🇨🇿",
    tagline: "Medeltida magi",
    description:
      "En av Europas bäst bevarade medeltida städer. Prag trollbinder med sina torn, broar och en levande kafé- och ölkultur.",
    highlights: ["Privat guidad tur på Pragborgen", "Kafékultur i Gamla Stan", "Konstiga restaurangupplevelser", "Kvällskonsert i barockkyrkorna"],
  },
  {
    city: "Venedig",
    country: "Italien",
    emoji: "🇮🇹",
    tagline: "La Serenissima",
    description:
      "En stad helt utan bilar, med gondoler på kanalerna och en historia som väger tungt vid varje hörn. Oemotståndlig.",
    highlights: ["Privat gondola di sera", "Muranoglas-verkstad besök", "Cicchetti-hopning i bacari", "Soluppgång vid Piazza San Marco (tom)"],
  },
];

export default function WeekendGetaway() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end">
        <div className="absolute inset-0">
          <img src={weekendImage} alt="Weekend Getaway" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/65" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            Tjänster — Weekend Getaway
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white">
            Europas Bästa <em className="italic font-light text-gold-light">Helgresmål</em>
          </h1>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
            "Tre dagar kan förändra allt. Vi ser till att de tre dagarna blir minnesvärda."
          </p>
          <div className="w-8 h-px bg-primary mx-auto mt-8" />
        </div>
      </section>

      {/* Destinations */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Handplockade destinationer</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Helger som stannar kvar
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest) => (
              <div key={dest.city} className="border border-border hover:border-primary transition-colors group overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{dest.emoji}</span>
                    <div>
                      <h3 className="font-display text-2xl text-foreground leading-none">{dest.city}</h3>
                      <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> {dest.country}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs tracking-[0.2em] text-primary uppercase mb-3 font-sans">{dest.tagline}</p>
                  <div className="w-8 h-px bg-primary mb-4" />
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">{dest.description}</p>
                  <ul className="space-y-1.5">
                    {dest.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs text-foreground/70">
                        <span className="text-primary mt-0.5">—</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Boka din helg</p>
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Vilken stad lockar dig?
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            Berätta vart du vill och vi skräddarsyr ett helgpaket som passar dig perfekt.
          </p>
          <Link to="/contact">
            <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm">
              Planera din helg <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
