import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import { PHOTO } from "@/data/photos";
const businessImage = PHOTO["affarsresor-hero"];

const tailored = [
 "Individuell reseplanering utifrån ditt schema och dina preferenser",
 "Flexibla biljetter med möjlighet till ändringar och avbokningar",
 "Hotell handplockade efter läge, komfort och mötesmöjligheter",
 "Privata transferer från flygplats till hotell och mötesplats",
 "Dygnet-runt support under hela resan",
 "Månadsrapporter och samlad fakturering för företag",
];

const benefits = [
 {
 title: "Mindre administration",
 description: "Vi sköter bokningar och ombokningar, du lägger tiden på mötena.",
 },
 {
 title: "När planerna ändras",
 description: "Avbokningsskydd och snabb ombokning när ett möte flyttas.",
 },
 {
 title: "Kontakter på plats",
 description: "Samarbetspartners i de stora affärsstäderna.",
 },
 {
 title: "En kontaktperson",
 description: "Samma person hos oss, som lär sig hur du vill resa.",
 },
];

const destinations = [
 { city: "London", desc: "Financial District & Canary Wharf" },
 { city: "Frankfurt", desc: "Europas finanscentrum" },
 { city: "Dubai", desc: "MENA-regionens nav" },
 { city: "Singapore", desc: "Asiens affärsmetropol" },
 { city: "New York", desc: "Wall Street & Midtown" },
 { city: "Zürich", desc: "Bank och life science" },
];

export default function Affarsresor() {
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero
 image={businessImage}
 imageAlt="Affärsresor"
 eyebrow="Affärsresor"
 title={<>Affärsresor <em className="italic text-white">efter ditt schema</em></>}
 action={null}
 />

 {/* Intro quote */}
 <section className="sb-section-alt">
 <div className="sb-container">
 <blockquote className="max-w-3xl border-l-2 border-primary pl-5 md:pl-8 font-display italic text-2xl md:text-[32px] leading-snug text-foreground">
 Du ska kunna tänka på mötet, inte på resan dit.
 </blockquote>
 </div>
 </section>

 {/* Main section: image + tailored list */}
 <section className="sb-section">
 <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
 <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
 <img
 src={businessImage}
 alt="Affärsresenärer på flygplats"
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>
 <div>
 <p className="eyebrow text-primary uppercase mb-2">Planering</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
 Upplagt efter ditt schema
 </h2>
 <p className="text-foreground/80 leading-relaxed mb-6 text-[15px]">
 Vi utgår från ditt schema, din budget och vad resan ska ge, oavsett om det är en enkel dagsresa eller flera städer på en vecka.
 </p>
 <ul className="mb-8 divide-y divide-border border-y border-border">
 {tailored.map((f) => (
 <li key={f} className="py-2.5 text-sm text-foreground/85">{f}</li>
 ))}
 </ul>
 <Link to="/contact" className="sb-btn-primary">
 Boka nu
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 </section>

 {/* Benefits */}
 <section className="sb-section-alt">
 <div className="sb-container">
 <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
 {benefits.map((b, i) => (
 <div key={b.title} className="border-t border-border pt-5">
 <dt className="flex items-baseline gap-3 mb-1.5">
 <span className="font-display text-lg text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
 <span className="font-display text-xl text-foreground">{b.title}</span>
 </dt>
 <dd className="text-muted-foreground text-sm leading-relaxed">{b.description}</dd>
 </div>
 ))}
 </dl>
 </div>
 </section>

 {/* Destinations */}
 <section className="sb-section">
 <div className="sb-container">
 <p className="eyebrow text-primary uppercase mb-1">Populära destinationer</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-8 md:mb-10">
 Städer vi ofta bokar
 </h2>
 <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 border-t border-border">
 {destinations.map((d) => (
 <li key={d.city} className="flex items-baseline justify-between gap-4 border-b border-border py-4">
 <span className="font-display text-xl md:text-2xl text-foreground">{d.city}</span>
 <span className="text-xs text-muted-foreground text-right">{d.desc}</span>
 </li>
 ))}
 </ul>
 </div>
 </section>

 <CtaBand
 eyebrow="Kom igång"
 title="Låt oss ta hand om dina affärsresor"
 text="Boka en kostnadsfri genomgång av hur ni reser i dag, så visar vi vad som kan bli enklare."
 >
 <Link to="/contact" className="sb-btn-light">
 Kontakta oss <ArrowRight className="h-4 w-4" />
 </Link>
 </CtaBand>

 <Footer />
 </div>
 );
}
