import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Calendar, MapPin, Trophy } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import fotbollImage from "@/assets/sport-fotboll.jpg";
import { TEAMS, type TeamInfo } from "@/data/sports";
import UpcomingEventsList from "@/components/UpcomingEventsList";

export default function TeamPage() {
  const { team } = useParams<{ team: string }>();
  const info: TeamInfo | undefined = team ? TEAMS[team] : undefined;

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
      <section className="relative h-[42vh] min-h-[320px] flex items-end">
        <div className="absolute inset-0">
          <img src={fotbollImage} alt={info.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
        </div>
        <div className="relative container mx-auto px-4 pb-14">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans">
            Fotbollsresor — {info.league}
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white mb-3">
            {info.name}
          </h1>
          <p className="font-display italic font-light text-white text-xl md:text-2xl">
            {info.tagline}
          </p>
        </div>
      </section>

      {/* Live tickets — visible on entry */}
      <section className="py-10 md:py-14 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <UpcomingEventsList
            team={info.name}
            limit={6}
            eyebrow="Köp biljett direkt"
            title={`Biljetter till ${info.name}`}
          />
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

      {/* Sample fixtures */}
      <section className="py-12 md:py-16 bg-cream">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans text-center">Exempel på matcher vi paketerar</p>
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">Fler matcher att uppleva</h2>
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
                      Förfrågan <ArrowRight className="ml-1 h-3 w-3" />
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
          <p className="text-xs tracking-[0.3em] text-primary uppercase mb-4 font-sans">Boka din {info.name}-resa</p>
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
