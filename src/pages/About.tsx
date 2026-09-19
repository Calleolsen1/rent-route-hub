import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useInquiryDialog } from "@/components/InquiryDialog";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import TeamSection from "@/components/TeamSection";
import heroImage from "@/assets/about-hero.jpg";
import founderImage from "@/assets/about-founder.jpg";

const values = [
{
 title: "Personlig Service",
 desc: "Vi tror att den bästa reseupplevelsen börjar med ett genuint samtal. Ingen mall, ingen automatisering - bara människor som bryr sig om din resa."
},
{
 title: "Expertis i Världsklass",
 desc: "Vårt team har djup erfarenhet inom alla resekategorier - från sportevent och konferenser till lyxresor och gruppresor i alla storlekar."
},
{
 title: "Pålitlighet",
 desc: "Vi vet vad som krävs vet vi vad som krävs för att leverera - varje gång, utan undantag."
},
{
 title: "Diskretion",
 desc: "Vi hanterar alla kundrelationer med fullständig konfidentialitet och professionell integritet - oavsett uppdragets storlek."
}];


const expertise = [
{ area: "Gruppresor & Logistik", years: "Erfaren" },
{ area: "Sportevent & VIP-biljetter", years: "Erfaren" },
{ area: "Konferenser & Incentive", years: "Erfaren" },
{ area: "Affärs- & Privatresor", years: "Erfaren" }];


import { usePageMeta } from "@/lib/usePageMeta";

export default function About() {
  const { open: openInquiry } = useInquiryDialog();
  usePageMeta({
    title: "Om oss - Kaisen Travel Group",
    description: "Kaisen Travel Group arrangerar skräddarsydda lyx- och sportresor. Personlig service från en dedikerad rådgivare - inga mallar, inga callcenter.",
  });
  return (
  <div className="min-h-screen">
  <Navbar />

  {/* Hero */}
  <section className="relative h-[38vh] min-h-[280px] flex items-end">
  <div className="absolute inset-0">
  <img src={heroImage} alt="Om Kaisen Travel Group" className="w-full h-full object-cover" />
  <div className="absolute inset-0 bg-navy/70" />
  </div>
  <div className="relative container mx-auto px-4 pb-14">
  <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Om oss</p>
  <h1 className="font-display text-4xl md:text-6xl text-white">
  Resespecialister på <em className="italic font-light text-white">en annan nivå</em>
  </h1>
  </div>
  </section>

  {/* Intro + founder image */}
  <section className="py-12 md:py-16 bg-cream">
  <div className="container mx-auto px-4">
  <div className="grid md:grid-cols-2 gap-16 items-center">
  <div>
  <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vilka vi är</p>
  <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2 leading-tight">
   Vi tillhör eliten inom resor
  </h2>
  <div className="w-10 h-px bg-primary mb-8" />
  <p className="text-foreground leading-relaxed italic mb-6">
  Vi tillhör eliten inom resor - precis som reseupplevelsen, matchen eller loppet du ska uppleva.
  </p>
  <div className="space-y-5 text-muted-foreground leading-relaxed">
  <p>
  Kaisen Travel Group är en resebyrå för dig som uppskattar personlig service, gedigen erfarenhet och någon som verkligen bryr sig om hela resan. Vi är ett mindre team av seniora resespecialister med över 50 års samlad erfarenhet från resebranschen.
  </p>
  </div>
  </div>
  <div className="relative">
  <div className="aspect-[4/5] overflow-hidden">
  <img src={founderImage} alt="Grundare Kaisen Travel Group" className="w-full h-full object-cover" />
  </div>
  {/* TODO: Avkommentera och fyll i riktig siffra när data finns.
  <div className="absolute -bottom-4 -right-4 bg-navy p-6 max-w-[200px]">
  <div className="font-display text-3xl text-white mb-1">...</div>
  <div className="text-[10px] tracking-[0.2em] uppercase text-primary font-sans">År i branschen</div>
  </div>
  */}
  </div>
  </div>
  </div>
  </section>

  {/* Vi bryr oss */}
  <section className="py-12 md:py-16 bg-background">
  <div className="container mx-auto px-4 max-w-3xl">
  <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vår filosofi</p>
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
  <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vårt Team</p>
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
  <div className="grid sm:grid-cols-2 gap-x-10 mt-10 border border-border">
  {expertise.map((e, i) =>
  <div
  key={e.area}
  className={`flex items-center justify-between p-6 hover:bg-accent/30 transition-colors ${
  i < expertise.length - 1 ? "border-b border-border" : ""}`
  }>

  <span className="font-display text-lg text-foreground">{e.area}</span>
  <span className="text-primary text-sm font-sans tracking-wider">{e.years}</span>
  </div>
  )}
  </div>
  </div>
  </section>

  {/* Mer än det du ser på hemsidan */}
  <section className="py-12 md:py-16 bg-background">
  <div className="container mx-auto px-4 max-w-3xl">
  <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Upplevelser & Tjänster</p>
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

  {/* References strip */}
  <section className="bg-navy py-16 border-t border-primary/20">
  <div className="container mx-auto px-4">
  <p className="text-center text-xs tracking-[0.3em] text-primary uppercase mb-10 font-sans">Tidigare uppdrag & kunder</p>
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
  {/* TODO: ersätt med riktiga kundreferenser när tillstånd finns */}
  {[
  { label: "Sportresor", detail: "VM, EM & ligamatcher" },
  { label: "Företag", detail: "Incentive & konferenser" },
  { label: "Organisationer", detail: "Storskaliga event" },
  { label: "Privata Sällskap", detail: "Skräddarsydda resor" }].
  map((ref) =>
  <div key={ref.label} className="border-t border-white/10 pt-6">
  <h3 className="font-display text-lg text-white mb-2">{ref.label}</h3>
  <p className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans">{ref.detail}</p>
  </div>
  )}
  </div>
  </div>
  </section>

  {/* Values */}
  <section className="py-12 md:py-16 bg-background">
  <div className="container mx-auto px-4">
  <div className="text-center mb-14">
  <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Vad vi står för</p>
  <h2 className="font-display text-3xl md:text-4xl text-foreground">
  Våra Värderingar
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
  <section className="bg-cream py-20 border-t border-border">
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
