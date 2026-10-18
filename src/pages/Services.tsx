import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import sportsImage from "@/assets/kaisen-sports.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";
import groupImageAsset from "@/assets/kaisen-group-europe-skyline.jpg.asset.json";
const groupImage = groupImageAsset.url;
import heroImage from "@/assets/kaisen-hero.jpg";

const categories = [
 {
  id: "group",
  tag: "Gruppresor",
  title: "Resor som blir bättre tillsammans",
  description: "Oavsett om det är en milstolpe att fira, en företagskonferens, en familjeåterförening eller en grupp likasinnade upptäcktsresande - vi sköter varje detalj så att ditt enda jobb är att njuta av stunden.",
  image: groupImage,
  features: [
  "Grupper från 8 till 200+ resenärer",
  "Dedikerad gruppsamordnare",
  "Förhandlade gruppriser och exklusiv tillgång",
  "Skräddarsydda program för alla intressen",
  "Flygplatstransfer och logistik",
  "Support på plats under hela resan",
  ],
  cta: "/group-travel",
  ctaLabel: "Utforska gruppresor",
 },
 {
  id: "sports",
  tag: "Sport & äventyr",
  title: "Sportupplevelser i toppklass",
  description: "Vi är den självklara byrån för sportentusiaster som ställer höga krav. Från golfresor till alpin skidåkning, segling till Formel 1-helger - vi tar dig till hjärtat av händelsen.",
  image: sportsImage,
  features: [
  "Fotbollsresor till Europas största ligor",
  "Formel 1 och motorsporthelger",
  "Skidresor till Alperna",
  "Golfresor med handplockade banor",
  "Träningsläger för lag och klubbar",
  "Personlig service från start till mål",
  ],
  cta: "/services/sportresor",
  ctaLabel: "Se våra sportresor",
 },
 {
  id: "luxury",
  tag: "Exklusiva resor",
  title: "Kvalitet utan kompromisser",
  description: "För resenärer som förväntar sig det lilla extra skapar vi upplevelser utöver det vanliga - exklusiv tillgång, handplockat boende och service som definierar destinationen.",
  image: luxuryImage,
  features: [
  "Handplockade hotell och boenden",
  "Skräddarsydda resprogram",
  "Exklusiva upplevelser och tillgång",
  "Personlig reseplanering",
  "Diskret och personlig service",
  ],
  cta: "/contact",
  ctaLabel: "Gör en förfrågan",
 },
];

export default function Services() {
 return (
  <div className="min-h-screen">
  <Navbar />

  {/* Hero */}
  <section className="relative h-[38vh] min-h-[280px] flex items-end">
  <div className="absolute inset-0">
   <img src={heroImage} alt="KAISEN TRAVEL GROUP" className="w-full h-full object-cover" />
   <div className="absolute inset-0 bg-navy/70" />
  </div>
  <div className="relative container mx-auto px-4 pb-14">
   <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans">Våra specialiteter</p>
   <h1 className="font-display text-4xl md:text-6xl text-white">
   Upplevelser & <em className="italic font-light text-white">Tjänster</em>
   </h1>
  </div>
  </section>

  {/* Intro */}
  <section className="bg-cream py-16">
  <div className="container mx-auto px-4 max-w-3xl text-center">
   <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
   "Varje resa börjar med ett samtal. Vi lyssnar först - sen bygger vi något extraordinärt."
   </p>
   <div className="w-8 h-px bg-primary mx-auto mt-8" />
  </div>
  </section>

  {/* Tjänster */}
  {categories.map((cat, index) => (
  <section key={cat.id} id={cat.id} className="py-10 md:py-14 bg-background">
   <div className="container mx-auto px-4">
   <div className={`grid md:grid-cols-2 gap-12 lg:gap-20 items-center ${index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
    <div className="aspect-[4/3] overflow-hidden">
    <img
     src={cat.image}
     alt={cat.title}
     className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
    />
    </div>
    <div>
    <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
     {cat.tag}
    </span>
    <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">{cat.title}</h2>
    <div className="w-10 h-px bg-primary mb-6" />
    <p className="text-muted-foreground leading-relaxed mb-8 text-base">{cat.description}</p>
    <ul className="space-y-3 mb-10">
     {cat.features.map((f) => (
     <li key={f} className="flex items-start gap-3 text-sm">
      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <span className="text-foreground/80">{f}</span>
     </li>
     ))}
    </ul>
    <Link to={cat.cta}>
     <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
     {cat.ctaLabel}
     <ArrowRight className="ml-2 h-4 w-4" />
     </Button>
    </Link>
    </div>
   </div>
   </div>
  </section>
  ))}

  {/* CTA */}
  <section className="bg-navy py-12 sm:py-20">
  <div className="container mx-auto px-4 text-center">
   <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Skräddarsytt av naturen</p>
   <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
   Hittar du inte det du söker?
   </h2>
   <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
   Vår expertis sträcker sig längre än kategorierna. Berätta om din vision så gör vi den till verklighet.
   </p>
   <Link to="/contact">
   <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm">
    Prata med en rådgivare
   </Button>
   </Link>
  </div>
  </section>

  <RequestCta />
      <Footer />
  </div>
 );
}
