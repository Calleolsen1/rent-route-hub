import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Users, Projector, Utensils, Wifi, Car, Award, Mic2, Coffee, Palette, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import InquiryForm from "@/components/InquiryForm";
import FloatingInquiryButton from "@/components/FloatingInquiryButton";
import konferensHero from "@/assets/konferens-hero.jpg";
import konferens1 from "@/assets/konferens-dinner.jpg";
import konferens2 from "@/assets/konferens-event.jpg";

const packages = [
  {
    icon: Mic2,
    title: "Konferens & Möten",
    tagline: "Lokaler · AV-teknik · Koordinering",
    desc: "Vi bokar rätt lokal för er grupps storlek och teknikbehov. Allt från små mötesrum till kongresshallar.",
  },
  {
    icon: Utensils,
    title: "Catering & Middagar",
    tagline: "Fika · Lunch · Galamiddag",
    desc: "Från enkel fika till flerrättersmiddagar med underhållning. Mat som ger energi och imponerar.",
  },
  {
    icon: Palette,
    title: "Aktiviteter & Upplevelser",
    tagline: "Teambuilding · Kultur · Äventyr",
    desc: "Matlagningskurser, privata museibesök, vinprovningar eller utomhusäventyr. Kombinera jobb med minnen.",
  },
  {
    icon: Car,
    title: "Transport & Logistik",
    tagline: "Flyg · Transfer · Shuttle",
    desc: "Vi hanterar alla deltagares resor - från flygbiljetter till shuttlebussar mellan hotell och lokal.",
  },
  {
    icon: Wifi,
    title: "Teknik & IT-support",
    tagline: "Uppkoppling · Streaming · Helpdesk",
    desc: "Stabil wifi, hybrid-lösningar och tekniker på plats. Så inget strular när det väl gäller.",
  },
  {
    icon: Award,
    title: "Event & Underhållning",
    tagline: "Speaker · Shower · Middagsarrangemang",
    desc: "Talare, shower och kvällsarrangemang som höjer evenemanget. Vi koordinerar hela upplevelsen.",
  },
];

const formats = [
  { title: "Dagsmöte", desc: "Lokal, teknik, lunch och fika - allt klart när ni kommer.", guests: "10-50" },
  { title: "2-3 dagars konferens", desc: "Boende, middagar och aktiviteter. Komplett paket.", guests: "20-150" },
  { title: "Incentive-resa", desc: "Belöna era bästa medarbetare med en upplevelse utomlands.", guests: "10-100" },
  { title: "Stor kongress", desc: "Internationella kongresser i Europas bästa kongresscentra.", guests: "100-500+" },
];

export default function Konferens() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[42vh] min-h-[320px] flex items-end">
        <div className="absolute inset-0">
          <img src={konferensHero} alt="Konferensresor utomlands" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/72" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Konferens & Event</p>
          <h1 className="font-display text-4xl md:text-6xl text-white">
            Event som <em className="italic font-light text-white">imponerar</em>
          </h1>
          <p className="text-white/70 mt-4 text-lg font-light max-w-lg">
            Vi sköter detaljerna. Du fokuserar på innehållet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#forfragan">
              <Button className="rounded-full bg-primary hover:bg-primary/90 px-7 py-6 text-sm tracking-wider">
                <MessageSquare className="mr-2 h-4 w-4" />
                Begär offert
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Packages Grid - SALES FIRST */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Vad Vi Fixar</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Helheten - <em className="italic font-light">från idé till avslut</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.title} className="group bg-cream border border-border p-8 hover:border-primary transition-all duration-300">
                <pkg.icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="font-display text-xl text-foreground mb-1">{pkg.title}</h3>
                <p className="text-xs tracking-wider text-primary uppercase font-sans mb-3">{pkg.tagline}</p>
                <div className="w-6 h-px bg-primary mb-4" />
                <p className="text-muted-foreground text-sm leading-relaxed">{pkg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formats - compact cards */}
      <section className="py-12 md:py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
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
                  <div key={f.title} className="border border-border bg-background p-6 hover:border-primary transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-lg text-foreground">{f.title}</h3>
                      <span className="text-xs tracking-[0.15em] text-primary uppercase font-sans bg-primary/10 px-2 py-1">{f.guests} deltagare</span>
                    </div>
                    <p className="text-muted-foreground text-sm">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={konferens2}
                alt="Konferens utomlands"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Full Service - short pitch */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="aspect-[4/3] overflow-hidden md:order-1">
              <img
                src={konferens1}
                alt="Konferensmiddag"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
                Komplett service
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">
                En kontaktpunkt. Allt löst.
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-6">
                Istället för att ringa hotell, lokal, catering och teknik separat - pratar du med oss. Vi koordinerar hela kedjan och ser till att inget glöms.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {["Lokalbokning", "AV & teknik", "Catering", "Logistik", "Aktiviteter", "Support på plats"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <a href="#forfragan">
                <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                  Begär offert
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section id="forfragan" className="py-16 md:py-24 bg-cream">
        <div className="container mx-auto px-4 max-w-3xl">
          <InquiryForm
            type="conference"
            eyebrow="Begär offert"
            heading="Berätta om er konferens"
            intro="Antal deltagare, ungefärliga datum, destination och budget. Vi återkommer med ett komplett förslag."
          />
        </div>
      </section>

      <FloatingInquiryButton label="Begär offert" />
      <Footer />
    </div>
  );
}
