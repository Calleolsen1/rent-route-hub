import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import InquiryForm from "@/components/InquiryForm";
import vipImage from "@/assets/kaisen-vip.jpg";
import { PHOTO } from "@/data/photos";
const vipConcierge = PHOTO["vip-concierge"];
const vipJet = PHOTO["vip-jet"];
const vipTransfer = PHOTO["vip-transfer"];

const services = [
 {
 title: "Personlig resekonsult",
 description:
 "Du får en egen kontaktperson som lär sig dina vanor och önskemål, både för privata resor och affärsresor.",
 },
 {
 title: "Resplaner efter dina behov",
 description:
 "Vi börjar från dina behov och väljer hotell, transport, aktiviteter och tider med omsorg.",
 },
 {
 title: "Tillgängliga dygnet runt",
 description:
 "Vi svarar dygnet runt, oavsett tidszon, för ändringar i sista minuten eller en snabb fråga under resan.",
 },
 {
 title: "Full diskretion",
 description:
 "Alla resor hanteras konfidentiellt, oavsett om du reser privat eller i tjänsten.",
 },
 {
 title: "Privatflyg och business class",
 description:
 "Privatjet eller business class: vi väljer det som passar resan, tiden och komforten bäst.",
 },
 {
 title: "Chaufför och transfer",
 description:
 "Chaufförsdriven Mercedes, privata fordon och VIP-mottagning på flygplatsen ingår alltid, var du än reser.",
 },
];

const howItWorks = [
 {
 step: "01",
 title: "Du berättar",
 description: "Berätta om resan, dina önskemål och vad som är viktigast för dig.",
 },
 {
 step: "02",
 title: "Vi tar fram ett förslag",
 description: "Utifrån det du berättat sätter vi ihop ett förslag med hotell, transport och aktiviteter.",
 },
 {
 step: "03",
 title: "Vi ordnar resten",
 description: "När du har godkänt förslaget bokar och samordnar vi allt det praktiska.",
 },
];

export default function VIPService() {
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero
 image={vipImage}
 imageAlt="VIP Service"
 eyebrow="VIP-service"
 title={<>Resor på <em className="italic text-white">dina villkor</em></>}
 action={null}
 >
 Personlig service för privat- och affärsresenärer som vill att allt runt resan bara fungerar.
 </PageHero>

 {/* Intro quote */}
 <section className="sb-section-alt">
 <div className="sb-container">
 <blockquote className="max-w-3xl border-l-2 border-primary pl-5 md:pl-8 font-display italic text-2xl md:text-[32px] leading-snug text-foreground">
 Du ska bara behöva tänka på varför du reser.
 </blockquote>
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
 <p className="eyebrow text-primary uppercase mb-2">Privat- och affärsresor</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
 En service som anpassar sig efter dig
 </h2>
 <p className="text-foreground/80 leading-relaxed mb-4 text-[15px]">
 Familjesemester, en helg i en annan stad eller en affärsresa med tätt schema: du får samma noggranna service.
 </p>
 <p className="text-foreground/80 leading-relaxed mb-8 text-[15px]">
 Vi planerar varje del i förväg, och från första kontakt till hemkomst når du oss på telefon.
 </p>
 <Link to="/contact" className="sb-btn-primary">
 Kom i kontakt
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 </section>

 {/* What's included: two-column list with dividers */}
 <section className="sb-section-alt">
 <div className="sb-container">
 <p className="eyebrow text-primary uppercase mb-2">Vad som ingår</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-8 md:mb-10">
 Det här ingår
 </h2>
 <dl className="grid md:grid-cols-2 gap-x-14 border-t border-border">
 {services.map((s) => (
 <div key={s.title} className="border-b border-border py-5">
 <dt className="font-display text-xl text-foreground mb-1">{s.title}</dt>
 <dd className="text-muted-foreground text-sm leading-relaxed">{s.description}</dd>
 </div>
 ))}
 </dl>
 </div>
 </section>

 {/* Jet image + how it works */}
 <section className="sb-section">
 <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
 <div>
 <p className="eyebrow text-primary uppercase mb-2">Tre steg</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-6">
 Så går det till
 </h2>
 <div className="divide-y divide-border border-y border-border">
 {howItWorks.map((step) => (
 <div key={step.step} className="flex gap-5 py-5">
 <span className="font-display text-2xl text-primary tabular-nums leading-none pt-1">
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
 <p className="eyebrow text-white/70 uppercase mb-2">Transfer</p>
 <p className="font-display text-3xl md:text-[36px] lg:text-[44px] text-white leading-tight">
 Hämtad vid flygplatsen, <em className="italic">körd ända fram.</em>
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
 intro="Berätta kort om resan, så hör en personlig rådgivare av sig för ett samtal."
 />
 </div>
 </div>
 </section>

 <Footer />
 </div>
 );
}
