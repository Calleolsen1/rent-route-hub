import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import sportsImage from "@/assets/kaisen-sports.jpg";
import luxuryImage from "@/assets/kaisen-luxury.jpg";
import { PHOTO } from "@/data/photos";
const groupImage = PHOTO["kaisen-group"];
import heroImage from "@/assets/kaisen-hero.jpg";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";

const categories = [
 {
  id: "group",
  tag: "Gruppresor",
  title: "Resor som blir bättre tillsammans",
  description: "Ett jubileum, en företagskonferens, en släktresa eller en grupp vänner med samma intresse. Vi sköter detaljerna så att ni kan njuta av resan.",
  image: groupImage,
  features: [
  "Grupper från 8 till 200+ resenärer",
  "En egen gruppsamordnare",
  "Förhandlade grupppriser och exklusiv tillgång",
  "Program efter gruppens intressen",
  "Flygplatstransfer och logistik",
  "Support på plats under hela resan",
  ],
  cta: "/group-travel",
  ctaLabel: "Utforska gruppresor",
 },
 {
  id: "sports",
  tag: "Sport och äventyr",
  title: "Sportresor för dig som ställer krav",
  description: "Vi ordnar resor för dig som vill se sporten på plats: fotboll, Formel 1, golf, skidåkning och segling. Biljetter, boende och resa planeras av samma person.",
  image: sportsImage,
  features: [
  "Fotbollsresor till Europas största ligor",
  "Formel 1 och motorsporthelger",
  "Skidresor till Alperna",
  "Golfresor med handplockade banor",
  "Träningsläger för lag och klubbar",
  "Personlig service från start till mål",
  ],
  cta: "/services/sportresor",
  ctaLabel: "Se våra sportresor",
 },
 {
  id: "luxury",
  tag: "Exklusiva resor",
  title: "När allt ska vara rätt",
  description: "För dig som vill ha det lilla extra: noga utvalda hotell, privata transfers och upplevelser som är svåra att boka på egen hand.",
  image: luxuryImage,
  features: [
  "Handplockade hotell och boenden",
  "Resprogram efter dina önskemål",
  "Upplevelser som är svåra att boka själv",
  "Personlig reseplanering",
  "Diskret och personlig service",
  ],
  cta: "/contact",
  ctaLabel: "Gör en förfrågan",
 },
];

export default function Services() {
 return (
  <div className="min-h-screen">
  <Navbar />

  <PageHero
  image={heroImage}
  imageAlt="KAISEN TRAVEL GROUP"
  eyebrow="Våra specialiteter"
  title={<>Upplevelser och <em className="italic font-light text-white">tjänster</em></>}
  action={null}
  />

  {/* Intro */}
  <section className="sb-section-alt">
  <div className="sb-container max-w-[880px]">
   <p className="font-display text-2xl md:text-[34px] text-foreground leading-snug border-l-2 border-primary pl-5">
   Varje resa börjar med ett samtal. Först lyssnar vi, sedan planerar vi.
   </p>
  </div>
  </section>

  {/* Tjänster */}
  {categories.map((cat, index) => (
  <section key={cat.id} id={cat.id} className={index % 2 === 1 ? "sb-section-alt" : "sb-section"}>
   <div className="sb-container">
   <div className={`grid md:grid-cols-2 gap-8 lg:gap-14 items-center ${index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
    <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
    <img
     src={cat.image}
     alt={cat.title}
     className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
    />
    </div>
    <div>
    <p className="eyebrow text-primary uppercase mb-1">
     {cat.tag}
    </p>
    <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">{cat.title}</h2>
    <p className="text-foreground/80 leading-relaxed mb-6 text-[15px]">{cat.description}</p>
    <ul className="grid sm:grid-cols-2 gap-x-8 border-t border-border mb-8">
     {cat.features.map((f) => (
     <li key={f} className="border-b border-border py-2.5 text-sm text-foreground/85">
      {f}
     </li>
     ))}
    </ul>
    <Link to={cat.cta} className="sb-btn-primary">
     {cat.ctaLabel}
     <ArrowRight className="h-4 w-4" />
    </Link>
    </div>
   </div>
   </div>
  </section>
  ))}

  <CtaBand
  eyebrow="Fler resmål och idéer"
  title="Hittar du inte det du söker?"
  text="Vi ordnar mer än det som står här. Berätta vad du har i tankarna så ser vi vad vi kan göra."
  >
  <Link to="/contact" className="sb-btn-light">
   Prata med en rådgivare
  </Link>
  </CtaBand>

  <RequestCta />
      <Footer />
  </div>
 );
}
