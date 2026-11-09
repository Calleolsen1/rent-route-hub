import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
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
 "Gå vilse bland Venedigs smala kanaler och rondola-broar - det är omöjligt att inte charmas. Prova cicchetti (venetiansk tapas) på en lokal bacaro och se solnedgången spegla sig i vattnet.",
 },
];

export default function WeekendGetaway() {
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero
 image={weekendImage}
 imageAlt="Weekend Getaway"
 eyebrow="Tjänster - Weekend Getaway"
 title={<>Europas Mysigaste <em className="italic text-white">Helgresmål</em></>}
 action={null}
 />

 {/* Intro */}
 <section className="sb-section-alt">
 <div className="sb-container max-w-3xl text-center">
 <p className="font-display text-2xl md:text-3xl text-foreground italic font-semibold uppercase leading-snug">
 "Tre dagar kan förändra allt. Vi ser till att de tre dagarna blir minnesvärda."
 </p>
 </div>
 </section>

 {/* City Sections - alternating media/text bands */}
 {destinations.map((dest, index) => (
 <section key={dest.city} className={index % 2 === 1 ? "sb-section-alt" : "sb-section"}>
 <div
 className={`sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center ${
 index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
 }`}
 >
 {/* Image */}
 <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
 <img
 src={dest.image}
 alt={dest.city}
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>

 {/* Content */}
 <div>
 <p className="eyebrow text-primary uppercase mb-1">{dest.tagline}</p>
 <div className="flex items-baseline gap-3 mb-4">
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground">{dest.city}</h2>
 <span className="text-sm text-muted-foreground">{dest.country}</span>
 </div>
 <p className="text-foreground/80 leading-relaxed text-[15px] mb-8">
 {dest.description}
 </p>
 <Link to="/contact" className="sb-btn-primary">
 Boka helgresa till {dest.city}
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 </section>
 ))}

 <CtaBand
 eyebrow="Boka din helg"
 title="Vilken stad lockar dig mest?"
 text="Berätta vart du vill och vi skräddarsyr ett helgpaket som passar dig perfekt."
 >
 <Link to="/contact" className="sb-btn-light">
 Planera din helg <ArrowRight className="h-4 w-4" />
 </Link>
 </CtaBand>

 <Footer />
 </div>
 );
}
