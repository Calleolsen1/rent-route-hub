import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import vipImage from "@/assets/kaisen-vip.jpg";

const pillars = [
  {
    number: "01",
    title: "Privat Jetflyg",
    description:
      "Skräddarsydda privata flygningar med de bästa operatörerna i Europa. Från direktflyg till chartrade transatlantiska resor — vi hanterar allt från gate till destination.",
  },
  {
    number: "02",
    title: "Exklusiva Boenden",
    description:
      "Privata villas, pärlor av boutique-hotell, slott och overwater-bungalows. Boenden som inte finns på booking.com — som bara är tillgängliga via rätt nätverk.",
  },
  {
    number: "03",
    title: "Privata Yachter",
    description:
      "Chartra en lyxyacht längs Rivieran, Amalfikusten eller de Grekiska öarna. Med privat besättning, köksmästare och en itinerer som är helt din.",
  },
  {
    number: "04",
    title: "Personlig Concierge",
    description:
      "En dedikerad concierge som är tillgänglig 24/7. Från sista-minuten-biljetter till slutsålda galor till reservationer på omöjliga restauranger.",
  },
  {
    number: "05",
    title: "Diskret & Konfidentiellt",
    description:
      "Fullständig diskretion är en självklarhet. Vi hanterar din resa med absolut konfidentialitet och integritet — alltid.",
  },
  {
    number: "06",
    title: "Exklusiv Access",
    description:
      "Privata museiöppningar, backstage vid världsklassiga evenemang, möten med kunniga lokala experter och upplevelser som pengar ensamma inte kan köpa.",
  },
];

const experiences = [
  { title: "Superbilssafari i Alperna", category: "Motorsport & Lyx" },
  { title: "Privat middag på Uffizi-galleriet", category: "Kultur & Gastronomi" },
  { title: "Helikoptertur till Mont Blanc toppen", category: "Äventyr & Exklusivitet" },
  { title: "VIP-biljetter till Cannes filmfestival", category: "Film & Kultur" },
  { title: "Privat vinprovning i Bordeaux", category: "Gastronomi" },
  { title: "Chartered Concorde-upplevelse", category: "Unik Aviation" },
];

export default function VIPService() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[400px] flex items-end">
        <div className="absolute inset-0">
          <img src={vipImage} alt="VIP Service" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/65" />
        </div>
        <div className="relative container mx-auto px-4 pb-16">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            Tjänster — VIP Service
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white">
            Utan <em className="italic font-light text-gold-light">Kompromiss</em>
          </h1>
          <p className="text-white/70 mt-4 text-lg font-light max-w-md">
            För dem som förväntar sig det bästa — och accepterar inget annat.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-navy py-16 border-t border-gold/20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-display text-2xl md:text-3xl text-white italic font-light leading-relaxed">
            "Verklig lyx är när varje detalj är perfekt — och du inte behöver tänka på en enda av dem."
          </p>
          <div className="w-8 h-px bg-gold mx-auto mt-8" />
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Våra Pelare</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              White-Glove Service, Definierat
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-0 border border-border">
            {pillars.map((p, i) => (
              <div
                key={p.number}
                className={`p-10 hover:bg-accent/30 transition-colors border-border ${
                  i % 2 === 0 ? "border-r" : ""
                } ${i < pillars.length - 2 ? "border-b" : ""}`}
              >
                <span className="font-display text-5xl text-primary/20 block mb-4 leading-none">
                  {p.number}
                </span>
                <h3 className="font-display text-2xl text-foreground mb-3">{p.title}</h3>
                <div className="w-8 h-px bg-primary mb-4" />
                <p className="text-muted-foreground text-sm leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Experiences */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">Signaturupplevelser</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Det Omöjliga — Möjligt
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiences.map((exp) => (
              <div key={exp.title} className="bg-background p-8 border border-border hover:border-primary transition-colors">
                <p className="text-[10px] tracking-[0.2em] text-primary uppercase font-sans mb-3">{exp.category}</p>
                <h3 className="font-display text-xl text-foreground">{exp.title}</h3>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground text-sm mt-8 italic">
            Och otaliga fler upplevelser — många av dem skapar vi från grunden, just för dig.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-24">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Privat konsultation</p>
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Din Resa. Dina Villkor.
          </h2>
          <p className="text-white/60 max-w-md mx-auto mb-10 leading-relaxed">
            Kontakta oss för en konfidentiell konsultation. Vi lyssnar, vi förstår — och sedan levererar vi.
          </p>
          <Link to="/contact">
            <Button
              size="lg"
              className="rounded-none bg-primary hover:bg-primary/90 px-12 tracking-wider text-sm"
            >
              Boka konsultation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
