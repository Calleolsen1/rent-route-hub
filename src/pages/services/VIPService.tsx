import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Shield, Clock, Phone, Plane, Car } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
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

 {/* Hero */}
 <section className="relative h-[42vh] min-h-[320px] flex items-end">
 <div className="absolute inset-0">
 <img src={vipImage} alt="VIP Service" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-navy/65" />
 </div>
 <div className="relative container mx-auto px-4 pb-16">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
 Tjänster - VIP Service
 </p>
 <h1 className="font-display text-4xl md:text-6xl text-white">
 Resor på <em className="italic font-light text-white">Dina Villkor</em>
 </h1>
 <p className="text-white/70 mt-4 text-lg font-light max-w-lg">
 White glove service för privat- och affärsresenären som värdesätter tid, komfort och omsorg om detaljerna.
 </p>
 </div>
 </section>

 {/* Intro quote */}
 <section className="bg-navy py-16 border-t border-primary/20">
 <div className="container mx-auto px-4 max-w-3xl text-center">
 <p className="font-display text-2xl md:text-3xl text-white italic font-light leading-relaxed">
 "Vi tar hand om varje detalj - så att du kan fokusera på det som verkligen spelar roll."
 </p>
 <div className="w-8 h-px bg-primary mx-auto mt-8" />
 </div>
 </section>

 {/* Concierge image + intro text */}
 <section className="py-12 md:py-16 bg-background">
 <div className="container mx-auto px-4">
 <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
 <div className="aspect-[4/3] overflow-hidden">
 <img
 src={vipConcierge}
 alt="Personlig concierge service"
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>
 <div>
 <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
 Privat & Affärsresor
 </span>
 <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">
 En Service Som Anpassar Sig Efter Dig
 </h2>
 <div className="w-10 h-px bg-primary mb-6" />
 <p className="text-muted-foreground leading-relaxed mb-4 text-base">
 Oavsett om du planerar en privat familjesemester, ett romantiskt citybreak eller en intensiv affärsresa med tight schema - vi levererar samma höga servicenivå.
 </p>
 <p className="text-muted-foreground leading-relaxed mb-8 text-base">
 Vår white glove service innebär att inget lämnas åt slumpen. Från first contact till hemkomst finns vi alltid ett samtal bort.
 </p>
 <Link to="/contact">
 <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
 Kom i kontakt
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </div>
 </div>
 </section>

 {/* Services grid */}
 <section className="py-12 md:py-16 bg-cream">
 <div className="container mx-auto px-4">
 <div className="text-center mb-14">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Vad Ingår</p>
 <h2 className="font-display text-3xl md:text-4xl text-foreground">
 Komplett White Glove Service
 </h2>
 </div>
 <div className="grid md:grid-cols-2 gap-0 border border-border bg-background">
 {services.map((s, i) => {
 const Icon = s.icon;
 return (
 <div
 key={s.title}
 className={`p-10 hover:bg-accent/30 transition-colors border-border ${
 i % 2 === 0 ? "border-r" : ""
 } ${i < services.length - 2 ? "border-b" : ""}`}
 >
 <Icon className="h-5 w-5 text-primary mb-4" />
 <h3 className="font-display text-xl text-foreground mb-3">{s.title}</h3>
 <div className="w-8 h-px bg-primary mb-4" />
 <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* Jet image + how it works */}
 <section className="py-12 md:py-16 bg-background">
 <div className="container mx-auto px-4">
 <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
 <div>
 <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
 Så här fungerar det
 </span>
 <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">
 Enkelt för Dig - Detaljerat för Oss
 </h2>
 <div className="w-10 h-px bg-primary mb-8" />
 <div className="space-y-8">
 {howItWorks.map((step) => (
 <div key={step.step} className="flex gap-6">
 <span className="font-display text-3xl text-primary/25 leading-none shrink-0 w-10">
 {step.step}
 </span>
 <div>
 <h3 className="font-display text-lg text-foreground mb-1">{step.title}</h3>
 <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="aspect-[4/3] overflow-hidden">
 <img
 src={vipJet}
 alt="Privatjet interiör"
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>
 </div>
 </div>
 </section>

 {/* Transfer image strip */}
 <section className="relative h-72 overflow-hidden">
 <img src={vipTransfer} alt="VIP transfer service" className="w-full h-full object-cover object-center" />
 <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
 <div className="text-center">
 <p className="text-primary text-xs tracking-[0.3em] uppercase font-sans mb-3">Varje detalj räknas</p>
 <p className="font-display text-2xl md:text-3xl text-white italic font-light">
 Från avresa till ankomst - sömlöst.
 </p>
 </div>
 </div>
 </section>

 {/* Inquiry form */}
 <section id="forfragan" className="bg-cream py-16 md:py-24">
 <div className="container mx-auto px-4 max-w-3xl">
 <InquiryForm
 type="vip"
 eyebrow="Privat konsultation"
 heading="Berätta om din resa"
 intro="Vi lyssnar, vi planerar - och sedan levererar vi. En personlig rådgivare återkommer för en privat konsultation."
 />
 </div>
 </section>

 <Footer />
 </div>
 );
}
