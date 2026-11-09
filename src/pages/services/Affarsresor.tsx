import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock, Shield, Globe, HeadphonesIcon } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import heroImage from "@/assets/kaisen-hero.jpg";
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
 icon: Clock,
 title: "Din tid sparas",
 description: "Vi hanterar all planering. Du fokuserar på affärerna.",
 },
 {
 icon: Shield,
 title: "Trygg flexibilitet",
 description: "Planer ändras - vi har avbokningsskydd och snabb ombokning.",
 },
 {
 icon: Globe,
 title: "Globalt nätverk",
 description: "Partners i alla stora affärsstäder, lokalt och globalt.",
 },
 {
 icon: HeadphonesIcon,
 title: "Personlig assistent",
 description: "En kontakt som känner dina behov och alltid finns tillgänglig.",
 },
];

const destinations = [
 { city: "London", desc: "Financial District & Canary Wharf" },
 { city: "Frankfurt", desc: "Europas finanscentrum" },
 { city: "Dubai", desc: "MENA-regionens nav" },
 { city: "Singapore", desc: "Asiens affärsmetropol" },
 { city: "New York", desc: "Wall Street & Midtown" },
 { city: "Zürich", desc: "Banking & Life Sciences" },
];

export default function Affarsresor() {
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero
 image={heroImage}
 imageAlt="Affärsresor"
 eyebrow="Tjänster - Affärsresor"
 title={<>Skräddarsydda <em className="italic text-white">Affärsresor</em></>}
 action={null}
 />

 {/* Intro quote */}
 <section className="sb-section-alt">
 <div className="sb-container max-w-3xl text-center">
 <p className="font-display text-2xl md:text-3xl text-foreground italic font-semibold uppercase leading-snug">
 "Din tid är värdefull. Vi ser till att varje minut av din affärsresa är optimerad."
 </p>
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
 <p className="eyebrow text-primary uppercase mb-1">Skräddarsytt för dig</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
 Inga mallar - bara din resa
 </h2>
 <p className="text-foreground/80 leading-relaxed mb-6 text-[15px]">
 Varje affärsresa är unik. Vi lyssnar på dina behov och skapar ett upplägg som passar ditt schema, din budget och dina förväntningar - från enklare dagsresor till komplexa flerstadsturer.
 </p>
 <ul className="space-y-2.5 mb-8">
 {tailored.map((f) => (
 <li key={f} className="flex items-start gap-3 text-sm">
 <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-white"><Check className="h-3.5 w-3.5" /></span>
 <span className="text-foreground/85">{f}</span>
 </li>
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
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {benefits.map((b) => (
 <div key={b.title} className="sb-card p-6 hover:border-primary/50 hover:shadow-md transition-all">
 <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white"><b.icon className="h-5 w-5" /></span>
 <h3 className="font-display text-xl text-foreground mb-1.5">{b.title}</h3>
 <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Destinations */}
 <section className="sb-section">
 <div className="sb-container">
 <p className="eyebrow text-primary uppercase mb-1">Populära destinationer</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-8 md:mb-10">
 Världens ledande affärsstäder
 </h2>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 {destinations.map((d) => (
 <div key={d.city} className="sb-card p-5 md:p-6 hover:border-primary/50 hover:shadow-md transition-all">
 <h3 className="font-display text-lg sm:text-xl md:text-2xl italic font-bold text-foreground mb-1">{d.city}</h3>
 <p className="text-xs text-muted-foreground">{d.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 <CtaBand
 eyebrow="Kom igång"
 title="Låt oss ta hand om dina affärsresor"
 text="Kontakta oss för en kostnadsfri genomgång av hur vi kan effektivisera era företagsresor."
 >
 <Link to="/contact" className="sb-btn-light">
 Kontakta oss <ArrowRight className="h-4 w-4" />
 </Link>
 </CtaBand>

 <Footer />
 </div>
 );
}
