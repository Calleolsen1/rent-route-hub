import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Users, Projector, Utensils, Wifi, Car, Award } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import incomingImage from "@/assets/kaisen-incoming.jpg";

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
          <img src={incomingImage} alt="Konferensresor" className="w-full h-full object-cover" />
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
      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
            "Ett lyckat event handlar om detaljerna. Vi tar hand om dem alla."
          </p>
          <div className="w-8 h-px bg-primary mx-auto mt-8" />
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Komplett service</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Allt under ett tak
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => (
              <div key={s.title} className="p-8 border border-border hover:border-primary transition-colors">
                <s.icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="font-display text-xl text-foreground mb-2">{s.title}</h3>
                <div className="w-6 h-px bg-primary mb-4" />
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formats */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Format</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Anpassat efter er
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {formats.map((f) => (
              <div key={f.title} className="bg-background p-8 border border-border text-center hover:border-primary transition-colors">
                <h3 className="font-display text-xl text-foreground mb-3">{f.title}</h3>
                <div className="w-8 h-px bg-primary mx-auto mb-4" />
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{f.desc}</p>
                <p className="text-xs tracking-[0.15em] text-primary uppercase font-sans">{f.guests}</p>
              </div>
            ))}
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
