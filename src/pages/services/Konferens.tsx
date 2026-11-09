import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";
import RequestCta from "@/components/RequestCta";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/site/PageHero";
import { useInquiryDialog } from "@/components/InquiryDialog";
import { PHOTO } from "@/data/photos";
const konferensHero = PHOTO["konferens-hero"];
const konferens1 = PHOTO["konferens-dinner"];
const konferens2 = PHOTO["konferens-event"];

const packages = [
  {
    title: "Konferens och möten",
    tagline: "Lokaler · AV-teknik · Koordinering",
    desc: "Vi bokar rätt lokal för er grupps storlek och teknikbehov. Allt från små mötesrum till kongresshallar.",
  },
  {
    title: "Mat och middagar",
    tagline: "Fika · Lunch · Galamiddag",
    desc: "Från enkel fika till flerrättersmiddag med underhållning.",
  },
  {
    title: "Aktiviteter",
    tagline: "Teambuilding · Kultur · Äventyr",
    desc: "Matlagningskurser, privata museibesök, vinprovningar eller aktiviteter utomhus.",
  },
  {
    title: "Transport och logistik",
    tagline: "Flyg · Transfer · Shuttle",
    desc: "Vi ordnar alla deltagares resor, från flygbiljetter till bussar mellan hotell och lokal.",
  },
  {
    title: "Teknik och uppkoppling",
    tagline: "Uppkoppling · Streaming · Helpdesk",
    desc: "Stabilt wifi, hybridlösningar och tekniker på plats.",
  },
  {
    title: "Kvällsprogram",
    tagline: "Speaker · Shower · Middagsarrangemang",
    desc: "Talare, shower och kvällsarrangemang, samordnat med resten av programmet.",
  },
];

const formats = [
  { title: "Dagsmöte", desc: "Lokal, teknik, lunch och fika är klart när ni kommer.", guests: "10–50" },
  { title: "Konferens 2–3 dagar", desc: "Boende, middagar och aktiviteter ingår.", guests: "20–150" },
  { title: "Incentiveresa", desc: "En resa utomlands som tack till medarbetare som gjort ett bra år.", guests: "10–100" },
  { title: "Stor kongress", desc: "Internationella kongresser i Europas stora kongresscenter.", guests: "100–500+" },
];

export default function Konferens() {
  const { open: openInquiry } = useInquiryDialog();
  const openKonferensInquiry = () =>
    openInquiry({
      type: "conference",
      eyebrow: "Begär offert",
      heading: "Berätta om er konferens",
      intro: "Antal deltagare, ungefärliga datum, destination och budget. Vi återkommer med ett komplett förslag.",
    });
  return (
    <div className="min-h-screen">
      <Navbar />

      <PageHero
        image={konferensHero}
        imageAlt="Konferensresor utomlands"
        eyebrow="Konferens & Event"
        title={<>Konferenser <em className="italic text-white">utan krångel</em></>}
        action={
          <button type="button" onClick={openKonferensInquiry} className="sb-btn-light">
            <MessageSquare className="h-4 w-4" />
            Begär offert
          </button>
        }
      >
        Vi sköter det praktiska, så att ni kan lägga tiden på innehållet.
      </PageHero>

      {/* What we arrange: numbered editorial list, no icon cards */}
      <section className="sb-section">
        <div className="sb-container">
          <p className="eyebrow text-primary uppercase mb-2">Det här ordnar vi</p>
          <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-8 md:mb-10 max-w-2xl">
            Hela arrangemanget, <em className="italic">från idé till genomförande</em>
          </h2>
          <ol className="grid md:grid-cols-2 gap-x-14 border-t border-border">
            {packages.map((pkg, i) => (
              <li key={pkg.title} className="flex gap-5 border-b border-border py-6">
                <span className="font-display text-2xl text-primary tabular-nums leading-none pt-1">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-xl text-foreground">{pkg.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">{pkg.tagline}</p>
                  <p className="text-foreground/80 text-sm leading-relaxed">{pkg.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Formats - compact cards */}
      <section className="sb-section-alt">
        <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div>
            <p className="eyebrow text-primary uppercase mb-2">Format</p>
            <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-6">
              Fyra vanliga upplägg
            </h2>
            <dl className="divide-y divide-border border-y border-border">
              {formats.map((f) => (
                <div key={f.title} className="py-4">
                  <dt className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-xl text-foreground">{f.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{f.guests} deltagare</span>
                  </dt>
                  <dd className="text-muted-foreground text-sm mt-1">{f.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg">
            <img
              src={konferens2}
              alt="Konferens utomlands"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* Full Service - short pitch */}
      <section className="sb-section">
        <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg md:order-1">
            <img
              src={konferens1}
              alt="Konferensmiddag"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div>
            <p className="eyebrow text-primary uppercase mb-2">Samordning</p>
            <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] text-foreground mb-4">
              En kontaktperson för allt
            </h2>
            <p className="text-foreground/80 leading-relaxed mb-6 text-[15px]">
              I stället för att ringa hotell, lokal, catering och teknik var för sig pratar ni med oss. Vi håller ihop alla delar och ser till att inget faller mellan stolarna.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Lokalbokning, AV och teknik, catering, logistik, aktiviteter och support på plats.
            </p>
            <button type="button" onClick={openKonferensInquiry} className="sb-btn-primary">
              Begär offert
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <RequestCta />
      <Footer />
    </div>
  );
}
