import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Trophy, Briefcase, Heart, Mountain, Utensils, Check } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import groupImage from "@/assets/kaisen-group.jpg";
import groupAdventure from "@/assets/group-adventure.jpg";
import groupCorporate from "@/assets/group-corporate.jpg";
import groupSports from "@/assets/group-sports.jpg";

const groupTypes = [
  {
    icon: Trophy,
    title: "Sportresor med Kompisgänget",
    desc: "Fotboll i London, F1 i Monaco, golf i Skottland eller skidor i Alperna — vi ordnar biljetter, boende och transfer för hela gruppen.",
  },
  {
    icon: Briefcase,
    title: "Företags-Getaways",
    desc: "Team building, kickoffer och incentiveresor som skapar minnen och stärker sammanhållningen. Vi skräddarsyr hela upplägget för er grupp.",
  },
  {
    icon: Heart,
    title: "Privata Sällskapsresor",
    desc: "Jubileum, polterabend, vänner som länge pratat om en gemensam resa — vi gör det enkelt att resa tillsammans.",
  },
  {
    icon: Mountain,
    title: "Äventyrsresor",
    desc: "Vandring, kayak, skidfärder eller roadtrips — för grupper som vill ha mer än poolkanten.",
  },
  {
    icon: Utensils,
    title: "Gastronomi & Kultur",
    desc: "Vinresor i Frankrike, matkurser i Italien, kulturresor i Spanien — upplevelser för grupper med gott om smak.",
  },
  {
    icon: Users,
    title: "Familjeresor i Grupp",
    desc: "Multigenerationella resor som passar alla — från barnbarn till morföräldrar. Vi hittar det som fungerar för hela sällskapet.",
  },
];

const process = [
  { step: "01", title: "Berätta om er grupp", desc: "Storlek, intressen, budget och vad ni drömmer om. Vi lyssnar och ställer rätt frågor." },
  { step: "02", title: "Vi tar fram ett förslag", desc: "Inom 48 timmar presenterar vi ett skräddarsytt upplägg med hotell, aktiviteter och prisalternativ." },
  { step: "03", title: "Vi finjusterar", desc: "Ni väljer och justerar tills allt känns rätt. Vi tar hand om detaljerna." },
  { step: "04", title: "Ni njuter — vi sköter resten", desc: "Från ankomst till avresa hanterar vi all logistik. Ni fokuserar på varandra." },
];

const inclusions = [
  "Privat transport och flygplatstransfer",
  "Hotell med grupprabatter",
  "Lokala guider och upplevelser",
  "Gemensamma middagar och aktiviteter",
  "Biljetter till sportevent och evenemang",
  "Support dygnet runt under resan",
  "Rådgivning om reseförsäkring för grupper",
  "Digital reseguide och packlista",
];

export default function GroupTravel() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[400px] flex items-end">
        <div className="absolute inset-0">
          <img src={groupImage} alt="Gruppresor" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/65" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">Gruppresor</p>
          <h1 className="font-sans font-semibold text-4xl md:text-6xl text-white leading-tight">
            Bättre tillsammans —<br />
            <em className="italic font-light text-gold-light">Alltid</em>
          </h1>
          <p className="text-white/70 mt-4 text-lg font-light max-w-lg">
            Från sporthelger med kompisgänget till företagets stora getaway. Vi planerar, ni upplever.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-sans font-semibold text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
            "Gruppresor kräver mer planering — och ger dubbelt så mycket tillbaka. Vi sköter det ena så ni kan fokusera på det andra."
          </p>
          <div className="w-8 h-px bg-primary mx-auto mt-8" />
        </div>
      </section>

      {/* Group types grid */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">För Alla Sorters Grupper</p>
            <h2 className="font-sans font-semibold text-3xl md:text-4xl text-foreground">
              Vad Vill Ni Uppleva?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-border">
            {groupTypes.map((gt, i) => {
              const Icon = gt.icon;
              return (
                <div
                  key={gt.title}
                  className={`p-8 hover:bg-accent/30 transition-colors border-border ${
                    i % 3 !== 2 ? "border-r" : ""
                  } ${i < groupTypes.length - 3 ? "border-b" : ""}`}
                >
                  <Icon className="h-5 w-5 text-primary mb-4" />
                  <h3 className="font-sans font-semibold text-xl text-foreground mb-2">{gt.title}</h3>
                  <div className="w-6 h-px bg-primary mb-3" />
                  <p className="text-muted-foreground text-sm leading-relaxed">{gt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sports image strip */}
      <section className="py-12 md:py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
                Sport & Vänner
              </span>
              <h2 className="font-sans font-semibold text-3xl md:text-4xl text-foreground mt-4 mb-2">
                Sporthelgen Ni Aldrig Glömmer
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-4">
                Fotboll i Premier League, formel 1 i Monaco, golf i St Andrews eller skidsemester i Åre — vi fixar biljetter, hotell och transfer för hela gänget.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Ni behöver inte koordinera vem som bokar vad. Vi tar hand om hela logistiken — ni fokuserar på att ha kul tillsammans.
              </p>
              <Link to="/contact">
                <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                  Planera er resa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={groupSports}
                alt="Sportevent med grupp"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Corporate image + text */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={groupCorporate}
                alt="Företagets getaway"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
                Företag & Team
              </span>
              <h2 className="font-sans font-semibold text-3xl md:text-4xl text-foreground mt-4 mb-2">
                Getaways som Stärker Teamet
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-4">
                En välplanerad företagsresa gör mer för sammanhållningen än tio interna möten. Vi skapar upplevelser som teamet pratar om länge efteråt.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Kickoff i Barcelona, incentiveresa till Kroatien eller en avslappnad retreat i Toscana — vi anpassar efter er budget, era mål och er grupp.
              </p>
              <Link to="/contact">
                <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                  Begär offert för företagsresor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 md:py-16 bg-navy">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Så fungerar det</p>
            <h2 className="font-sans font-semibold text-3xl md:text-4xl text-white">
              Enkelt för Er — <em className="italic font-light text-gold-light">Detaljerat för Oss</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((p) => (
              <div key={p.step} className="relative">
                <div className="font-sans font-semibold text-6xl text-gold/20 mb-4 leading-none">{p.step}</div>
                <h3 className="font-sans font-semibold text-xl text-white mb-3">{p.title}</h3>
                <div className="w-6 h-px bg-gold/40 mb-3" />
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Adventure image + what's included */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vad Ingår</p>
              <h2 className="font-sans font-semibold text-3xl md:text-4xl text-foreground mb-2">
                Allt Ordnat — <em className="italic font-light">Ingenting Glömt</em>
              </h2>
              <div className="w-10 h-px bg-primary mb-8" />
              <p className="text-muted-foreground leading-relaxed mb-8">
                Gruppresor har många rörliga delar. Vi hanterar dem alla — så att ingen i gruppen behöver vara "den som fixar allt".
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 mb-10">
                {inclusions.map((inc) => (
                  <li key={inc} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{inc}</span>
                  </li>
                ))}
              </ul>
              <Link to="/contact">
                <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
                  Kom i kontakt
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={groupAdventure} alt="Äventyrsresa i grupp" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="bg-primary p-6">
                <div className="font-sans font-semibold text-2xl text-primary-foreground mb-1">Grupper från 6 till 200+</div>
                <p className="text-primary-foreground/70 text-sm">Ingen grupp är för liten eller för stor. Vi skalar vår service efter era behov.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
