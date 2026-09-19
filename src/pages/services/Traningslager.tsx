import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, MapPin, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import InquiryForm from "@/components/InquiryForm";
import FloatingInquiryButton from "@/components/FloatingInquiryButton";
import heroImage from "@/assets/camps-hero.jpg";
import valenciaImg from "@/assets/camp-valencia-pitch.jpg.asset.json";
import antalyaImg from "@/assets/camp-antalya-pitch.jpg.asset.json";
import ayiaNapaImg from "@/assets/camp-ayianapa-pitch.jpg.asset.json";
import torremolinosSwimAsset from "@/assets/torremolinos-50m.jpg.asset.json";
import nerjaImg from "@/assets/camp-nerja-athletics-v2.jpg.asset.json";
import santaSusannaImg from "@/assets/camp-santa-susanna-pitch.jpg.asset.json";

const camps = [
  {
    image: valenciaImg.url,
    sport: "Fotboll",
    location: "Valencia, Spanien",
    title: "Träningsläger för lag med ambitioner",
    desc: "Parador de El Saler ligger naturskönt mellan Albufera naturpark och Medelhavet, cirka 18 km från Valencia. Egen naturgräsplan i perfekt skick samt training center med gym och spa. Klubbar som Valencia CF, Levante UD och UD Las Palmas lägger ofta sina läger här.",
    price: "från 12 500 kr / person",
  },
  {
    image: antalyaImg.url,
    sport: "Fotboll",
    location: "Antalya, Turkiet",
    title: "Allt-inkluderat i förstklassig miljö",
    desc: "Ramada Resort är ett mycket prisvärt och högfunktionellt alternativ för träningsläger, där hög hotellstandard kombineras med riktigt fina fotbollsplaner och ett fullt utrustat gym & spa. Anläggningen passar perfekt för lag som söker maximalt sportsligt värde och hög komfort.",
    price: "från 5 900 kr / person",
  },
  {
    image: ayiaNapaImg.url,
    sport: "Fotboll",
    location: "Ayia Napa, Cypern",
    title: "Där fotboll möter perfekta förhållanden",
    desc: "Träna tillsammans, umgås tillsammans och skapa minnen tillsammans - Milea Hotel blir er bas under ett träningsläger ni sent kommer att glömma. Nära stranden och centralt beläget med allt laget behöver för en härlig vistelse på solsäkra Cypern.",
    price: "från 7 100 kr / person",
  },
  {
    image: santaSusannaImg.url,
    sport: "Fotboll",
    location: "Santa Susanna, Spanien",
    title: "Fotbollsläger med semesterkänsla",
    desc: "Med sitt läge vid den spanska Medelhavskusten erbjuder Santa Susanna och hotell Don Ángel en härlig inramning för ett träningsläger. Här kombineras fotbollen med sol, hav och en miljö som gör vistelsen till något mer än bara några dagar av träning. Passa också på att göra ett besök i världsmetropolen Barcelona och varför inte en match på Camp Nou. Vi löser självklart fotbollsbiljetter åt er.",
    price: "från 6 800 kr / person",
  },
  {
    image: torremolinosSwimAsset.url,
    objectPosition: "center",
    sport: "Simning",
    location: "Torremolinos, Spanien",
    title: "50-metersbassäng under öppen himmel",
    desc: "Sol, värme och hårda träningspass i uppvärmd 50-metersbassäng - ett simläger i Torremolinos är den perfekta kombinationen av träning och gemenskap. Med bra träningsmöjligheter, härligt klimat och roliga aktiviteter får simmarna chansen att utvecklas både i bassängen och som lag.",
    price: "från 8 700 kr / person",
  },
  {
    image: nerjaImg.url,
    sport: "Friidrott",
    location: "Nerja, Spanien",
    title: "Optimala träningsförhållanden vid Medelhavet",
    desc: "I Nerja väntar en inspirerande miljö för friidrottare som vill kombinera seriös träning med gemenskap och nya upplevelser. Med fina träningsanläggningar, behagligt klimat och närhet till strand, stad och träning får ni en perfekt kombination av fokuserad träning och en härlig lägerupplevelse.",
    price: "från 8 200 kr / person",
  },
];

