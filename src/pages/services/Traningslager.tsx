import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/camps-hero.jpg";
import laMangaImg from "@/assets/camp-lamanga.jpg";
import algarveImg from "@/assets/camp-algarve.jpg";
import belekImg from "@/assets/camp-belek.jpg";
import italyImg from "@/assets/camp-italy.jpg";
import mallorcaSwimImg from "@/assets/camp-mallorca-swim.jpg";
import monteGordoImg from "@/assets/camp-montegordo.jpg";

const camps = [
  {
    slug: "la-manga",
    image: laMangaImg,
    sport: "Fotboll",
    location: "La Manga, Spanien",
    title: "Klassisk fotbollsdestination",
    desc: "Toppmoderna gräs- och konstgräsplaner, milt klimat året runt och ett av Europas mest etablerade träningsläger för fotbollslag på alla nivåer.",
  },
  {
    slug: "algarve",
    image: algarveImg,
    sport: "Fotboll",
    location: "Algarve, Portugal",
    title: "Vinterläger vid Atlanten",
    desc: "Solsäkra vintrar, professionella anläggningar och ett brett utbud av planer. Populärt bland både ungdomslag och seniorlag i förberedelseperioden.",
  },
  {
    slug: "belek",
    image: belekImg,
    sport: "Fotboll",
    location: "Belek, Turkiet",
    title: "Allt-inkluderat i förstklassig miljö",
    desc: "Stora hotellanläggningar med flera planer på samma område, träningstider efter behov och full service. Perfekt för läger med kort framförhållning.",
  },
  {
    slug: "norra-italien",
    image: italyImg,
    sport: "Fotboll",
    location: "Norra Italien",
    title: "Träning i bergslandskap",
    desc: "Välskötta planer i lugn miljö, högkvalitativ italiensk gastronomi och nära till sjöar och berg för aktiv återhämtning mellan passen.",
  },
  {
    slug: "mallorca-simning",
    image: mallorcaSwimImg,
    sport: "Simning",
    location: "Mallorca, Spanien",
    title: "50-metersbassäng under öppen himmel",
    desc: "Olympisk utomhusbassäng med hela banor till förfogande, varma morgnar och boenden direkt vid anläggningen. Ideal för seriösa simläger.",
  },
  {
    slug: "monte-gordo",
    image: monteGordoImg,
    sport: "Friidrott",
    location: "Monte Gordo, Portugal",
    title: "Tartanbana med havet runt hörnet",
    desc: "Fullstor friidrottsanläggning med kastbur, längdhoppsgrop och milt vinterklimat. En favorit för svenska friidrottsklubbar i februari–mars.",
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

export default function Traningslager() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[420px] flex items-end">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Träningsläger" className="w-full h-full object-cover" width={1920} height={1024} />
          <div className="absolute inset-0 bg-navy/65" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            Tjänster — Träningsläger
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white leading-tight">
            En värld där idrott<br />
            <em className="italic font-light text-gold-light">och resor möts</em>
          </h1>
          <p className="text-white/70 mt-4 text-lg font-light max-w-xl">
            Träningsläger för fotboll, simning och friidrott — för föreningar, lag och grupper som vill ta träningen till nästa nivå.
          </p>
        </div>
      </section>

      {/* Camps grid */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Utvalda Träningsläger</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Ett axplock av <em className="italic font-light">våra läger</em>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Detta är ett urval ur vårt kompletta program. Hör av er så hittar vi rätt destination för just ert lag.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {camps.map((camp) => (
              <Link
                key={camp.title}
                to={`/contact?intresse=traningslager&laeger=${encodeURIComponent(camp.location)}`}
                className="group bg-background overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Läs mer om ${camp.sport}läger i ${camp.location}`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={camp.image}
                    alt={`${camp.sport}läger i ${camp.location}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    width={1280}
                    height={896}
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] tracking-[0.25em] uppercase bg-accent text-accent-foreground px-2.5 py-1 font-sans">
                      {camp.sport}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {camp.location}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-foreground mb-2">{camp.title}</h3>
                  <div className="w-8 h-px bg-primary mb-3" />
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">{camp.desc}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all mt-auto">
                    Läs mer
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-display text-2xl md:text-3xl text-foreground italic font-light leading-relaxed">
            "Hos oss handlar det inte bara om träning — det handlar om att skapa energi, laganda och motivation som varar långt efter lägret är slut."
          </p>
          <div className="w-8 h-px bg-primary mx-auto mt-8" />
        </div>
      </section>

      {/* Pillar text blocks */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Noggrant Utvalda Destinationer</p>
              <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                Europas bästa träningsmiljöer
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed">
                Våra destinationer i Europa är noggrant utvalda för att ge bästa förutsättningarna för träning, vila och inspiration. Spanien, Turkiet, Italien, Portugal, Polen, Holland, Tyskland, Danmark och Sverige — soliga kustorter, moderna anläggningar och klassiska idrottsstäder.
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Vi Tar Hand Om Helheten</p>
              <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                Ni fokuserar på träningen
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed">
                Att planera ett träningsläger kan vara komplext — men vi gör det enkelt. Transport, boende, träningstider och praktiska detaljer hanterar vi. Varje upplägg skräddarsys efter era mål och förväntningar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stronger together + features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">En Resa Som Stärker Laget</p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                Mer än bara träning
              </h2>
              <div className="w-10 h-px bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-6">
                Ett framgångsrikt träningsläger handlar om gemenskap, glädje och att skapa minnen tillsammans. Vi planerar varje del med omtanke — från träning till fritid, från logistik till upplevelser.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Målet är att varje deltagare ska känna sig motiverad, inspirerad och delaktig.
              </p>
            </div>
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Hör av er</p>
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Låt oss skapa ert nästa <em className="italic font-light text-gold-light">träningsläger</em>
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            Berätta om era idéer, mål och behov — så tar vi fram ett upplägg som passar just ert lag.
          </p>
          <Link to="/contact">
            <Button
              size="lg"
              className="rounded-none bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm"
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
