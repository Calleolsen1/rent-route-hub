import { ArrowRight, Check, MapPin, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import FloatingInquiryButton from "@/components/FloatingInquiryButton";
import { useInquiryDialog } from "@/components/InquiryDialog";
import heroImage from "@/assets/camps-hero.jpg";
import valenciaImg from "@/assets/camp-valencia-pitch.jpg.asset.json";
import antalyaImg from "@/assets/camp-antalya-hotel.jpg.asset.json";
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
  const { open: openInquiry } = useInquiryDialog();
  const openCampInquiry = (destination?: string) =>
    openInquiry({
      type: "training_camp",
      defaultDestination: destination,
      eyebrow: "Förfrågan träningsläger",
      heading: "Berätta om ert lag",
      intro: "Sport, antal spelare och stab, önskad period och destination - vi tar fram ett upplägg som passar just ert lag.",
    });
  const chooseCamp = (location: string, sport: string) => openCampInquiry(`${location} (${sport})`);
 const editableFeatures = getArray("training_features", FALLBACK_TRAINING_FEATURES);
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero
 image={heroImage}
 imageAlt="Träningsläger"
 eyebrow={get("training_hero_eyebrow", "Tjänster - Träningsläger")}
 title={get("training_hero_title", "En värld där idrott och resor möts")}
 action={
 <button type="button" onClick={() => openCampInquiry()} className="sb-btn-light">
 <MessageSquare className="h-4 w-4" />
 Skicka förfrågan
 </button>
 }
 >
 {get("training_hero_tagline", "Träningsläger för fotboll, simning och friidrott - för föreningar, lag och grupper som vill ta träningen till nästa nivå.")}
 </PageHero>

 {/* Camps grid */}
 <section className="sb-section">
 <div className="sb-container">
 <p className="eyebrow text-primary uppercase mb-1">Utvalda Träningsläger</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground">
 Ett axplock av <em className="italic">våra läger</em>
 </h2>
 <p className="text-foreground/80 text-[15px] mt-3 mb-8 md:mb-10 max-w-2xl">
 Detta är ett urval ur vårt kompletta program. Hör av er så hittar vi rätt destination för just ert lag.
 </p>

 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
  {camps.map((camp) => (
  <article
    key={camp.title}
    onClick={() => chooseCamp(camp.location, camp.sport)}
    className="group sb-card overflow-hidden flex flex-col cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
  >
 <div className="relative aspect-[4/3] overflow-hidden">
 <img
 src={camp.image}
 alt={`${camp.sport}läger i ${camp.location}`}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    style={{ objectPosition: (camp as { objectPosition?: string }).objectPosition ?? "center" }}
 loading="lazy"
 width={1280}
 height={896}
 />
 <span className="absolute top-3 left-3 rounded-md bg-navy-deep/90 px-2.5 py-1 font-display text-sm font-semibold uppercase italic tracking-wide text-white">
 {camp.sport}
 </span>
 </div>
 <div className="p-5 flex flex-col flex-1">
 <span className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
 <MapPin className="h-3.5 w-3.5" />
 {camp.location}
 </span>
 <h3 className="font-display text-xl text-foreground mb-2">{camp.title}</h3>
 <p className="text-muted-foreground text-sm leading-relaxed flex-1">{camp.desc}</p>
  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3">
  <p className="font-display text-lg font-semibold text-foreground">{camp.price}</p>
  <span className="inline-flex items-center gap-1.5 font-display uppercase font-semibold tracking-wide text-[15px] text-primary group-hover:gap-2.5 transition-all whitespace-nowrap">
    Skicka förfrågan <ArrowRight className="h-4 w-4" />
  </span>
  </div>
 </div>
 </article>
 ))}
 </div>
 <div className="mt-10 text-center">
  <button type="button" onClick={() => openCampInquiry()} className="sb-btn-primary h-11">
  <MessageSquare className="h-4 w-4" />
  Få offert för ert träningsläger
  <ArrowRight className="h-4 w-4" />
  </button>
 </div>
 </div>
 </section>

 {/* Intro */}
 <section className="sb-section-alt">
 <div className="sb-container max-w-3xl text-center">
 <p className="font-display text-2xl md:text-3xl text-foreground italic font-semibold uppercase leading-snug">
 "Hos oss handlar det inte bara om träning - det handlar om att skapa energi, laganda och motivation som varar långt efter lägret är slut."
 </p>
 </div>
 </section>

 {/* Pillar text blocks */}
 <section className="sb-section">
 <div className="sb-container grid md:grid-cols-2 gap-5">
 <div className="sb-card p-6 md:p-8">
 <p className="eyebrow text-primary uppercase mb-1">Noggrant Utvalda Destinationer</p>
 <h2 className="font-display text-3xl md:text-[30px] lg:text-[36px] text-foreground mb-4">
 Europas bästa träningsmiljöer
 </h2>
 <p className="text-foreground/80 leading-relaxed text-[15px]">
 Våra destinationer i Europa är noggrant utvalda för att ge bästa förutsättningarna för träning, vila och inspiration. Spanien, Turkiet, Italien, Portugal, Polen, Holland, Tyskland, Danmark och Sverige - soliga kustorter, moderna anläggningar och klassiska idrottsstäder.
 </p>
 </div>
 <div className="sb-card p-6 md:p-8">
 <p className="eyebrow text-primary uppercase mb-1">Vi Tar Hand Om Helheten</p>
 <h2 className="font-display text-3xl md:text-[30px] lg:text-[36px] text-foreground mb-4">
 Ni fokuserar på träningen
 </h2>
 <p className="text-foreground/80 leading-relaxed text-[15px]">
 Att planera ett träningsläger kan vara komplext - men vi gör det enkelt. Transport, boende, träningstider och praktiska detaljer hanterar vi. Varje upplägg skräddarsys efter era mål och förväntningar.
 </p>
 </div>
 </div>
 </section>

 {/* Stronger together + features */}
 <section className="sb-section-alt">
 <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
 <div>
 <p className="eyebrow text-primary uppercase mb-1">En Resa Som Stärker Laget</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
 Mer än bara träning
 </h2>
 <p className="text-foreground/80 leading-relaxed mb-4 text-[15px]">
 Ett framgångsrikt träningsläger handlar om gemenskap, glädje och att skapa minnen tillsammans. Vi planerar varje del med omtanke - från träning till fritid, från logistik till upplevelser.
 </p>
 <p className="text-foreground/80 leading-relaxed text-[15px]">
 Målet är att varje deltagare ska känna sig motiverad, inspirerad och delaktig.
 </p>
 </div>
 <ul className="sb-card p-5 md:p-6 space-y-3">
 {editableFeatures.map((f, i) => (
 <li key={i} className="flex items-start gap-3 text-sm">
 <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-white"><Check className="h-3.5 w-3.5" /></span>
 <span className="text-foreground/85">{f}</span>
 </li>
 ))}
 </ul>
 </div>
 </section>

  <FloatingInquiryButton
    inquiry={{
      type: "training_camp",
      eyebrow: "Förfrågan träningsläger",
      heading: "Berätta om ert lag",
      intro: "Sport, antal spelare och stab, önskad period och destination - vi tar fram ett upplägg som passar just ert lag.",
    }}
  />
 <RequestCta />
      <Footer />
 </div>
 );
}
