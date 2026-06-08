import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Calendar, MapPin, Trophy } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import fotbollImage from "@/assets/sport-fotboll.jpg";

type TeamInfo = {
  name: string;
  league: string;
  city: string;
  stadium: string;
  tagline: string;
  description: string;
  fixtures: { opponent: string; date: string; competition: string }[];
};

const TEAMS: Record<string, TeamInfo> = {
  "bayern-munchen": { name: "Bayern München", league: "Bundesliga", city: "München, Tyskland", stadium: "Allianz Arena", tagline: "Tysk fotbollskungadynasti", description: "Upplev Bayern München på Allianz Arena — en av Europas mest ikoniska klubbar med en historia full av titlar och stjärnor.", fixtures: [{ opponent: "Borussia Dortmund", date: "12 oktober 2026", competition: "Bundesliga" }, { opponent: "Real Madrid", date: "5 november 2026", competition: "Champions League" }, { opponent: "RB Leipzig", date: "23 november 2026", competition: "Bundesliga" }] },
  "borussia-dortmund": { name: "Borussia Dortmund", league: "Bundesliga", city: "Dortmund, Tyskland", stadium: "Signal Iduna Park", tagline: "Den gula väggen", description: "Signal Iduna Park rymmer den legendariska Gula Väggen — 25 000 stående fans som skapar Europas mäktigaste fotbollsatmosfär.", fixtures: [{ opponent: "Bayern München", date: "12 oktober 2026", competition: "Bundesliga" }, { opponent: "Schalke 04", date: "26 oktober 2026", competition: "Bundesliga" }, { opponent: "Manchester City", date: "12 november 2026", competition: "Champions League" }] },
  "atletico-madrid": { name: "Atlético Madrid", league: "La Liga", city: "Madrid, Spanien", stadium: "Metropolitano", tagline: "Cholismo & passion", description: "Atléticos hemmaarena Metropolitano kokar av rojiblanco-passion. En klubb byggd på arbete, stolthet och spanska titlar.", fixtures: [{ opponent: "Real Madrid", date: "28 september 2026", competition: "La Liga" }, { opponent: "FC Barcelona", date: "18 oktober 2026", competition: "La Liga" }, { opponent: "Sevilla", date: "8 november 2026", competition: "La Liga" }] },
  "fc-barcelona": { name: "FC Barcelona", league: "La Liga", city: "Barcelona, Spanien", stadium: "Spotify Camp Nou", tagline: "Més que un club", description: "FC Barcelona — mer än en klubb. Upplev El Clásico, La Liga-toppmöten och Champions League-kvällar i den katalanska metropolen.", fixtures: [{ opponent: "Real Madrid", date: "26 oktober 2026", competition: "La Liga" }, { opponent: "Atlético Madrid", date: "18 oktober 2026", competition: "La Liga" }, { opponent: "Bayern München", date: "3 december 2026", competition: "Champions League" }] },
  "real-madrid": { name: "Real Madrid", league: "La Liga", city: "Madrid, Spanien", stadium: "Santiago Bernabéu", tagline: "Hala Madrid", description: "Santiago Bernabéu — fotbollens katedral. Upplev de vita på en av sportens mest historiska arenor.", fixtures: [{ opponent: "FC Barcelona", date: "26 oktober 2026", competition: "La Liga" }, { opponent: "Atlético Madrid", date: "28 september 2026", competition: "La Liga" }, { opponent: "Liverpool", date: "26 november 2026", competition: "Champions League" }] },
  "arsenal": { name: "Arsenal", league: "Premier League", city: "London, England", stadium: "Emirates Stadium", tagline: "North London is red", description: "Arsenal på Emirates — en av London's mest moderna arenor med klassisk fotbollskultur från Highbury i ryggen.", fixtures: [{ opponent: "Tottenham", date: "4 oktober 2026", competition: "Premier League" }, { opponent: "Chelsea", date: "1 november 2026", competition: "Premier League" }, { opponent: "Manchester City", date: "22 november 2026", competition: "Premier League" }] },
  "chelsea": { name: "Chelsea", league: "Premier League", city: "London, England", stadium: "Stamford Bridge", tagline: "Pride of London", description: "Stamford Bridge i hjärtat av London — Chelsea bjuder på Premier League och Champions League i världsklass.", fixtures: [{ opponent: "Arsenal", date: "1 november 2026", competition: "Premier League" }, { opponent: "Liverpool", date: "15 november 2026", competition: "Premier League" }, { opponent: "Manchester United", date: "6 december 2026", competition: "Premier League" }] },
  "liverpool": { name: "Liverpool", league: "Premier League", city: "Liverpool, England", stadium: "Anfield", tagline: "You'll Never Walk Alone", description: "Anfield — där You'll Never Walk Alone ekar från läktarna. En av världens mest känslosamma fotbollsupplevelser.", fixtures: [{ opponent: "Manchester United", date: "18 oktober 2026", competition: "Premier League" }, { opponent: "Chelsea", date: "15 november 2026", competition: "Premier League" }, { opponent: "Real Madrid", date: "26 november 2026", competition: "Champions League" }] },
  "manchester-city": { name: "Manchester City", league: "Premier League", city: "Manchester, England", stadium: "Etihad Stadium", tagline: "Modern fotbolls toppskikt", description: "Manchester City på Etihad — modern fotboll i absolut världsklass under Pep Guardiola och stjärnlaget.", fixtures: [{ opponent: "Manchester United", date: "25 oktober 2026", competition: "Premier League" }, { opponent: "Arsenal", date: "22 november 2026", competition: "Premier League" }, { opponent: "Borussia Dortmund", date: "12 november 2026", competition: "Champions League" }] },
  "manchester-united": { name: "Manchester United", league: "Premier League", city: "Manchester, England", stadium: "Old Trafford", tagline: "Theatre of Dreams", description: "Old Trafford — Theatre of Dreams. En av världens mest legendariska fotbollsarenor och Manchester Uniteds hem.", fixtures: [{ opponent: "Liverpool", date: "18 oktober 2026", competition: "Premier League" }, { opponent: "Manchester City", date: "25 oktober 2026", competition: "Premier League" }, { opponent: "Chelsea", date: "6 december 2026", competition: "Premier League" }] },
  "tottenham-hotspur": { name: "Tottenham Hotspur", league: "Premier League", city: "London, England", stadium: "Tottenham Hotspur Stadium", tagline: "To dare is to do", description: "Tottenhams nya arena i norra London är en av världens mest moderna fotbollsanläggningar. Premier League på toppnivå.", fixtures: [{ opponent: "Arsenal", date: "4 oktober 2026", competition: "Premier League" }, { opponent: "Chelsea", date: "9 november 2026", competition: "Premier League" }, { opponent: "Manchester City", date: "29 november 2026", competition: "Premier League" }] },
  "milan": { name: "Milan", league: "Serie A", city: "Milano, Italien", stadium: "San Siro", tagline: "Sempre Milan", description: "AC Milan på San Siro — sju gånger Champions League-mästare och en av italiensk fotbolls största stoltheter.", fixtures: [{ opponent: "Inter", date: "22 november 2026", competition: "Serie A" }, { opponent: "Juventus", date: "4 oktober 2026", competition: "Serie A" }, { opponent: "Roma", date: "15 november 2026", competition: "Serie A" }] },
  "inter": { name: "Inter", league: "Serie A", city: "Milano, Italien", stadium: "San Siro", tagline: "Pazza Inter Amala", description: "Inter Milan delar San Siro med rivalen Milan. Upplev derbyt della Madonnina — ett av fotbollens hetaste möten.", fixtures: [{ opponent: "Milan", date: "22 november 2026", competition: "Serie A" }, { opponent: "Juventus", date: "1 november 2026", competition: "Serie A" }, { opponent: "Napoli", date: "8 november 2026", competition: "Serie A" }] },
  "juventus": { name: "Juventus", league: "Serie A", city: "Turin, Italien", stadium: "Allianz Stadium", tagline: "Fino alla fine", description: "Juventus på Allianz Stadium i Turin — den gamla damen och Italiens mest framgångsrika klubb.", fixtures: [{ opponent: "Milan", date: "4 oktober 2026", competition: "Serie A" }, { opponent: "Inter", date: "1 november 2026", competition: "Serie A" }, { opponent: "Roma", date: "29 november 2026", competition: "Serie A" }] },
  "roma": { name: "Roma", league: "Serie A", city: "Rom, Italien", stadium: "Stadio Olimpico", tagline: "Forza Roma", description: "AS Roma på Stadio Olimpico — passionerad fotboll i Italiens eviga stad. Romkultur och fotboll i världsklass.", fixtures: [{ opponent: "Milan", date: "15 november 2026", competition: "Serie A" }, { opponent: "Juventus", date: "29 november 2026", competition: "Serie A" }, { opponent: "Lazio", date: "13 december 2026", competition: "Serie A" }] },
};

