import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import sportsImage from "@/assets/kaisen-sports.jpg";

const sports = [
  {
    id: "f1",
    icon: "🏎️",
    title: "Formel 1",
    description:
      "Upplev det ultimata i motorsport. Vi arrangerar exklusiva F1-paket till Monaco Grand Prix, Silverstone, Spa och fler av världens mest ikoniska banor.",
    features: [
      "Paddock Club & Hospitality-paket",
      "Hotell i premiumlägen nära banan",
      "Privata transferer & helikoptertransfer",
      "Exklusiva team-meet & greet möjligheter",
      "Tillgång till träningar, kval och race",
    ],
  },
  {
    id: "fotboll",
    icon: "⚽",
    title: "Fotboll",
    description:
      "Från Champions League-finalen till Premier League-derbyn — vi tar dig till de mest eftertraktade matcherna i världen med biljetter och upplevelsepaket i toppklass.",
    features: [
      "Champions League & Europa League",
      "Premier League, La Liga & Bundesliga",
      "VIP-lounger & executive boxes",
      "Hotelarrangemang nära arenan",
      "Lokala guider & insiderupplevelser",
    ],
  },
  {
    id: "ishockey",
    icon: "🏒",
    title: "Ishockey",
    description:
      "Scandinavians hemmasport på sin mest intensiva nivå. Vi arrangerar resor till NHL-matcher i Nordamerika och stora europeiska turneringar.",
    features: [
      "NHL-matcher i Toronto, New York & Boston",
      "Stanley Cup Playoffs-paket",
      "IIHF VM och Euro Hockey Tour",
      "Rinkside-platser & lounge-access",
      "Hotelarrangemang & transfers",
    ],
  },
  {
    id: "tennis",
    icon: "🎾",
    title: "Tennis",
    description:
      "Wimbledon på centerbanan, Roland Garros i solskenet och US Open på natten — vi skapar tennisupplevelser du sent glömmer.",
    features: [
      "Wimbledon Debenture-biljetter",
      "Roland Garros Court Philippe-Chatrier",
      "US Open & Australian Open",
      "Privata träningssessioner med proffs",
      "Exklusiva hospitality-tält & dining",
    ],
  },
  {
    id: "golf",
    icon: "⛳",
    title: "Golf",
    description:
      "Spela på The Old Course i St Andrews, Pebble Beach längs Stilla havet eller Augusta National — vi öppnar dörrar som annars förblir stängda.",
    features: [
      "St Andrews, Carnoustie & Turnberry",
      "Pebble Beach & Augusta National",
      "The Masters & The Open Championship",
      "Privata golfcaddie & coaching",
      "Resa för grupper 4–20 spelare",
    ],
  },
];

export default function Sportresor() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end">
        <div className="absolute inset-0">
          <img src={sportsImage} alt="Sportresor" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            Tjänster — Sportresor
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white">
            Elite <em className="italic font-light text-gold-light">Sportupplevelser</em>
          </h1>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
            "Vi är resebyrån för sportälskare som inte nöjer sig med läktarplats nummer 47."
          </p>
          <div className="w-8 h-px bg-primary mx-auto mt-8" />
        </div>
      </section>

      {/* Sport Categories */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sports.map((sport) => (
              <div
                key={sport.id}
                id={sport.id}
                className="border border-border p-8 hover:border-primary transition-colors group"
              >
                <div className="text-4xl mb-4">{sport.icon}</div>
                <h2 className="font-display text-2xl text-foreground mb-2">{sport.title}</h2>
                <div className="w-8 h-px bg-primary mb-4" />
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {sport.description}
                </p>
                <ul className="space-y-2 mb-8">
                  {sport.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/75">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Boka nu</p>
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Redo att se din sport live?
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            Kontakta oss så skapar vi ett skräddarsytt sportrespaket för dig eller din grupp.
          </p>
          <Link to="/contact">
            <Button
              size="lg"
              className="rounded-none bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm"
            >
              Kontakta oss
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
