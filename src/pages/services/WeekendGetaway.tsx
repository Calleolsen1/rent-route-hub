import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import weekendImage from "@/assets/kaisen-weekend.jpg";
import { PHOTO } from "@/data/photos";
const parisImage = PHOTO["city-paris"];
const amsterdamImage = PHOTO["city-amsterdam"];
const barcelonaImage = PHOTO["city-barcelona"];
const copenhagenImage = PHOTO["city-copenhagen"];
const pragueImage = PHOTO["city-prague"];
const veniceImage = PHOTO["city-venice"];

const destinations = [
 {
 city: "Paris",
 country: "Frankrike",
 image: parisImage,
 tagline: "Kaféer och bistroer",
 description:
 "Börja morgonen med kaffe på ett gatukafé, promenera längs Seine och ät middag på en liten bistro i Le Marais. En stad för dig som vill ta det lugnt.",
 },
 {
 city: "Amsterdam",
 country: "Nederländerna",
 image: amsterdamImage,
 tagline: "Kanaler och cykel",
 description:
 "Hyr en cykel och följ kanalerna genom de gamla kvarteren. Besök Rijksmuseet, fika på ett brunt hörncafé och ta en kvällsbåt förbi de upplysta husfasaderna.",
 },
 {
 city: "Barcelona",
 country: "Spanien",
 image: barcelonaImage,
 tagline: "Tapas och arkitektur",
 description:
 "Se Gaudís byggnader på dagen och gå på tapasrunda i El Born på kvällen. Sol, god mat och arkitektur på samma helg.",
 },
 {
 city: "Köpenhamn",
 country: "Danmark",
 image: copenhagenImage,
 tagline: "Hygge och nordisk mat",
 description:
 "Sitt på ett litet kafé med levande ljus och nybakade kanelbullar, gå runt i Nørrebro och avsluta kvällen på någon av stadens bästa restauranger.",
 },
 {
 city: "Prag",
 country: "Tjeckien",
 image: pragueImage,
 tagline: "Gamla stan och öl",
 description:
 "Gå över Karlsbron i skymningen och vidare in i Gamla stans gränder. Avsluta kvällen med en lokal öl på en liten källarkrog.",
 },
 {
 city: "Venedig",
 country: "Italien",
 image: veniceImage,
 tagline: "Kanaler och cicchetti",
 description:
 "Gå vilse bland de smala kanalerna och broarna. Prova cicchetti, venetiansk tapas, på en lokal bacaro och se solnedgången över vattnet.",
 },
];

export default function WeekendGetaway() {
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero
 image={weekendImage}
 imageAlt="Weekend Getaway"
 eyebrow="Weekendresor"
 title={<>Europas mysigaste <em className="italic text-white">helgresmål</em></>}
 action={null}
 />

 {/* Intro */}
 <section className="sb-section-alt">
 <div className="sb-container">
 <blockquote className="max-w-3xl border-l-2 border-primary pl-5 md:pl-8 font-display italic text-2xl md:text-[32px] leading-snug text-foreground">
 Tre dagar räcker längre än man tror, om resan är rätt planerad.
 </blockquote>
 </div>
 </section>

 {/* Cities: a two-column editorial grid instead of six identical bands */}
 <section className="sb-section">
 <div className="sb-container grid md:grid-cols-2 gap-x-10 gap-y-12 md:gap-y-16">
 {destinations.map((dest) => (
 <article key={dest.city}>
 <div className="aspect-[16/10] overflow-hidden rounded-2xl">
 <img
 src={dest.image}
 alt={dest.city}
 loading="lazy"
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>
 <div className="mt-5 flex items-baseline justify-between gap-4">
 <h2 className="font-display text-3xl md:text-[36px] text-foreground">{dest.city}</h2>
 <span className="text-sm text-muted-foreground">{dest.country}</span>
 </div>
 <p className="eyebrow text-primary uppercase mt-1 mb-3">{dest.tagline}</p>
 <p className="text-foreground/80 leading-relaxed text-[15px] mb-5">
 {dest.description}
 </p>
 <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all">
 Boka helgresa till {dest.city}
 <ArrowRight className="h-4 w-4" />
 </Link>
 </article>
 ))}
 </div>
 </section>

 <CtaBand
 eyebrow="Boka din helg"
 title="Vilken stad lockar dig mest?"
 text="Berätta vart du vill åka, så sätter vi ihop en helg som passar dig."
 >
 <Link to="/contact" className="sb-btn-light">
 Planera din helg <ArrowRight className="h-4 w-4" />
 </Link>
 </CtaBand>

 <Footer />
 </div>
 );
}