export default function TeamPage() {
  const { team } = useParams<{ team: string }>();
  const info = team ? TEAMS[team] : undefined;

  if (!info) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display text-4xl mb-4">Laget hittades inte</h1>
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

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[400px] flex items-end">
        <div className="absolute inset-0">
          <img src={fotbollImage} alt={info.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3 font-sans">
            Fotbollsresor — {info.league}
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white mb-3">
            {info.name}
          </h1>
          <p className="font-display italic font-light text-gold-light text-xl md:text-2xl">
            {info.tagline}
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Stad</p>
                <p className="font-medium">{info.city}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Liga</p>
                <p className="font-medium">{info.league}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Arena</p>
                <p className="font-medium">{info.stadium}</p>
              </div>
            </div>
          </div>
          <p className="font-display text-xl md:text-2xl text-foreground italic font-light leading-relaxed text-center">
            "{info.description}"
          </p>
        </div>
      </section>

      {/* Fixtures */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans text-center">Kommande matcher</p>
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">Resor till {info.name}s matcher</h2>
          <div className="space-y-3">
            {info.fixtures.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-display text-lg">{info.name} vs {f.opponent}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{f.competition}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{f.date}</p>
                  <Link to="/contact">
                    <Button size="sm" variant="outline" className="rounded-full mt-2 text-xs">
                      Boka <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Package */}
      <section className="bg-cream py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans text-center">Vad ingår</p>
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">Kompletta paket till {info.stadium}</h2>
          <ul className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              "Matchbiljetter med bra sittplatser",
              "Hotell nära arenan",
              "Flyg från valfri svensk flygplats",
              "Transfer till och från matchen",
              "Stadstur och rekommendationer",
              "Svensk reseledare på plats",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 bg-card p-4 rounded-lg">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4 font-sans">Boka din {info.name}-resa</p>
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
            Redo att uppleva {info.stadium}?
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