const features = [
 "Transport och flygplatstransfer för hela laget",
 "Boende anpassat för lag och ledare",
 "Träningstider och planer enligt era önskemål",
 "Mat och kost anpassad för idrottare",
 "Möjlighet till träningsmatcher och möten",
 "Lokal kontakt och support på plats",
];

import { useSiteContent } from "@/hooks/useSiteContent";

const TRAINING_KEYS = ["training_hero_eyebrow", "training_hero_title", "training_hero_tagline", "training_features"];

const FALLBACK_TRAINING_FEATURES = [
 "Transport och flygplatstransfer för hela laget",
 "Boende anpassat för lag och ledare",
 "Träningstider och planer enligt era önskemål",
 "Mat och kost anpassad för idrottare",
 "Möjlighet till träningsmatcher och möten",
 "Lokal kontakt och support på plats",
];

export default function Traningslager() {
  const { get, getArray } = useSiteContent(TRAINING_KEYS);
  const [selectedDestination, setSelectedDestination] = useState<string | undefined>(undefined);
  const chooseCamp = (location: string, sport: string) => {
    setSelectedDestination(`${location} (${sport})`);
    document.getElementById("forfragan")?.scrollIntoView({ behavior: "smooth" });
  };
 const editableFeatures = getArray("training_features", FALLBACK_TRAINING_FEATURES);
 return (
 <div className="min-h-screen">
 <Navbar />

 {/* Hero */}
 <section className="relative h-[45vh] min-h-[340px] flex items-end">
 <div className="absolute inset-0">
 <img src={heroImage} alt="Träningsläger" className="w-full h-full object-cover" width={1920} height={1024} />
 <div className="absolute inset-0 bg-navy/65" />
 </div>
 <div className="relative container mx-auto px-4 pb-14">
 <p className="text-xs tracking-[0.3em] text-white uppercase mb-3 font-sans">
 {get("training_hero_eyebrow", "Tjänster - Träningsläger")}
 </p>
 <h1 className="font-display text-4xl md:text-6xl text-white leading-tight">
 {get("training_hero_title", "En värld där idrott och resor möts")}
 </h1>
 <p className="text-white/70 mt-4 text-lg font-light max-w-xl">
 {get("training_hero_tagline", "Träningsläger för fotboll, simning och friidrott - för föreningar, lag och grupper som vill ta träningen till nästa nivå.")}
 </p>
 <div className="mt-6 flex flex-wrap gap-3">
 <a href="#forfragan">
 <Button className="rounded-full bg-primary hover:bg-primary/90 px-7 py-6 text-sm tracking-wider">
 <MessageSquare className="mr-2 h-4 w-4" />
 Skicka förfrågan
 </Button>
 </a>
 </div>
 </div>
 </section>

 {/* Camps grid */}
 <section className="py-12 md:py-16 bg-cream">
 <div className="container mx-auto px-4">
 <div className="text-center mb-14">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Utvalda Träningsläger</p>
 <h2 className="font-display text-3xl md:text-4xl text-foreground">
 Ett axplock av <em className="italic font-light">våra läger</em>
 </h2>
 <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
 Detta är ett urval ur vårt kompletta program. Hör av er så hittar vi rätt destination för just ert lag.
 </p>
 </div>

 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {camps.map((camp) => (
  <article
    key={camp.title}
    onClick={() => chooseCamp(camp.location, camp.sport)}
    className="group bg-background overflow-hidden flex flex-col cursor-pointer transition-shadow hover:shadow-lg"
  >
 <div className="aspect-[4/3] overflow-hidden">
 <img
 src={camp.image}
 alt={`${camp.sport}läger i ${camp.location}`}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    style={{ objectPosition: (camp as { objectPosition?: string }).objectPosition ?? "center" }}
 loading="lazy"
 width={1280}
 height={896}
 />
 </div>
 <div className="p-6 flex flex-col flex-1">
 <div className="flex items-center justify-between mb-3">
 <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-2.5 py-1 font-sans">
 {camp.sport}
 </span>
 <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <MapPin className="h-3.5 w-3.5" />
 {camp.location}
 </span>
 </div>
 <h3 className="font-display text-xl text-foreground mb-2">{camp.title}</h3>
 <div className="w-8 h-px bg-primary mb-3" />
 <p className="text-muted-foreground text-sm leading-relaxed flex-1">{camp.desc}</p>
  <p className="mt-4 pt-4 border-t border-border text-sm font-sans text-navy font-medium">{camp.price}</p>
  <span className="mt-3 inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase font-sans text-primary group-hover:gap-2.5 transition-all">
    Skicka förfrågan <ArrowRight className="h-3.5 w-3.5" />
  </span>
 </div>
 </article>
 ))}
 </div>
 <div className="mt-12 text-center">
 <a href="#forfragan">
 <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 py-6 text-sm tracking-wider">
 <MessageSquare className="mr-2 h-4 w-4" />
 Få offert för ert träningsläger
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </a>
 </div>
 </div>
 </section>

 {/* Intro */}
 <section className="bg-background py-16">
 <div className="container mx-auto px-4 max-w-3xl text-center">
 <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
 "Hos oss handlar det inte bara om träning - det handlar om att skapa energi, laganda och motivation som varar långt efter lägret är slut."
 </p>
 <div className="w-8 h-px bg-primary mx-auto mt-8" />
 </div>
 </section>

 {/* Pillar text blocks */}
 <section className="py-12 md:py-16 bg-cream">
 <div className="container mx-auto px-4 max-w-5xl">
 <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
 <div>
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Noggrant Utvalda Destinationer</p>
 <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
 Europas bästa träningsmiljöer
 </h2>
 <div className="w-10 h-px bg-primary mb-6" />
 <p className="text-muted-foreground leading-relaxed">
 Våra destinationer i Europa är noggrant utvalda för att ge bästa förutsättningarna för träning, vila och inspiration. Spanien, Turkiet, Italien, Portugal, Polen, Holland, Tyskland, Danmark och Sverige - soliga kustorter, moderna anläggningar och klassiska idrottsstäder.
 </p>
 </div>
 <div>
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Vi Tar Hand Om Helheten</p>
 <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
 Ni fokuserar på träningen
 </h2>
 <div className="w-10 h-px bg-primary mb-6" />
 <p className="text-muted-foreground leading-relaxed">
 Att planera ett träningsläger kan vara komplext - men vi gör det enkelt. Transport, boende, träningstider och praktiska detaljer hanterar vi. Varje upplägg skräddarsys efter era mål och förväntningar.
 </p>
 </div>
 </div>
 </div>
 </section>

 {/* Stronger together + features */}
 <section className="py-12 md:py-16 bg-background">
 <div className="container mx-auto px-4 max-w-5xl">
 <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
 <div>
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">En Resa Som Stärker Laget</p>
 <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
 Mer än bara träning
 </h2>
 <div className="w-10 h-px bg-primary mb-6" />
 <p className="text-muted-foreground leading-relaxed mb-6">
 Ett framgångsrikt träningsläger handlar om gemenskap, glädje och att skapa minnen tillsammans. Vi planerar varje del med omtanke - från träning till fritid, från logistik till upplevelser.
 </p>
 <p className="text-muted-foreground leading-relaxed">
 Målet är att varje deltagare ska känna sig motiverad, inspirerad och delaktig.
 </p>
 </div>
 <ul className="space-y-3">
 {editableFeatures.map((f, i) => (
 <li key={i} className="flex items-start gap-3 text-sm">
 <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
 <span className="text-foreground/80">{f}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </section>

 {/* Inquiry form */}
 <section id="forfragan" className="bg-cream py-16 md:py-24">
 <div className="container mx-auto px-4 max-w-3xl">
  <InquiryForm
  type="training_camp"
  defaultDestination={selectedDestination}
  eyebrow="Förfrågan träningsläger"
 heading="Berätta om ert lag"
 intro="Sport, antal spelare och stab, önskad period och destination - vi tar fram ett upplägg som passar just ert lag."
 />
 </div>
 </section>

 <FloatingInquiryButton />
 <Footer />
 </div>
 );
}
