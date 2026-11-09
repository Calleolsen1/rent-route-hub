import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useInquiryDialog } from "@/components/InquiryDialog";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import TeamSection from "@/components/TeamSection";
import heroImage from "@/assets/about-hero.jpg";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";

const values = [
  {
    title: "Personlig service",
    desc: "Du möter erfarna resespecialister som lyssnar, förstår dina önskemål och hjälper dig att skapa en resa som passar just dig.",
  },
  {
    title: "Kompetens byggd på erfarenhet",
    desc: "Sedan 1990 har vi samlat kunskap och erfarenhet inom sportresor, gruppresor och konferenser. Vi vet vad som krävs för att planera och genomföra resor där detaljerna gör skillnaden.",
  },
  {
    title: "Trygghet hela vägen",
    desc: "Med noggrann planering, etablerade utvalda leverantörer och resegaranti skapar vi trygghet före, under och efter resan.",
  },
  {
    title: "Förtroende och diskretion",
    desc: "Vi värnar om våra kundrelationer och hanterar varje uppdrag med integritet, respekt och diskretion. Oavsett om det gäller en privat resa, en företagsgrupp eller ett större evenemang kan du lita på vårt professionella omdöme.",
  },
];




import { usePageMeta } from "@/lib/usePageMeta";

export default function About() {
  const { open: openInquiry } = useInquiryDialog();
  usePageMeta({
    title: "Om oss - Kaisen Travel Group",
    description: "KAISEN TRAVEL GROUP arrangerar skräddarsydda sportresor, träningsläger och gruppresor. Personlig service från en dedikerad rådgivare - inga mallar, inga callcenter.",
  });
  return (
  <div className="min-h-screen">
  <Navbar />

  <PageHero
  image={heroImage}
  imageAlt="Om KAISEN TRAVEL GROUP"
  eyebrow="Om oss"
  title={<>Resespecialister på <em className="italic font-light text-white">en annan nivå</em></>}
  action={null}
  />

  {/* Intro */}
  <section className="sb-section-alt">
  <div className="sb-container max-w-[880px]">
  <div>
  <p className="eyebrow text-primary uppercase mb-1">Vilka vi är</p>
  <h2 className="font-display text-3xl md:text-[44px] text-foreground mb-5">
   Vi tillhör eliten inom resor
  </h2>
  <p className="text-foreground text-lg leading-relaxed italic mb-5">
  Vi tillhör eliten inom resor - precis som reseupplevelsen, matchen eller loppet du ska uppleva.
  </p>
  <div className="space-y-4 text-foreground/80 text-[15px] leading-relaxed">
  <p>
  KAISEN TRAVEL GROUP är en resebyrå för dig som uppskattar personlig service, gedigen erfarenhet och någon som verkligen bryr sig om hela resan. Vi är ett mindre team av seniora resespecialister med över 50 års samlad erfarenhet från resebranschen.
  </p>
  </div>
  </div>
  </div>
  </section>

  {/* Vi bryr oss */}
  <section className="sb-section">
  <div className="sb-container max-w-[880px]">
  <p className="eyebrow text-primary uppercase mb-1">Vår filosofi</p>
  <h2 className="font-display text-3xl md:text-[44px] text-foreground mb-5">
  Vi bryr oss. <em className="italic font-light">Hela vägen.</em>
  </h2>
  <div className="space-y-4 text-foreground/80 text-[15px] leading-relaxed">
  <p>
  För oss handlar en riktigt bra resa om mer än att hitta flyg, hotell och biljetter. Det handlar om detaljerna, tryggheten och känslan av att ha någon kunnig vid sin sida.
  </p>
  <p>
  Vi lägger stor vikt vid att förstå vad du faktiskt vill uppleva och hitta den lösning som passar just dig, ditt sällskap eller din grupp. Oavsett om det handlar om en fotbollsresa, Formel 1, ett träningsläger eller en större gruppresa är vårt mål detsamma: att göra resan så bra och smidig som möjligt.
  </p>
  </div>
  </div>
  </section>

  {/* Senior kompetens */}
  <section className="sb-section-alt">
  <div className="sb-container max-w-[880px]">
  <p className="eyebrow text-primary uppercase mb-1">Vårt Team</p>
  <h2 className="font-display text-3xl md:text-[44px] text-foreground mb-5">
  Senior kompetens. <em className="italic font-light">Personlig service.</em>
  </h2>
  <div className="space-y-4 text-foreground/80 text-[15px] leading-relaxed">
  <p>
  KAISEN består av resespecialister med lång erfarenhet och djup kunskap om de resor och upplevelser vi erbjuder. Det kombinerar vi med starka relationer och konkurrenskraftiga avtal med våra leverantörer.
  </p>
  <p>
  Resultatet är det vi tycker att en modern resebyrå borde stå för: hög kompetens, personlig service och ett genuint engagemang.
  </p>
  </div>
  </div>
  </section>

  {/* Mer än det du ser på hemsidan */}
  <section className="sb-section">
  <div className="sb-container max-w-[880px]">
  <p className="eyebrow text-primary uppercase mb-1">Upplevelser & Tjänster</p>
  <h2 className="font-display text-3xl md:text-[44px] text-foreground mb-5">
  Mer än det du ser <em className="italic font-light">på hemsidan</em>
  </h2>
  <div className="space-y-4 text-foreground/80 text-[15px] leading-relaxed">
  <p>
  Se inte vår hemsida som en katalog över allt vi kan erbjuda - utan som en dörröppnare till vår resevärld.
  </p>
  <p>
  Har du en idé, ett evenemang eller en resa som du inte hittar här? Hör av dig. Vi välkomnar en dialog och hjälper gärna till att hitta rätt lösning, även när den inte finns färdigpaketerad på hemsidan.
  </p>
  </div>
   <p className="font-display text-2xl md:text-[28px] font-semibold uppercase text-foreground mt-10">
   Berätta vart du vill - så hjälper vi dig hela vägen.
   </p>
   <div className="mt-6">
   <Button
   size="lg"
   className="h-11 rounded-lg bg-primary text-white hover:bg-navy-deep px-8 font-display uppercase font-semibold tracking-wide text-base border-0"
   onClick={() =>
   openInquiry({
   type: "contact",
   presetTopic: "Begär offert",
   heading: "Begär offert",
   intro: "Berätta vart du vill resa så återkommer vi med en skräddarsydd offert.",
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

  {/* Trygg partner strip */}
  <section className="bg-navy-deep py-12 md:py-16">
  <div className="sb-container">
  <p className="eyebrow text-sky-300 uppercase mb-6 md:mb-8 text-center">En erfaren partner – en tryggare upplevelse</p>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {[
  { label: "OFFICIELLA BILJETTER", detail: "Genom utvalda, officiella biljettleverantörer" },
  { label: "RESEGARANTI", detail: "Resegaranti ställd hos Kammarkollegiet" },
  { label: "IATA & AMADEUS", detail: "IATA-certifierade med Amadeus-licens och tillgång till flygbolag världen över" }].
  map((ref) =>
  <div key={ref.label} className="rounded-lg border border-white/15 bg-white/[0.04] p-6 text-center">
  <h3 className="font-display text-xl italic font-bold text-white mb-2">{ref.label}</h3>
  <p className="text-white/70 text-sm leading-relaxed">{ref.detail}</p>
  </div>
  )}
  </div>
  </div>
  </section>

  {/* Values */}
  <section className="sb-section">
  <div className="sb-container">
  <div className="mb-8 md:mb-10">
  <p className="eyebrow text-primary uppercase mb-1">Varför resa med KAISEN TRAVEL GROUP?</p>
  <h2 className="font-display text-3xl md:text-[44px] text-foreground">
  Erfarenhet som märks. Engagemang som känns.
  </h2>
  </div>
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {values.map((v) =>
  <div key={v.title} className="sb-card p-5 border-t-4 border-t-primary">
  <h3 className="font-display text-xl text-foreground mb-3">{v.title}</h3>
  <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
  </div>
  )}
  </div>
  </div>
  </section>

  <TeamSection />

  <CtaBand
  title="Redo att Planera Er Resa?"
  text="En personlig konversation är alltid startpunkten för en bra resa. Kontakta oss idag."
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
