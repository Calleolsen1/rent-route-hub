import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Briefcase, Clock, Shield, Globe, HeadphonesIcon, Star } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/kaisen-hero.jpg";

const benefits = [
  {
    icon: Clock,
    title: "Tidseffektivitet",
    description:
      "Vi hanterar all planering så att du kan fokusera på det som räknas — dina affärer. Snabba bokningar, smidiga transferer och inga onödiga väntetider.",
  },
  {
    icon: Shield,
    title: "Flexibilitet & Trygghet",
    description:
      "Planer förändras. Vi erbjuder flexibla bokningar med avbokningsskydd och dygnet-runt-support så att du aldrig fastnar.",
  },
  {
    icon: Globe,
    title: "Globalt Nätverk",
    description:
      "Med partners världen över säkerställer vi premium-boende, transferer och arrangemang i alla stora affärsdestinationer.",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedikerad Reseassistent",
    description:
      "En personlig reseassistent som känner dina preferenser och säkerställer att varje resa lever upp till dina förväntningar.",
  },
  {
    icon: Star,
    title: "Premium-boende",
    description:
      "Utvalda affärshotell och boutique-boenden med snabb Wi-Fi, arbetsplatser och läge nära dina möten.",
  },
  {
    icon: Briefcase,
    title: "Företagskonton",
    description:
      "Smidig fakturering, månadsrapporter och möjlighet att samla allt på ett och samma företagskonto.",
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
          <h1 className="font-display text-4xl md:text-6xl text-white">
            Smidiga <em className="italic font-light text-gold-light">Affärsresor</em>
          </h1>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
            "Din tid är värdefull. Vi ser till att varje minut av din affärsresa är optimerad."
          </p>
          <div className="w-8 h-px bg-primary mx-auto mt-8" />
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Vad vi erbjuder</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Allt du behöver — ingenting du inte behöver
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b) => (
              <div key={b.title} className="p-8 border border-border hover:border-primary transition-colors">
                <b.icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="font-display text-xl text-foreground mb-2">{b.title}</h3>
                <div className="w-6 h-px bg-primary mb-4" />
                <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Populära destinationer</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Världens ledande affärsstäder
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {destinations.map((d) => (
              <div key={d.city} className="bg-background p-6 border border-border text-center hover:border-primary transition-colors">
                <h3 className="font-display text-2xl text-foreground mb-1">{d.city}</h3>
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
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Låt oss ta hand om dina affärsresor
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            Kontakta oss för en kostnadsfri genomgång av hur vi kan effektivisera era företagsresor.
          </p>
          <Link to="/contact">
            <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm">
              Kontakta oss <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
