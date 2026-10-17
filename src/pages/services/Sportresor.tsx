import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import sportsImage from "@/assets/kaisen-sports.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";
import f1Image from "@/assets/sport-f1.jpg";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import { usePageMeta } from "@/lib/usePageMeta";

const sports = [
 {
 id: "f1",
 title: "Formel 1",
 image: f1Image,
 description:
 "Upplev Formel 1 på plats – från nervkittlande kval till dramatiken i racet. Vi hjälper dig att skapa din F1-resa till världens ikoniska racingbanor, med möjlighet att boka biljetter, hotell, flyg och transfer var för sig eller som en komplett resa.",
 features: [
 "Biljetter till träningar, kval och race",
 "Flygresa från samtliga Sveriges flygplatser",
 "Hotell med centralt läge",
 "Transfer och praktisk reseplanering",
 "Flexibla upplägg för enskilda resenärer och grupper",
 ],
 },
 {
 id: "fotboll",
 title: "Fotboll",
 image: fotbollImage,
 description:
 "Upplev Europas bästa fotbollsmatcher på plats – från klassiska derbyn i Premier League, Serie A och La Liga - till Champions League. Vi hjälper dig att skapa just din fotbollsresa, med möjlighet att boka matchbiljetter, hotell, flyg och transfer var för sig eller som en komplett resa.",
 features: [
 "Premier League, La Liga, Bundesliga, Serie A och fler ligor",
 "Champions League, Europa League och inhemska cuper",
 "Endast officiella matchbiljetter från utvalda leverantörer",
 "Flexibla upplägg för kompisgäng, familjer och grupper",
 ],
 },
];

export default function Sportresor() {
 usePageMeta({
   title: "Sportresor - F1 & Fotboll | KAISEN TRAVEL GROUP",
   description: "Skräddarsydda sportresor med hotell, transfer och upplevelser till F1-race, Premier League, Champions League och fler sportevent. Personlig service från KAISEN TRAVEL GROUP.",
 });
 return (
 <div className="min-h-screen">
 <Navbar />

 {/* Hero with search bar - search is the first thing visible (above the fold) */}
 <section className="relative flex flex-col">
 <div className="absolute inset-0">
 <img src={sportsImage} alt="Sportresor" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-navy/70" />
 </div>
 <div className="relative container mx-auto px-4 pt-16 sm:pt-24 md:pt-28 pb-8 flex flex-col">
 <div className="max-w-3xl">
 <p className="text-[11px] sm:text-xs eyebrow text-white/75 uppercase mb-2 font-sans">
 Tjänster - Sportresor
 </p>
 <h1 className="font-display text-3xl md:text-5xl text-white mb-2">
 Sportresor
 </h1>
 <p className="font-display text-xl md:text-2xl italic font-light text-white mb-3">
 Sport upplevs bäst LIVE
 </p>
 <p className="text-white/80 text-sm max-w-xl mb-5">
 Upplev Formel 1 och Europas bästa fotbollsmatcher på plats. Vi skräddarsyr din sportresa efter dina önskemål – boka allt från matchbiljett och hotell till flyg och transfer, eller välj bara de delar du behöver.
 </p>
 <Link
 to="/contact"
 className="inline-flex items-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide shadow-lg shadow-navy/30 transition-all hover:scale-105"
 >
 Kontakta oss
 <ArrowRight className="ml-2 h-4 w-4" />
 </Link>
 </div>
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
  <section className="relative bg-navy border-b border-white/15 overflow-hidden">
    <div className="absolute inset-0">
      <img src={luxuryImage} alt="" aria-hidden="true" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-navy/85" />
    </div>
    <div className="relative container mx-auto px-4 py-10 sm:py-16 md:py-20 text-center">
      <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-4 font-sans">Boka din sportresa</p>
      <h2 className="font-display text-3xl md:text-5xl text-white mb-5">
        Vilken sportupplevelse drömmer du om?
      </h2>
      <p className="text-white/70 max-w-lg mx-auto mb-8 leading-relaxed">
        Berätta vilken match eller tävling du vill uppleva på plats. Vi hjälper dig att skapa en sportresa anpassad efter dina önskemål.
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

 <RequestCta />
      <Footer />
 </div>
 );
}
