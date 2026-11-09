import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import sportsImage from "@/assets/kaisen-sports.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";
import f1Image from "@/assets/sport-f1.jpg";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import { usePageMeta } from "@/lib/usePageMeta";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";

const sports = [
 {
 id: "f1",
 title: "Formel 1",
 heading: "Formel 1-resor",
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
 heading: "Fotbollsresor",
 image: fotbollImage,
 description:
 "Upplev Europas bästa fotbollsmatcher på plats – från klassiska derbyn i Premier League, Serie A och La Liga - till Champions League. Vi hjälper dig att skapa just din fotbollsresa - med möjlighet att boka matchbiljetter, hotell, flyg och transfer var för sig eller som en komplett resa.",
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
   title: "Sportresor - F1 & Fotboll | Kaisen Travel Group",
   description: "Skräddarsydda sportresor med hotell, transfer och upplevelser till F1-race, Premier League, Champions League och fler sportevent. Personlig service från KAISEN TRAVEL GROUP.",
 });
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero image={sportsImage} imageAlt="Sportresor" eyebrow="Tjänster - Sportresor" title="Sportresor">
 <p className="font-display text-xl md:text-2xl italic font-semibold uppercase text-white mb-2">
 Sport upplevs bäst LIVE
 </p>
 Upplev Formel 1 och Europas bästa fotbollsmatcher på plats. Vi skräddarsyr din sportresa efter dina önskemål – boka allt från matchbiljett och hotell till flyg och transfer, eller välj bara de delar du behöver.
 </PageHero>

 {/* Sport Sections - alternating media/text bands */}
 {sports.map((sport, index) => (
 <section key={sport.id} id={sport.id} className={index % 2 === 1 ? "sb-section-alt" : "sb-section"}>
 <div
 className={`sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center ${
 index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
 }`}
 >
 {/* Image */}
 <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
 <img
 src={sport.image}
 alt={sport.title}
 className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
 />
 </div>

 {/* Content */}
 <div>
 <p className="eyebrow text-primary uppercase mb-1">{sport.title}</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
 {sport.heading}
 </h2>
 <p className="text-foreground/80 leading-relaxed mb-6 text-[15px]">
 {sport.description}
 </p>
 <ul className="space-y-2.5 mb-8">
 {sport.features.map((f) => (
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
 ))}

 <CtaBand
 image={luxuryImage}
 eyebrow="Boka din sportresa"
 title="Vilken sportupplevelse drömmer du om?"
 text="Berätta vilken match eller tävling du vill uppleva på plats. Vi hjälper dig att skapa en sportresa anpassad efter dina önskemål."
 >
 <Link to="/contact" className="sb-btn-light">
 Kontakta oss
 <ArrowRight className="h-4 w-4" />
 </Link>
 </CtaBand>

 <RequestCta />
      <Footer />
 </div>
 );
}
