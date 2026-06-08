import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Clock, Shield, Globe, HeadphonesIcon } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/kaisen-hero.jpg";
import businessImage from "@/assets/affarsresor-hero.jpg";

const tailored = [
  "Individuell reseplanering utifrån ditt schema och dina preferenser",
  "Flexibla biljetter med möjlighet till ändringar och avbokningar",
  "Hotell handplockade efter läge, komfort och mötesmöjligheter",
  "Privata transferer från flygplats till hotell och mötesplats",
  "Dygnet-runt support under hela resan",
  "Månadsrapporter och samlad fakturering för företag",
];

const benefits = [
  {
    icon: Clock,
    title: "Din tid sparas",
    description: "Vi hanterar all planering. Du fokuserar på affärerna.",
  },
  {
    icon: Shield,
    title: "Trygg flexibilitet",
    description: "Planer ändras — vi har avbokningsskydd och snabb ombokning.",
  },
  {
    icon: Globe,
    title: "Globalt nätverk",
    description: "Partners i alla stora affärsstäder, lokalt och globalt.",
  },
  {
    icon: HeadphonesIcon,
    title: "Personlig assistent",
    description: "En kontakt som känner dina behov och alltid finns tillgänglig.",
  },
];

const destinations = [
  { city: "London", desc: "Financial District & Canary Wharf" },
  { city: "Frankfurt", desc: "Europas finanscentrum" },
  { city: "Dubai", desc: "MENA-regionens nav" },
  { city: "Singapore", desc: "Asiens affärsmetropol" },
  { city: "New York", desc: "Wall Street & Midtown" },
  { city: "Zürich", desc: "Banking & Life Sciences" },
];

export default function Affarsresor() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Affärsresor" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            Tjänster — Affärsresor
          </p>
          <h1 className="font-sans font-semibold text-4xl md:text-6xl text-white">
            Skräddarsydda <em className="italic font-light text-gold-light">Affärsresor</em>
          </h1>
        </div>
      </section>

      {/* Intro quote */}
      <section className="bg-cream py-14">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-sans font-semibold text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
            "Din tid är värdefull. Vi ser till att varje minut av din affärsresa är optimerad."
          </p>
          <div className="w-8 h-px bg-primary mx-auto mt-8" />
        </div>
      </section>

      {/* Main section: image + tailored list */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={businessImage}
                alt="Affärsresenärer på flygplats"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
                Skräddarsytt för dig
              </span>
              <h2 className="font-sans font-semibold text-3xl md:text-4xl text-foreground mt-4 mb-2">
                Inga mallar — bara din resa
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-8 text-base">
                Varje affärsresa är unik. Vi lyssnar på dina behov och skapar ett upplägg som passar ditt schema, din budget och dina förväntningar — från enklare dagsresor till komplexa flerstadsturer.
              </p>
              <ul className="space-y-3 mb-10">
                {tailored.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/contact">
                <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                  Boka nu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-10 md:py-14 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-background p-7 border border-border hover:border-primary transition-colors">
                <b.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-sans font-semibold text-lg text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Populära destinationer</p>
            <h2 className="font-sans font-semibold text-3xl md:text-4xl text-foreground">
              Världens ledande affärsstäder
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {destinations.map((d) => (
              <div key={d.city} className="p-6 border border-border text-center hover:border-primary transition-colors">
                <h3 className="font-sans font-semibold text-2xl text-foreground mb-1">{d.city}</h3>
                <p className="text-xs text-muted-foreground tracking-wide">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Kom igång</p>
          <h2 className="font-sans font-semibold text-3xl md:text-5xl text-white mb-6">
            Låt oss ta hand om dina affärsresor
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            Kontakta oss för en kostnadsfri genomgång av hur vi kan effektivisera era företagsresor.
          </p>
          <Link to="/contact">
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm">
              Kontakta oss <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
