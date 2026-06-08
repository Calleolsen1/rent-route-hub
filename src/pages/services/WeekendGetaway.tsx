import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import weekendImage from "@/assets/kaisen-weekend.jpg";
import parisImage from "@/assets/city-paris.jpg";
import amsterdamImage from "@/assets/city-amsterdam.jpg";
import barcelonaImage from "@/assets/city-barcelona.jpg";
import copenhagenImage from "@/assets/city-copenhagen.jpg";
import pragueImage from "@/assets/city-prague.jpg";
import veniceImage from "@/assets/city-venice.jpg";

const destinations = [
 {
 city: "Paris",
 country: "Frankrike",
 image: parisImage,
 tagline: "Kaféer, konst & croissanter",
 description:
 "Börja morgonen med en crème brûlée-latte på ett gatukafé, strosa längs Seine och avsluta dagen med middag i en liten bistro i Le Marais. Paris är platsen för de som vill sakta ner och njuta.",
 },
 {
 city: "Amsterdam",
 country: "Nederländerna",
 image: amsterdamImage,
 tagline: "Kanaler, cykel & kultur",
 description:
 "Hyr en cykel och följ kanalerna genom stadens charmiga kvarter. Besök Rijksmuseet, fika på ett brunt hörncafé och ta en kvällsbåt längs de upplystta husfasaderna.",
 },
 {
 city: "Barcelona",
 country: "Spanien",
 image: barcelonaImage,
 tagline: "Tapas, sol & arkitektur",
 description:
 "Vandra runt bland Gaudís drömska byggnader på dagen och gå på tapasrunda i El Born på kvällen. Barcelona ger dig den perfekta mixen av avslappning, mat och upplevelser.",
 },
 {
 city: "Köpenhamn",
 country: "Danmark",
 image: copenhagenImage,
 tagline: "Hygge, ljus & skandinavisk mat",
 description:
 "Känn hygge-känslan i ett litet kafé med levande ljus och nybakade kanelbullar. Utforska Nørrebro till fots och avsluta kvällen på en av stadens bästa restauranger.",
 },
 {
 city: "Prag",
 country: "Tjeckien",
 image: pragueImage,
 tagline: "Medeltid, öl & kvällsstämning",
 description:
 "Ta en promenad över Karlsbroen i skymningen och utforska Gamla Stans vindlande gränder. Kvällen avslutas med ett lokalt hantverk-öl på en krypin-bar under stadens gotiska torn.",
 },
 {
 city: "Venedig",
 country: "Italien",
 image: veniceImage,
 tagline: "Gondoler, solnedgångar & cicchetti",
 description:
 "Gå vilse bland Venedigs smala kanaler och rondola-broar — det är omöjligt att inte charmas. Prova cicchetti (venetiansk tapas) på en lokal bacaro och se solnedgången spegla sig i vattnet.",
 },
];

export default function WeekendGetaway() {
 return (
 <div className="min-h-screen">
 <Navbar />

 {/* Hero */}
 <section className="relative h-[50vh] min-h-[360px] flex items-end">
 <div className="absolute inset-0">
 <img src={weekendImage} alt="Weekend Getaway" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-navy/65" />
 </div>
 <div className="relative container mx-auto px-4 pb-14">
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
 Tjänster — Weekend Getaway
 </p>
 <h1 className="font-display text-4xl md:text-6xl text-white">
 Europas Mysigaste <em className="italic font-light text-white">Helgresmål</em>
 </h1>
 </div>
 </section>

 {/* Intro */}
 <section className="bg-cream py-14">
 <div className="container mx-auto px-4 max-w-3xl text-center">
 <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
 "Tre dagar kan förändra allt. Vi ser till att de tre dagarna blir minnesvärda."
 </p>
 <div className="w-8 h-px bg-primary mx-auto mt-8" />
 </div>
 </section>

 {/* City Sections */}
 <section className="py-12 md:py-16 bg-background">
 <div className="container mx-auto px-4 space-y-24">
 {destinations.map((dest, index) => (
 <div
 key={dest.city}
 className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${
 index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
 }`}
 >
 {/* Image */}
 <div className="aspect-[4/3] overflow-hidden">
 <img
 src={dest.image}
 alt={dest.city}
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>

 {/* Content */}
 <div>
 <div className="flex items-baseline gap-3 mb-1">
 <h2 className="font-display text-4xl md:text-5xl text-foreground">{dest.city}</h2>
 <span className="text-sm text-muted-foreground">{dest.country}</span>
 </div>
 <p className="text-[10px] tracking-[0.25em] uppercase text-primary font-sans mb-4">
 {dest.tagline}
 </p>
 <div className="w-10 h-px bg-primary mb-6" />
 <p className="text-muted-foreground leading-relaxed text-base mb-10">
 {dest.description}
 </p>
 <Link to="/contact">
 <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 tracking-wider text-sm">
 Boka helgresa till {dest.city}
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
 <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Boka din helg</p>
 <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
 Vilken stad lockar dig mest?
 </h2>
 <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
 Berätta vart du vill och vi skräddarsyr ett helgpaket som passar dig perfekt.
 </p>
 <Link to="/contact">
 <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm">
 Planera din helg <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <Footer />
 </div>
 );
}
