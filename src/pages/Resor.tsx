import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import { usePageMeta } from "@/lib/usePageMeta";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import f1Image from "@/assets/sport-f1.jpg";
import groupImageAsset from "@/assets/kaisen-group-europe-skyline.jpg.asset.json";
const groupImage = groupImageAsset.url;
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

      <section className="relative overflow-hidden bg-navy-deep text-white">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-40 h-[420px] w-[520px] rotate-[18deg] rounded-[80px] bg-white/[0.05]" />
        <div aria-hidden className="pointer-events-none absolute right-[30%] -bottom-56 h-[360px] w-[420px] -rotate-[24deg] rounded-[80px] bg-white/[0.035]" />
        <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-14">
          <p className="eyebrow text-sky-300 uppercase mb-1.5">
            Utforska alla resor
          </p>
          <h1 className="font-display text-[34px] sm:text-5xl md:text-6xl text-white mb-3">Vart vill du resa?</h1>
          <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-2xl">
            Välj en kategori så visar vi ligor, lag, race och destinationer - och sätter ihop
            hela resan med hotell, flyg och transfer.
          </p>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-container">
          <div className="grid gap-5 sm:grid-cols-2">
            {choices.map((c) => (
              <Link
                key={c.title}
                to={c.href}
                className="group block sb-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/30 to-transparent" />
                  <span className="absolute top-4 left-4 rounded-md bg-white text-primary px-2.5 py-1 font-display uppercase font-semibold text-sm tracking-wide">
                    {c.tag}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h2 className="font-display text-3xl md:text-4xl text-white mb-1">{c.title}</h2>
                    <p className="text-xs tracking-wide text-white/85 uppercase">
                      {c.subtitle}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-foreground/75 leading-relaxed mb-3">
                    {c.description}
                  </p>
                  <span className="text-primary font-display uppercase font-semibold tracking-wide text-[15px] flex items-center gap-2 transition-all group-hover:gap-3">
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
