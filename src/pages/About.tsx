import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useInquiryDialog } from "@/components/InquiryDialog";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import TeamSection from "@/components/TeamSection";
import heroImage from "@/assets/about-hero.jpg";

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
    title: "Om oss - KAISEN TRAVEL GROUP",
    description: "KAISEN TRAVEL GROUP arrangerar skräddarsydda sportresor, träningsläger och gruppresor. Personlig service från en dedikerad rådgivare - inga mallar, inga callcenter.",
  });
  return (
  <div className="min-h-screen">
  <Navbar />

  {/* Hero */}
  <section className="relative h-[38vh] min-h-[280px] flex items-end">
  <div className="absolute inset-0">
  <img src={heroImage} alt="Om KAISEN TRAVEL GROUP" className="w-full h-full object-cover" />
  <div className="absolute inset-0 bg-navy/70" />
  </div>
  <div className="relative container mx-auto px-4 pb-14">
  <p className="text-[11px] sm:text-xs eyebrow text-white/75 uppercase mb-3 font-sans">Om oss</p>
  <h1 className="font-display text-4xl md:text-6xl text-white">
  Resespecialister på <em className="italic font-light text-white">en annan nivå</em>
  </h1>
  </div>
  </section>

  {/* Intro */}
  <section className="py-12 md:py-16 bg-cream">
  <div className="container mx-auto px-4 max-w-3xl">
  <div>
  <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Vilka vi är</p>
  <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2 leading-tight">
   Vi tillhör eliten inom resor
  </h2>
  <div className="w-10 h-px bg-primary mb-8" />
  <p className="text-foreground leading-relaxed italic mb-6">
  Vi tillhör eliten inom resor - precis som reseupplevelsen, matchen eller loppet du ska uppleva.
  </p>
  <div className="space-y-5 text-muted-foreground leading-relaxed">
  <p>
  KAISEN TRAVEL GROUP är en resebyrå för dig som uppskattar personlig service, gedigen erfarenhet och någon som verkligen bryr sig om hela resan. Vi är ett mindre team av seniora resespecialister med över 50 års samlad erfarenhet från resebranschen.
  </p>
  </div>
  </div>
  </div>
  </section>

  {/* Vi bryr oss */}
  <section className="py-12 md:py-16 bg-background">
  <div className="container mx-auto px-4 max-w-3xl">
  <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Vår filosofi</p>
  <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2 leading-tight">
  Vi bryr oss. <em className="italic font-light">Hela vägen.</em>
  </h2>
  <div className="w-10 h-px bg-primary mb-8" />
  <div className="space-y-5 text-muted-foreground leading-relaxed">
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
  <section className="py-12 md:py-16 bg-cream">
  <div className="container mx-auto px-4 max-w-3xl">
  <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Vårt Team</p>
  <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2 leading-tight">
  Senior kompetens. <em className="italic font-light">Personlig service.</em>
  </h2>
  <div className="w-10 h-px bg-primary mb-8" />
  <div className="space-y-5 text-muted-foreground leading-relaxed">
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
  <section className="py-12 md:py-16 bg-background">
  <div className="container mx-auto px-4 max-w-3xl">
  <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Upplevelser & Tjänster</p>
  <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2 leading-tight">
  Mer än det du ser <em className="italic font-light">på hemsidan</em>
  </h2>
  <div className="w-10 h-px bg-primary mb-8" />
  <div className="space-y-5 text-muted-foreground leading-relaxed">
  <p>
  Se inte vår hemsida som en katalog över allt vi kan erbjuda - utan som en dörröppnare till vår resevärld.
  </p>
  <p>
  Har du en idé, ett evenemang eller en resa som du inte hittar här? Hör av dig. Vi välkomnar en dialog och hjälper gärna till att hitta rätt lösning, även när den inte finns färdigpaketerad på hemsidan.
  </p>
  </div>
   <p className="font-display text-xl md:text-2xl text-foreground mt-10">
   Berätta vart du vill - så hjälper vi dig hela vägen.
   </p>
   <div className="mt-6">
   <Button
   size="lg"
   className="rounded-full bg-navy text-white hover:bg-navy/90 px-10 tracking-wider text-sm font-semibold border-0"
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
  <section className="bg-navy py-16 border-t border-primary/20">
  <div className="container mx-auto px-4">
  <p className="text-center text-[11px] sm:text-xs eyebrow text-white uppercase mb-10 font-sans">En erfaren partner – en tryggare upplevelse</p>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
  {[
  { label: "OFFICIELLA BILJETTER", detail: "Genom utvalda, officiella biljettleverantörer" },
  { label: "RESEGARANTI", detail: "Resegaranti ställd hos Kammarkollegiet" },
  { label: "IATA & AMADEUS", detail: "IATA-certifierade med Amadeus-licens och tillgång till flygbolag världen över" }].
  map((ref) =>
  <div key={ref.label} className="border-t border-white/10 pt-6">
  <h3 className="font-display text-lg text-white mb-2">{ref.label}</h3>
  <p className="text-white/50 text-xs leading-relaxed font-sans">{ref.detail}</p>
  </div>
  )}
  </div>
  </div>
  </section>

  {/* Values */}
  <section className="py-12 md:py-16 bg-background">
  <div className="container mx-auto px-4">
  <div className="text-center mb-14">
  <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Varför resa med KAISEN TRAVEL GROUP?</p>
  <h2 className="font-display text-3xl md:text-4xl text-foreground">
  Erfarenhet som märks. Engagemang som känns.
  </h2>
  </div>
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
  {values.map((v) =>
  <div key={v.title} className="border-t border-border pt-6">
  <h3 className="font-display text-xl text-foreground mb-3">{v.title}</h3>
  <div className="w-6 h-px bg-primary mb-4" />
  <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
  </div>
  )}
  </div>
  </div>
  </section>

  <TeamSection />

  {/* CTA */}
  <section className="bg-cream py-12 sm:py-20 border-t border-border">
  <div className="container mx-auto px-4 text-center">
  <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
  Redo att Planera Er Resa?
  </h2>
  <p className="text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
  En personlig konversation är alltid startpunkten för en bra resa. Kontakta oss idag.
  </p>
  <Link to="/contact">
  <Button size="lg" className="rounded-full bg-navy text-white hover:bg-navy/90 px-10 tracking-wider text-sm font-semibold border-0">
  Kom i kontakt
  <ArrowRight className="ml-2 h-4 w-4" />
  </Button>
  </Link>
  </div>
  </section>

  <RequestCta />
      <Footer />
  </div>);

}
