import { ArrowRight, MapPin, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import { useInquiryDialog } from "@/components/InquiryDialog";
const heroImage = PHOTO["camps-hero"];
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
    title: "Parador de El Saler",
    desc: "Parador de El Saler ligger naturskönt mellan Albufera naturpark och Medelhavet, cirka 18 km från Valencia. Egen naturgräsplan i perfekt skick samt training center med gym och spa. Klubbar som Valencia CF, Levante UD och UD Las Palmas lägger ofta sina läger här.",
    price: "från 12 500 kr / person",
  },
  {
    image: antalyaImg.url,
    sport: "Fotboll",
    location: "Antalya, Turkiet",
    title: "Allt inkluderat på Ramada Resort",
    desc: "Ramada Resort är ett mycket prisvärt och högfunktionellt alternativ för träningsläger, där hög hotellstandard kombineras med riktigt fina fotbollsplaner och ett fullt utrustat gym & spa. Ett bra val för lag som vill få mycket träning för pengarna utan att ge avkall på boendet.",
    price: "från 5 900 kr / person",
  },
  {
    image: ayiaNapaImg.url,
    sport: "Fotboll",
    location: "Ayia Napa, Cypern",
    title: "Fotbollsläger nära stranden",
    desc: "Milea Hotel blir lagets bas i Ayia Napa: nära stranden, centralt och med planer, boende och mat på samma ställe. Cypern är solsäkert stora delar av året.",
    price: "från 7 100 kr / person",
  },
  {
    image: santaSusannaImg.url,
    sport: "Fotboll",
    location: "Santa Susanna, Spanien",
    title: "Fotboll vid Medelhavet",
    desc: "Med sitt läge vid den spanska Medelhavskusten erbjuder Santa Susanna och hotell Don Ángel en härlig inramning för ett träningsläger. Fotboll på dagarna, sol och hav på kvällarna. Barcelona ligger nära, så det går fint att lägga in en match på Camp Nou – vi ordnar biljetterna.",
    price: "från 6 800 kr / person",
  },
  {
    image: torremolinosSwimAsset.url,
    objectPosition: "center",
    sport: "Simning",
    location: "Torremolinos, Spanien",
    title: "50-metersbassäng under öppen himmel",
    desc: "Hårda pass i uppvärmd 50-metersbassäng utomhus, och sol mellan passen. I Torremolinos får simmarna bra träning och tid tillsammans som grupp.",
    price: "från 8 700 kr / person",
  },
  {
    image: nerjaImg.url,
    sport: "Friidrott",
    location: "Nerja, Spanien",
    title: "Friidrott i Nerja",
    desc: "Nerja passar friidrottare som vill träna seriöst i ett behagligt klimat. Fina anläggningar och nära till både strand och stad.",
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
import { PHOTO } from "@/data/photos";

const TRAINING_KEYS = ["training_hero_eyebrow", "training_hero_title", "training_hero_tagline", "training_features"];

const FALLBACK_TRAINING_FEATURES = [
 "Transport och flygplatstransfer för hela laget",
 "Boende anpassat för lag och ledare",
 "Träningstider och planer enligt era önskemål",
 "Mat och kost anpassad för idrottare",
 "Möjlighet till träningsmatcher och möten",
 "Lokal kontakt och support på plats",
];

/** "från 12 500 kr / person": the amount stands out, "från" and "/ person" stay quiet; never wraps. */
function PriceLine({ text }: { text: string }) {
  const m = text.match(/^(från)\s+(.+?)(\s*\/\s*person)?$/i);
  if (!m) return <p className="font-display text-sm sm:text-base font-semibold text-foreground whitespace-nowrap">{text}</p>;
  return (
    <p className="whitespace-nowrap leading-none text-foreground">
      <span className="text-[11px] sm:text-xs text-muted-foreground mr-1">{m[1]}</span>
      <span className="font-display text-[15px] sm:text-lg font-semibold">{m[2]}</span>
      {m[3] && <span className="text-[11px] sm:text-xs text-muted-foreground ml-0.5">{m[3].trim()}</span>}
    </p>
  );
}

export default function Traningslager() {
  const { get, getArray } = useSiteContent(TRAINING_KEYS);
  const { open: openInquiry } = useInquiryDialog();
  const openCampInquiry = (destination?: string) =>
    openInquiry({
      type: "training_camp",
      defaultDestination: destination,
      eyebrow: "Förfrågan träningsläger",
      heading: "Berätta om ert lag",
      intro: "Berätta om sport, antal spelare och ledare, önskad period och destination, så tar vi fram ett upplägg för ert lag.",
    });
  const chooseCamp = (location: string, sport: string) => openCampInquiry(`${location} (${sport})`);
 const editableFeatures = getArray("training_features", FALLBACK_TRAINING_FEATURES);
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero
 image={heroImage}
 imageAlt="Träningsläger"
 eyebrow={get("training_hero_eyebrow", "Träningsläger")}
 title={get("training_hero_title", "En värld där idrott och resor möts")}
 action={
 <button type="button" onClick={() => openCampInquiry()} className="sb-btn-light">
 <MessageSquare className="h-4 w-4" />
 Skicka förfrågan
 </button>
 }
 >
 {get("training_hero_tagline", "Träningsläger i fotboll, simning och friidrott för föreningar, lag och grupper.")}
 </PageHero>

 {/* Camps grid */}
 <section className="sb-section">
 <div className="sb-container">
 <p className="eyebrow text-primary uppercase mb-1">Utvalda träningsläger</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground">
 Ett axplock av <em className="italic">våra läger</em>
 </h2>
 <p className="text-foreground/80 text-[15px] mt-3 mb-8 md:mb-10 max-w-2xl">
 Ett urval ur vårt program. Hör av er så hittar vi en destination som passar ert lag.
 </p>

 <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
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
 <span className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded-md bg-navy-deep/90 px-2 sm:px-2.5 py-0.5 sm:py-1 font-display text-xs sm:text-sm font-semibold uppercase italic tracking-wide text-white">
 {camp.sport}
 </span>
 </div>
 <div className="p-3 sm:p-5 flex flex-col flex-1">
 <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 leading-tight">
 <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
 {camp.location}
 </span>
 <h3 lang="sv" className="font-display text-[15px] sm:text-xl leading-tight text-foreground mb-1.5 sm:mb-2 sb-hyphen-long">{camp.title}</h3>
 <p lang="sv" className="text-muted-foreground text-xs sm:text-sm leading-snug sm:leading-relaxed flex-1 line-clamp-3 sm:line-clamp-none sb-hyphen-long">{camp.desc}</p>
  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex flex-col items-start gap-1.5 sm:gap-2">
  <PriceLine text={camp.price} />
  <span className="inline-flex items-center gap-1 sm:gap-1.5 font-display uppercase font-semibold tracking-wide text-[13px] sm:text-[15px] text-primary group-hover:gap-2.5 transition-all whitespace-nowrap">
    Skicka förfrågan <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
  </span>
  </div>
 </div>
 </article>
 ))}
 </div>
 <div className="mt-10">
  <button type="button" onClick={() => openCampInquiry()} className="sb-btn-primary h-11">
  <MessageSquare className="h-4 w-4" />
  Få offert för ert träningsläger
  <ArrowRight className="h-4 w-4" />
  </button>
 </div>
 </div>
 </section>

 {/* Intro quote: left-aligned, editorial */}
 <section className="sb-section-alt">
 <div className="sb-container">
 <blockquote className="max-w-3xl border-l-2 border-primary pl-5 md:pl-8 font-display italic text-2xl md:text-[32px] leading-snug text-foreground">
 Ett bra läger märks långt efter hemresan, både i formen och i hur laget håller ihop.
 </blockquote>
 </div>
 </section>

 {/* Two short editorial columns, no cards */}
 <section className="sb-section">
 <div className="sb-container grid md:grid-cols-2 gap-10 md:gap-16">
 <div className="border-t border-border pt-6">
 <p className="eyebrow text-primary uppercase mb-2">Destinationer</p>
 <h2 className="font-display text-3xl md:text-[30px] lg:text-[36px] text-foreground mb-4">
 Anläggningar vi känner väl
 </h2>
 <p className="text-foreground/80 leading-relaxed text-[15px]">
 Vi arbetar med anläggningar i Spanien, Turkiet, Italien, Portugal, Polen, Holland, Tyskland, Danmark och Sverige: kustorter med sol stora delar av året, moderna sportanläggningar och klassiska idrottsstäder.
 </p>
 </div>
 <div className="border-t border-border pt-6">
 <p className="eyebrow text-primary uppercase mb-2">Planering</p>
 <h2 className="font-display text-3xl md:text-[30px] lg:text-[36px] text-foreground mb-4">
 Ni fokuserar på träningen
 </h2>
 <p className="text-foreground/80 leading-relaxed text-[15px]">
 Ett läger har många delar som ska passa ihop. Vi ordnar transport, boende, träningstider och det praktiska, och anpassar upplägget efter vad laget vill uppnå.
 </p>
 </div>
 </div>
 </section>

 {/* Off the pitch + what we arrange (numbered list) */}
 <section className="sb-section-alt">
 <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-start">
 <div>
 <p className="eyebrow text-primary uppercase mb-2">Laget</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
 Tid tillsammans utanför planen
 </h2>
 <p className="text-foreground/80 leading-relaxed mb-4 text-[15px]">
 Ett läger är också dagarna mellan passen. Vi planerar fritiden lika noga som träningen, med aktiviteter och middagar som för laget närmare varandra.
 </p>
 <p className="text-foreground/80 leading-relaxed text-[15px]">
 Målet är att alla kommer hem lite starkare, och lite mer av ett lag.
 </p>
 </div>
 <div>
 <p className="eyebrow text-muted-foreground uppercase mb-3">Det här ordnar vi</p>
 <ol className="divide-y divide-border border-y border-border">
 {editableFeatures.map((f, i) => (
 <li key={i} className="flex items-baseline gap-4 py-3.5 text-[15px]">
 <span className="font-display text-lg text-primary tabular-nums w-7 shrink-0">{String(i + 1).padStart(2, "0")}</span>
 <span className="text-foreground/85">{f}</span>
 </li>
 ))}
 </ol>
 </div>
 </div>
 </section>

 <RequestCta />
      <Footer />
 </div>
 );
}
