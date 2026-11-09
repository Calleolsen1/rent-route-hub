import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import sportsImage from "@/assets/kaisen-sports.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";
const f1Image = PHOTO["sport-f1"];
const fotbollImage = PHOTO["sport-fotboll"];
import { usePageMeta } from "@/lib/usePageMeta";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import { PHOTO } from "@/data/photos";

const sports = [
 {
 id: "f1",
 title: "Formel 1",
 heading: "Formel 1-resor",
 image: f1Image,
 description:
 "Se kvalet och racet på plats. Vi ordnar resor till F1-banorna i kalendern, och du kan boka biljetter, hotell, flyg och transfer var för sig eller som en hel resa.",
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
 "Derbyn i Premier League, Serie A och La Liga, och matcher i Champions League. Du kan boka matchbiljetter, hotell, flyg och transfer var för sig eller som en hel resa.",
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
   description: "Sportresor med biljetter, hotell, flyg och transfer till F1, Premier League, Champions League och fler sportevent. Personlig service från KAISEN TRAVEL GROUP.",
 });
 return (
 <div className="min-h-screen">
 <Navbar />

 <PageHero image={sportsImage} imageAlt="Sportresor" eyebrow="Sportresor" title="Sportresor">
 <p className="font-display text-xl md:text-2xl italic text-white mb-2">
 Sport upplevs bäst på plats
 </p>
 Formel 1 och Europas största fotbollsmatcher. Boka allt från matchbiljett och hotell till flyg och transfer, eller bara de delar du behöver.
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
 <p className="eyebrow text-primary uppercase mb-2">{sport.title}</p>
 <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
 {sport.heading}
 </h2>
 <p className="text-foreground/80 leading-relaxed mb-6 text-[15px]">
 {sport.description}
 </p>
 <ul className="mb-8 divide-y divide-border border-y border-border">
 {sport.features.map((f) => (
 <li key={f} className="py-2.5 text-sm text-foreground/85">{f}</li>
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
 title="Vilken match eller vilket lopp vill du se?"
 text="Berätta vad du vill se på plats, så sätter vi ihop en resa efter dina önskemål."
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
