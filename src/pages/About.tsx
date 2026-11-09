import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useInquiryDialog } from "@/components/InquiryDialog";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import TeamSection from "@/components/TeamSection";
const heroImage = PHOTO["about-hero"];
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";

const values = [
  {
    title: "Personlig service",
    desc: "Du har en och samma kontakt genom hela planeringen. Vi lyssnar in vad du vill uppleva och föreslår det som passar dig och ditt sällskap.",
  },
  {
    title: "Lång erfarenhet",
    desc: "Sedan 1990 har vi arrangerat sportresor, gruppresor och konferenser. Vi vet var det brukar uppstå problem och planerar för det i förväg.",
  },
  {
    title: "Trygghet före, under och efter",
    desc: "Noggrann planering, leverantörer vi har jobbat med länge och resegaranti hos Kammarkollegiet.",
  },
  {
    title: "Diskretion",
    desc: "Vi är rädda om våra kundrelationer. Privatresa, företagsgrupp eller större evenemang: varje uppdrag hanteras med respekt och omdöme.",
  },
];

import { usePageMeta } from "@/lib/usePageMeta";
import { PHOTO } from "@/data/photos";

export default function About() {
  const { open: openInquiry } = useInquiryDialog();
  usePageMeta({
    title: "Om oss - Kaisen Travel Group",
    description: "KAISEN TRAVEL GROUP arrangerar sportresor, träningsläger och gruppresor sedan 1990. Du har en egen rådgivare genom hela planeringen.",
  });
  return (
  <div className="min-h-screen">
  <Navbar />

  <PageHero
  image={heroImage}
  imageAlt="Om KAISEN TRAVEL GROUP"
  eyebrow="Om oss"
  title={<>Resespecialister <em className="italic font-light text-white">sedan 1990</em></>}
  action={null}
  />

  {/* Intro: editorial, left-aligned */}
  <section className="sb-section-alt">
  <div className="sb-container grid md:grid-cols-12 gap-6 md:gap-12">
  <div className="md:col-span-5">
  <p className="eyebrow text-primary uppercase mb-2">Vilka vi är</p>
  <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground">
  En mindre byrå med lång erfarenhet
  </h2>
  </div>
  <div className="md:col-span-7 space-y-4 text-foreground/80 text-[15px] leading-relaxed md:pt-8">
  <p>
  KAISEN TRAVEL GROUP är en resebyrå för dig som vill ha personlig service och någon som tar ansvar för hela resan. Vi är ett mindre team av seniora resespecialister med över 50 års samlad erfarenhet från resebranschen.
  </p>
  <p>
  Vi ställer samma krav på resan som du ställer på matchen eller loppet du ska se.
  </p>
  </div>
  </div>
  </section>

  {/* Philosophy + team side by side */}
  <section className="sb-section">
  <div className="sb-container grid md:grid-cols-2 gap-10 md:gap-14">
  <div>
  <p className="eyebrow text-primary uppercase mb-2">Vår filosofi</p>
  <h2 className="font-display text-3xl md:text-[36px] text-foreground mb-4">
  Vi tar hand om helheten
  </h2>
  <div className="space-y-4 text-foreground/80 text-[15px] leading-relaxed">
  <p>
  En bra resa handlar om mer än flyg, hotell och biljetter. Det är detaljerna, tryggheten och att ha någon kunnig att ringa när något ändras.
  </p>
  <p>
  Vi börjar med att förstå vad du vill uppleva och hittar sedan den lösning som passar dig, ditt sällskap eller din grupp. Fotbollsresa, Formel 1, träningsläger eller en större gruppresa: målet är detsamma, att resan ska bli så bra och smidig som möjligt.
  </p>
  </div>
  </div>
  <div>
  <p className="eyebrow text-primary uppercase mb-2">Vårt team</p>
  <h2 className="font-display text-3xl md:text-[36px] text-foreground mb-4">
  Ett erfaret team
  </h2>
  <div className="space-y-4 text-foreground/80 text-[15px] leading-relaxed">
  <p>
  Hos KAISEN arbetar resespecialister med lång erfarenhet och god kännedom om resmålen vi säljer. Till det kommer nära relationer och bra avtal med våra leverantörer.
  </p>
  <p>
  Så tycker vi att en resebyrå ska fungera i dag: kunnigt folk, personlig kontakt och ett verkligt intresse för att resan blir bra.
  </p>
  </div>
  </div>
  </div>
  </section>

  {/* Beyond the website */}
  <section className="sb-section-alt">
  <div className="sb-container grid md:grid-cols-12 gap-6 md:gap-12 items-end">
  <div className="md:col-span-7">
  <p className="eyebrow text-primary uppercase mb-2">Upplevelser och tjänster</p>
  <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
  Mer än det du ser <em className="italic font-light">på hemsidan</em>
  </h2>
  <div className="space-y-4 text-foreground/80 text-[15px] leading-relaxed">
  <p>
  Hemsidan visar ett urval, inte allt vi kan ordna.
  </p>
  <p>
  Har du en idé, ett evenemang eller en resa som du inte hittar här? Hör av dig. Vi hjälper gärna till att hitta en lösning, även när den inte finns färdigpaketerad.
  </p>
  </div>
  </div>
  <div className="md:col-span-5 md:text-right">
  <p className="font-display text-2xl md:text-[28px] text-foreground mb-5">
  Berätta vart du vill, så ordnar vi resten.
  </p>
  <Button
  size="lg"
  className="h-11 rounded-full bg-primary text-white hover:bg-primary/90 px-8 text-sm font-medium border-0"
  onClick={() =>
  openInquiry({
  type: "contact",
  presetTopic: "Begär offert",
  heading: "Begär offert",
  intro: "Berätta vart du vill resa så återkommer vi med en offert.",
  showTripParts: true,
  })
  }
  >
  Begär offert
  <ArrowRight className="ml-2 h-4 w-4" />
  </Button>
  </div>
  </div>
  </section>

  {/* Credentials: a plain row with dividers, no boxed cards */}
  <section className="bg-navy-deep py-10 md:py-12">
  <div className="sb-container">
  <p className="eyebrow text-white/60 uppercase mb-6">En trygg partner</p>
  <dl className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
  {[
  { label: "Officiella biljetter", detail: "Via utvalda, officiella biljettleverantörer" },
  { label: "Resegaranti", detail: "Ställd hos Kammarkollegiet" },
  { label: "IATA och Amadeus", detail: "IATA-certifierade med Amadeus-licens och tillgång till flygbolag världen över" }].
  map((ref) =>
  <div key={ref.label} className="py-4 sm:py-0 sm:px-6 first:sm:pl-0">
  <dt className="font-display text-xl text-white mb-1">{ref.label}</dt>
  <dd className="text-white/70 text-sm leading-relaxed">{ref.detail}</dd>
  </div>
  )}
  </dl>
  </div>
  </section>

  {/* Values: numbered list */}
  <section className="sb-section">
  <div className="sb-container">
  <div className="mb-8 md:mb-10 max-w-2xl">
  <p className="eyebrow text-primary uppercase mb-2">Varför resa med KAISEN TRAVEL GROUP</p>
  <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground">
  Det här kan du räkna med
  </h2>
  </div>
  <ol className="grid md:grid-cols-2 gap-x-14">
  {values.map((v, i) =>
  <li key={v.title} className="flex gap-5 border-t border-border py-6">
  <span className="font-display text-2xl text-primary/60 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
  <div>
  <h3 className="font-display text-xl text-foreground mb-2">{v.title}</h3>
  <p className="text-muted-foreground text-[15px] leading-relaxed">{v.desc}</p>
  </div>
  </li>
  )}
  </ol>
  </div>
  </section>

  <TeamSection />

  <CtaBand
  title="Redo att planera er resa?"
  text="Det bästa sättet att börja är ett samtal. Hör av dig så hjälper vi dig vidare."
  >
  <Link to="/contact" className="sb-btn-light">
  Kom i kontakt
  <ArrowRight className="h-4 w-4" />
  </Link>
  </CtaBand>

  <RequestCta />
      <Footer />
  </div>);

}
