import { Link } from "react-router-dom";
import { ArrowRight, Star, Shield, Clock, Phone, Plane, Car } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import InquiryForm from "@/components/InquiryForm";
import vipImage from "@/assets/kaisen-vip.jpg";
import vipConcierge from "@/assets/vip-concierge.jpg";
import vipJet from "@/assets/vip-jet.jpg";
import vipTransfer from "@/assets/vip-transfer.jpg";

const services = [
 {
 icon: Phone,
 title: "Personlig Resekonsult",
 description:
 "Du får en dedikerad kontaktperson som lär känna dina preferenser, rutiner och önskemål. Oavsett om det gäller en privat semester eller en viktig affärsresa - vi finns där.",
 },
 {
 icon: Star,
 title: "Skräddarsydda Resplaner",
 description:
 "Ingen mall, ingen standardlösning. Vi bygger din resa från grunden baserat på dina behov - hotell, transport, aktiviteter och tajming väljs ut noggrant för just dig.",
 },
 {
 icon: Clock,
 title: "Tillgängliga Dygnet Runt",
 description:
 "Tidszoner spelar ingen roll. Vår service är tillgänglig 24/7 - för sista-minutenändringar, akuta behov eller bara en fråga längs vägen.",
 },
 {
 icon: Shield,
 title: "Full Diskretion",
 description:
 "Vi hanterar alla resor med absolut konfidentialitet. Din integritet skyddas i varje steg - oavsett om du reser privat eller i yrkesroll.",
 },
 {
 icon: Plane,
 title: "Privatflyg & Business Class",
 description:
 "Från privata jetflygningar till prioriterad business class - vi väljer det bästa alternativet för din resa, tid och komfort.",
 },
 {
 icon: Car,
 title: "Chauffeur & Transfer",
 description:
 "Lyxiga transferlösningar i hela världen. Chauffördriven Mercedes, privata fordon och VIP-mottagning på flygplatser ingår alltid i vår service.",
 },
];

const howItWorks = [
 {
 step: "01",
 title: "Du berättar - vi lyssnar",
 description:
 "Berätta om din resa, dina önskemål och vad som är viktigast för dig. Inget är för litet eller för stort.",
 },
 {
 step: "02",
 title: "Vi skräddarsyr",
 description:
 "Utifrån din briefing skapar vi ett komplett resförslag med hotell, transport och upplevelser - allt handplockat.",
 },
 {
 step: "03",
 title: "Du godkänner, vi levererar",
 description:
 "När du är nöjd tar vi hand om allt. Du fokuserar på resan - vi hanterar logistiken.",
 },
];

export default function VIPService() {
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero
 image={vipImage}
 imageAlt="VIP Service"
 eyebrow="Tjänster - VIP Service"
 title={<>Resor på <em className="italic text-white">Dina Villkor</em></>}
 action={null}
 >
 White glove service för privat- och affärsresenären som värdesätter tid, komfort och omsorg om detaljerna.
 </PageHero>

 {/* Intro quote */}
 <section className="sb-section-alt">
 <div className="sb-container max-w-3xl text-center">
 <p className="font-display text-2xl md:text-3xl text-foreground italic font-semibold uppercase leading-snug">
 "Vi tar hand om varje detalj - så att du kan fokusera på det som verkligen spelar roll."
 </p>
 </div>
 </section>

 {/* Concierge image + intro text */}
 <section className="sb-section">
 <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
 <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
 <img
 src={vipConcierge}
 alt="Personlig concierge service"
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>
 <div>
 <p className="eyebrow text-primary uppercase mb-1">Privat & Affärsresor</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
 En Service Som Anpassar Sig Efter Dig
 </h2>
 <p className="text-foreground/80 leading-relaxed mb-4 text-[15px]">
 Oavsett om du planerar en privat familjesemester, ett romantiskt citybreak eller en intensiv affärsresa med tight schema - vi levererar samma höga servicenivå.
 </p>
 <p className="text-foreground/80 leading-relaxed mb-8 text-[15px]">
 Vår white glove service innebär att inget lämnas åt slumpen. Från first contact till hemkomst finns vi alltid ett samtal bort.
 </p>
 <Link to="/contact" className="sb-btn-primary">
 Kom i kontakt
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 </section>

 {/* Services grid */}
 <section className="sb-section-alt">
 <div className="sb-container">
 <p className="eyebrow text-primary uppercase mb-1">Vad Ingår</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-8 md:mb-10">
 Komplett White Glove Service
 </h2>
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
 {services.map((s) => {
 const Icon = s.icon;
 return (
 <div key={s.title} className="sb-card p-6 hover:border-primary/50 hover:shadow-md transition-all">
 <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white"><Icon className="h-5 w-5" /></span>
 <h3 className="font-display text-xl text-foreground mb-2">{s.title}</h3>
 <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* Jet image + how it works */}
 <section className="sb-section">
 <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
 <div>
 <p className="eyebrow text-primary uppercase mb-1">Så här fungerar det</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-6">
 Enkelt för Dig - Detaljerat för Oss
 </h2>
 <div className="space-y-3">
 {howItWorks.map((step) => (
 <div key={step.step} className="sb-card flex gap-4 p-5">
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary font-display text-lg font-bold italic text-white">
 {step.step}
 </span>
 <div>
 <h3 className="font-display text-xl text-foreground mb-1">{step.title}</h3>
 <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
 <img
 src={vipJet}
 alt="Privatjet interiör"
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>
 </div>
 </section>

 {/* Transfer image strip */}
 <section className="sb-container pb-12 md:pb-16">
 <div className="relative h-64 md:h-72 overflow-hidden rounded-lg">
 <img src={vipTransfer} alt="VIP transfer service" className="w-full h-full object-cover object-center" />
 <div className="absolute inset-0 bg-navy-deep/65 flex items-center justify-center px-6">
 <div className="text-center">
 <p className="eyebrow text-sky-300 uppercase mb-2">Varje detalj räknas</p>
 <p className="font-display text-3xl md:text-[36px] lg:text-[44px] text-white italic font-bold uppercase leading-tight">
 Från avresa till ankomst - sömlöst.
 </p>
 </div>
 </div>
 </div>
 </section>

 {/* Inquiry form */}
 <section id="forfragan" className="sb-section-alt">
 <div className="sb-container max-w-3xl">
 <div className="sb-card p-5 sm:p-8">
 <InquiryForm
 type="vip"
 eyebrow="Privat konsultation"
 heading="Berätta om din resa"
 intro="Vi lyssnar, vi planerar - och sedan levererar vi. En personlig rådgivare återkommer för en privat konsultation."
 />
 </div>
 </div>
 </section>

 <Footer />
 </div>
 );
}
