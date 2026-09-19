import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import { usePageMeta } from "@/lib/usePageMeta";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import f1Image from "@/assets/sport-f1.jpg";
import groupImage from "@/assets/kaisen-group.jpg";
import valenciaImage from "@/assets/camp-valencia-pitch.jpg.asset.json";

const choices = [
  {
    tag: "Matchupplevelser",
    title: "Fotboll",
    subtitle: "Premier League · La Liga · Serie A · Bundesliga",
    description:
      "Välj liga och lag - vi paketerar resan med hotell, transfer och platser på läktaren.",
    image: fotbollImage,
    href: "/services/sportresor/fotboll",
  },
  {
    tag: "Premiumupplevelser",
    title: "Formel 1",
    subtitle: "Monaco · Silverstone · Spa · Las Vegas",
    description:
      "Alla race i kalendern - välj helg och vi ordnar biljetter, boende och logistik.",
    image: f1Image,
    href: "/services/sportresor/f1",
  },
  {
    tag: "Lag & klubbar",
    title: "Träningsläger",
    subtitle: "Fotboll · Simning · Friidrott",
    description:
      "Kompletta läger i Spanien, Turkiet och Cypern - planer, boende och helpension.",
    image: valenciaImage.url,
    href: "/services/traningslager",
  },
  {
    tag: "Företag & sällskap",
    title: "Grupp & Konferens",
    subtitle: "Konferenser · Kickoffer · Gruppresor",
    description:
      "Från åtta till 200+ resenärer - vi sköter program, logi och all logistik på plats.",
    image: groupImage,
    href: "/group-travel",
  },
];

const Resor = () => {
  usePageMeta({
    title: "Utforska alla resor - Kaisen Travel Group",
    description:
      "Välj mellan fotbollsresor, Formel 1, träningsläger och grupp- och konferensresor - vi paketerar hela resan.",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-primary text-primary-foreground pt-14 pb-12 sm:pt-24 sm:pb-16 md:pt-40 md:pb-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70 mb-4">
            Utforska alla resor
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">Vart vill du resa?</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Välj en kategori så visar vi ligor, lag, race och destinationer - och sätter ihop
            hela resan med hotell, flyg och transfer.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2">
            {choices.map((c) => (
              <Link
                key={c.title}
                to={c.href}
                className="group block bg-card rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-shadow"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />
                  <span className="absolute top-4 left-4 text-[9px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-2.5 py-1 font-sans">
                    {c.tag}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h2 className="font-display text-2xl md:text-3xl text-white mb-1">{c.title}</h2>
                    <p className="text-[10px] tracking-wider text-white/85 uppercase font-sans">
                      {c.subtitle}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {c.description}
                  </p>
                  <span className="text-primary text-sm font-semibold flex items-center gap-2 transition-all group-hover:gap-3">
                    Se resorna <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <RequestCta />
      <Footer />
    </div>
  );
};

export default Resor;
