import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import sportsImage from "@/assets/kaisen-sports.jpg";
import f1Image from "@/assets/sport-f1.jpg";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import ishockeyImage from "@/assets/sport-ishockey.jpg";
import tennisImage from "@/assets/sport-tennis.jpg";
import golfImage from "@/assets/sport-golf.jpg";
import { usePageMeta } from "@/lib/usePageMeta";

const sports = [
 {
 id: "f1",
 title: "Formel 1",
 image: f1Image,
 description:
 "Känn adrenalinet när racerna dundrar förbi. Vi arrangerar F1-resor till Monaco, Silverstone, Spa och fler ikoniska banor - med bra platser, boende och all logistik ordnad.",
 features: [
 "Biljetter till träningar, kval och race",
 "Hotell nära banan med bra läge",
 "Transferer & praktisk logistik",
 "Paket för enskilda och grupper",
 ],
 },
 {
 id: "fotboll",
 title: "Fotboll",
 image: fotbollImage,
 description:
 "Från Premier League-derbyn till Champions League - vi fixar biljetter och resor till de matcher du drömt om att se live. Enkelt, smidigt och med bra service.",
 features: [
 "Premier League, La Liga & Bundesliga",
 "Champions League & Europa League",
 "Hotelarrangemang nära arenan",
 "Paket för kompisgäng och familjer",
 ],
 },
 {
 id: "ishockey",
 title: "Ishockey",
 image: ishockeyImage,
 description:
 "Inget slår att se ishockey live i en fullpackad arena. Vi ordnar resor till NHL-matcher i Nordamerika och stora europeiska turneringar.",
 features: [
 "NHL-matcher i Toronto, New York & Boston",
 "Stanley Cup Playoffs-paket",
 "IIHF VM och Euro Hockey Tour",
 "Hotelarrangemang & transfers",
 ],
 },
 {
 id: "tennis",
 title: "Tennis",
 image: tennisImage,
 description:
 "Upplev Wimbledon på centerbanan, Roland Garros i solskenet eller US Open under New Yorks stjärnhimmel. Vi ordnar biljetter och en komplett resa.",
 features: [
 "Wimbledon, Roland Garros & US Open",
 "Australian Open-paket",
 "Bra sitplatser med fri sikt",
 "Resa för grupper och par",
 ],
 },
 {
 id: "golf",
 title: "Golf",
 image: golfImage,
 description:
 "Spela på världens finaste golfbanor eller se de bästa proffsen tävla live. Vi ordnar golfresorna - från St Andrews till Pebble Beach - för allt från nybörjare till hängiven golfare.",
 features: [
 "St Andrews, Carnoustie & Turnberry",
 "Pebble Beach & Augusta National",
 "The Masters & The Open Championship",
 "Golfresa för grupper 4-20 spelare",
 ],
 },
];

export default function Sportresor() {
 usePageMeta({
   title: "Sportresor - F1, Fotboll & Golf | Kaisen Travel Group",
   description: "Köp biljetter och resepaket till F1-race, Premier League, Champions League, golfturneringar och fler sportevent. Personlig service från Kaisen Travel Group.",
 });
 const [filters, setFilters] = useState<SportFilterValues>(emptyFilters);
 return (
 <div className="min-h-screen">
 <Navbar />

 {/* Hero with search bar - search is the first thing visible (above the fold) */}
 <section className="relative flex flex-col">
 <div className="absolute inset-0">
 <img src={sportsImage} alt="Sportresor" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-navy/70" />
 </div>
 <div className="relative container mx-auto px-4 pt-24 md:pt-28 pb-8 flex flex-col">
 <div className="max-w-3xl">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-2 font-sans">
 Tjänster - Sportresor
 </p>
 <h1 className="font-display text-3xl md:text-5xl text-white mb-2">
 Resor för <em className="italic font-light text-white">Sportälskare</em>
 </h1>
 <p className="text-white/80 text-sm max-w-xl">
 Köp biljetter till F1, Premier League, Champions League och fler.
 </p>
 </div>

 <div className="mt-6 max-w-5xl w-full mx-auto">
 <SportFilters value={filters} onChange={setFilters} />
 </div>
 </div>
 </section>

  {/* Live tickets results - visible immediately on entry */}
  <section className="py-8 md:py-10 bg-background">
  <div className="container mx-auto px-4 max-w-6xl">
  <UpcomingEventsList
    sport={filters.sport}
    tournament={filters.tournament}
    query={filters.query}
    dateFrom={filters.dateFrom}
    dateTo={filters.dateTo}
    sort={filters.sort}
    limit={24}
    eyebrow="Köp biljett direkt"
    title="Aktuella biljetter"
  />
  </div>
  </section>

  {/* Sport Sections */}
  <section className="py-12 md:py-16 bg-cream">
  <div className="container mx-auto px-4 space-y-24">
 {sports.map((sport, index) => (
 <div
 key={sport.id}
 id={sport.id}
 className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${
 index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
 }`}
 >
 {/* Image */}
 <div className="aspect-[4/3] overflow-hidden">
 <img
 src={sport.image}
 alt={sport.title}
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>

 {/* Content */}
 <div>
 <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-3 py-1 font-sans">
 {sport.title}
 </span>
 <h2 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-2">
 {sport.title}-resor
 </h2>
 <div className="w-10 h-px bg-primary mb-6" />
 <p className="text-muted-foreground leading-relaxed mb-8 text-base">
 {sport.description}
 </p>
 <ul className="space-y-3 mb-10">
 {sport.features.map((f) => (
 <li key={f} className="flex items-start gap-3 text-sm">
 <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
 <span className="text-foreground/80">{f}</span>
 </li>
 ))}
 </ul>
 <Link to="/contact">
 <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
 Boka nu
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </div>
 ))}
 </div>
 </section>

 {/* CTA */}
 <section className="bg-navy py-20">
 <div className="container mx-auto px-4 text-center">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Boka din sportresa</p>
 <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
 Vilken sport vill du uppleva live?
 </h2>
 <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
 Hör av dig till oss och berätta vilken match eller tävling du vill se - så fixar vi resten.
 </p>
 <Link to="/contact">
 <Button
 size="lg"
 className="rounded-full bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm"
 >
 Kontakta oss
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <Footer />
 </div>
 );
}
