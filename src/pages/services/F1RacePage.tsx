import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Calendar, MapPin, Flag } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import f1Image from "@/assets/sport-f1.jpg";

type RaceInfo = {
  name: string;
  circuit: string;
  city: string;
  date: string;
  tagline: string;
  description: string;
};

const RACES: Record<string, RaceInfo> = {
  "ungern": { name: "Ungerns Grand Prix", circuit: "Hungaroring", city: "Budapest, Ungern", date: "26 juli 2026", tagline: "Monaco utan barriärerna", description: "Hungaroring är en av kalenderns mest tekniska banor — en kurvig utmaning där föraren räknas mer än bilen." },
  "italien-monza": { name: "Italiens Grand Prix", circuit: "Autodromo Nazionale Monza", city: "Monza, Italien", date: "6 september 2026", tagline: "Hastighetens tempel", description: "Monza — F1:s historiska hem och hastighetens tempel. Tifosin målar tribunerna röda när Ferrari kör hemma." },
  "spanien-madrid": { name: "Spaniens Grand Prix", circuit: "Madring", city: "Madrid, Spanien", date: "13 september 2026", tagline: "Spaniens nya F1-bana", description: "Madring är F1:s nya stadsbana i Madrid — en spektakulär kombination av gata och permanent bana." },
  "usa-austin": { name: "USA:s Grand Prix", circuit: "Circuit of the Americas", city: "Austin, Texas", date: "25 oktober 2026", tagline: "Allt är större i Texas", description: "Austin bjuder på fest, livemusik och en av kalenderns mest älskade banor — Circuit of the Americas." },
  "las-vegas": { name: "Las Vegas Grand Prix", circuit: "Las Vegas Strip Circuit", city: "Las Vegas, USA", date: "21 november 2026", tagline: "F1 under neonen", description: "F1-bilar i 350 km/h ner för Las Vegas Strip i mörkret — kalenderns mest spektakulära nattevent." },
  "qatar": { name: "Qatars Grand Prix", circuit: "Lusail International Circuit", city: "Doha, Qatar", date: "29 november 2026", tagline: "Race under stjärnorna", description: "Lusail bjuder på ett av säsongens snabbaste flytande race under Qatars stjärnhimmel." },
  "abu-dhabi": { name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", city: "Abu Dhabi, UAE", date: "6 december 2026", tagline: "Säsongsfinalen", description: "F1-säsongens finale på Yas Marina — race från sol till mörker med yacht-show och världsklass-fest." },
  "miami": { name: "Miami Grand Prix", circuit: "Miami International Autodrome", city: "Miami, USA", date: "9 maj 2027", tagline: "F1 möter South Beach", description: "Miami GP runt Hard Rock Stadium — F1, palmer och South Beach-fest i Florida-värmen." },
  "monaco": { name: "Monacos Grand Prix", circuit: "Circuit de Monaco", city: "Monte Carlo, Monaco", date: "6 juni 2027", tagline: "Kronan i F1-kalendern", description: "Monaco — F1:s mest prestigefulla race. Gatorna i Monte Carlo, yachterna i hamnen, glamouren utan motstycke." },
  "algarve": { name: "Algarves Grand Prix", circuit: "Autódromo do Algarve", city: "Portimão, Portugal", date: "13 juni 2027", tagline: "Bergen och Atlanten", description: "Portimão — en av F1:s mest dramatiska banor med branta backar och Atlanten som fond." },
};

export default function F1RacePage() {
  const { race } = useParams<{ race: string }>();
  const info = race ? RACES[race] : undefined;

  if (!info) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display text-4xl mb-4">Racet hittades inte</h1>
          <Link to="/services/sportresor">
            <Button className="rounded-full">Tillbaka till Sportresor</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative h-[55vh] min-h-[400px] flex items-end">
        <div className="absolute inset-0">
          <img src={f1Image} alt={info.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
            F1-resa — {info.date}
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white mb-3">{info.name}</h1>
          <p className="font-display italic font-light text-white text-xl md:text-2xl">
            {info.tagline}
          </p>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Plats</p>
                <p className="font-medium">{info.city}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Flag className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Bana</p>
                <p className="font-medium">{info.circuit}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Datum</p>
                <p className="font-medium">{info.date}</p>
              </div>
            </div>
          </div>
          <p className="font-display text-xl md:text-2xl text-foreground italic font-light leading-relaxed text-center">
            "{info.description}"
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans text-center">Vad ingår</p>
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">Kompletta F1-paket</h2>
          <ul className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              "Biljetter till träning, kval och race",
              "Hotell nära banan eller centralt",
              "Flyg från valfri svensk flygplats",
              "Transfer till och från banan",
              "Paddock Club-uppgradering möjlig",
              "Svensk reseledare på plats",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 bg-card border border-border p-4 rounded-lg">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Boka din F1-resa</p>
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Redo för {info.name}?
          </h2>
          <Link to="/contact">
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 tracking-wider text-sm">
              Kontakta oss <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
