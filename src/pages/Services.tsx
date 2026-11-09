import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import sportsImage from "@/assets/kaisen-sports.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";
import groupImageAsset from "@/assets/kaisen-group-europe-skyline.jpg.asset.json";
const groupImage = groupImageAsset.url;
import heroImage from "@/assets/kaisen-hero.jpg";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";

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

  <PageHero
  image={heroImage}
  imageAlt="KAISEN TRAVEL GROUP"
  eyebrow="Våra specialiteter"
  title={<>Upplevelser & <em className="italic font-light text-white">Tjänster</em></>}
  action={null}
  />

  {/* Intro */}
  <section className="sb-section-alt">
  <div className="sb-container max-w-[880px] text-center">
   <p className="font-display text-2xl md:text-[34px] text-foreground italic font-semibold uppercase leading-tight">
   "Varje resa börjar med ett samtal. Vi lyssnar först - sen bygger vi något extraordinärt."
   </p>
  </div>
  </section>

  {/* Tjänster */}
  {categories.map((cat, index) => (
  <section key={cat.id} id={cat.id} className={index % 2 === 1 ? "sb-section-alt" : "sb-section"}>
   <div className="sb-container">
   <div className={`grid md:grid-cols-2 gap-8 lg:gap-14 items-center ${index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
    <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
    <img
     src={cat.image}
     alt={cat.title}
     className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
    />
    </div>
    <div>
    <p className="eyebrow text-primary uppercase mb-1">
     {cat.tag}
    </p>
    <h2 className="font-display text-3xl md:text-[44px] text-foreground mb-4">{cat.title}</h2>
    <p className="text-foreground/80 leading-relaxed mb-6 text-[15px]">{cat.description}</p>
    <ul className="space-y-2.5 mb-8">
     {cat.features.map((f) => (
     <li key={f} className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-white"><Check className="h-3.5 w-3.5" /></span>
      <span className="text-foreground/85">{f}</span>
     </li>
     ))}
    </ul>
    <Link to={cat.cta} className="sb-btn-primary">
     {cat.ctaLabel}
     <ArrowRight className="h-4 w-4" />
    </Link>
    </div>
   </div>
   </div>
  </section>
  ))}

  <CtaBand
  eyebrow="Skräddarsytt av naturen"
  title="Hittar du inte det du söker?"
  text="Vår expertis sträcker sig längre än kategorierna. Berätta om din vision så gör vi den till verklighet."
  >
  <Link to="/contact" className="sb-btn-light">
   Prata med en rådgivare
  </Link>
  </CtaBand>

  <RequestCta />
      <Footer />
  </div>
 );
}
