import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Users, Projector, Utensils, Wifi, Car, Award } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import konferensHero from "@/assets/konferens-hero.jpg";
import konferens1 from "@/assets/konferens-dinner.jpg";
import konferens2 from "@/assets/konferens-event.jpg";

const services = [
  {
    icon: Users,
    title: "Möteslokaler i världsklass",
    description:
      "Vi bokar konferenslokaler och hotell i Europa och globalt, anpassade efter er grupps storlek och tekniska krav.",
  },
  {
    icon: Projector,
    title: "AV & Teknik",
    description:
      "Fullständig koordinering av audiovisuell utrustning, simultantolkning och hybrid-möteslösningar.",
  },
  {
    icon: Utensils,
    title: "Catering & Dining",
    description:
      "Från coffee breaks till galamiddagar — vi arrangerar mat och dryck som imponerar och ger energi till deltagarna.",
  },
  {
    icon: Wifi,
    title: "Uppkoppling & IT",
    description:
      "Dedikerade IT-koordinatorer säkerställer stabil uppkoppling och teknisk support under hela evenemanget.",
  },
  {
    icon: Car,
    title: "Transport & Logistik",
    description:
      "Flygbokningar, shuttle-bussar, privatbilstransfer och komplett logistikhantering för alla deltagare.",
  },
  {
    icon: Award,
    title: "Team Building & Aktiviteter",
    description:
      "Kombinera konferensen med minnesvärda team building-aktiviteter — från matlagningskurser till privata museibesök.",
  },
];

const formats = [
  {
    title: "Dagsmöte",
    desc: "Effektiva endagsmöten med allt från lokal till lunch inkluderat.",
    guests: "10–50 deltagare",
  },
  {
    title: "2–3 Dagars Konferens",
    desc: "Fullständigt program med boende, middagar och aktiviteter.",
    guests: "20–150 deltagare",
  },
  {
    title: "Incentive Resa",
    desc: "Belöna era bästa medarbetare med en extraordinär upplevelse utomlands.",
    guests: "10–100 deltagare",
  },
  {
    title: "Storkongress",
    desc: "Internationella kongresser och branschevent i europeiska kongresscentra.",
    guests: "100–500+ deltagare",
  },
];

export default function Konferens() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end">
        <div className="absolute inset-0">
          <img src={konferensHero} alt="Konferensresor utomlands" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/72" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            Tjänster — Konferens & Event
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white">
            Konferenser som <em className="italic font-light text-gold-light">Imponerar</em>
          </h1>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream py-14">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
            "Ett lyckat event handlar om detaljerna. Vi tar hand om dem alla."
          </p>
          <div className="w-8 h-px bg-primary mx-auto mt-8" />
        </div>
      </section>

      {/* Image 1 + intro text */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={konferens2}
                alt="Konferensmingel och nätverk"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
                Komplett service
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">
                Allt under ett tak
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-8 text-base">
                Vi hanterar hela kedjan — från lokalbokningar och AV-teknik till catering och deltagarlogistik. Du fokuserar på innehållet, vi tar hand om allt annat.
              </p>
              <Link to="/contact">
                <Button className="rounded-none bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                  Begär offert
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-background p-8 border border-border hover:border-primary transition-colors">
                <s.icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="font-display text-xl text-foreground mb-2">{s.title}</h3>
                <div className="w-6 h-px bg-primary mb-4" />
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image 2 + formats */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
                Format
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">
                Anpassat efter er
              </h2>
              <div className="w-10 h-px bg-primary mb-8" />
              <div className="space-y-4">
                {formats.map((f) => (
                  <div key={f.title} className="border border-border p-6 hover:border-primary transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-xl text-foreground">{f.title}</h3>
                      <span className="text-xs tracking-[0.15em] text-primary uppercase font-sans">{f.guests}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="aspect-[4/3] overflow-hidden md:sticky md:top-24">
              <img
                src={konferens1}
                alt="Konferens utomlands med wine tasting"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Begär offert</p>
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Dags att planera nästa event?
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            Berätta om era önskemål och vi återkommer med ett komplett förslag.
          </p>
          <Link to="/contact">
            <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm">
              Begär offert <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
