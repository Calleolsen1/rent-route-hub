import type { ReactNode } from "react";
import { ArrowRight, Calendar, Clock, Flag, Gauge, MapPin, RotateCw, Timer, Trophy } from "lucide-react";
import type { RaceFacts } from "@/data/raceFacts";
import { noBreakHyphen } from "@/lib/noBreakHyphen";

/** Fact tile: navy icon square + small label + big condensed value. */
function Fact({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="sb-card flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-4">
      <span className="hidden min-[400px]:flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">{icon}</span>
      <div className="min-w-0">
        <p className="eyebrow !text-[11px] sm:!text-[12px] !tracking-[0.04em] text-muted-foreground uppercase leading-none mb-1">{label}</p>
        <p className="font-display text-[15px] sm:text-lg md:text-xl font-semibold uppercase leading-tight">{noBreakHyphen(value)}</p>
        {sub && <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/** Key facts directly under the race banner (like the official race pages). */
export function RaceFactsGrid({
  facts,
  weekend,
  city,
  venue,
}: {
  facts: RaceFacts;
  weekend: string | null;
  city?: string | null;
  venue?: string | null;
}) {
  const i = "h-5 w-5";
  return (
    <section className="bg-cream py-4 md:py-8 border-b border-border">
      <div className="sb-container grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {weekend && <Fact icon={<Calendar className={i} />} label="Datum" value={weekend} sub="Fredag–söndag" />}
        <Fact icon={<Clock className={i} />} label="Starttid lopp" value={facts.startTime || "TBC"} />
        {city && <Fact icon={<MapPin className={i} />} label="Stad" value={city} />}
        {venue && <Fact icon={<Flag className={i} />} label="Bana" value={venue} />}
        {facts.length && <Fact icon={<Gauge className={i} />} label="Banans längd" value={facts.length} />}
        {facts.laps && <Fact icon={<RotateCw className={i} />} label="Antal varv" value={facts.laps} />}
        {facts.firstRace && <Fact icon={<Trophy className={i} />} label="Första loppet" value={facts.firstRace} />}
        {facts.lapRecord && (
          <Fact icon={<Timer className={i} />} label="Snabbaste varv" value={facts.lapRecord} sub={facts.lapRecordBy || undefined} />
        )}
      </div>
    </section>
  );
}

/** Friday-Sunday programme as day cards. */
export function RaceSchedule({ facts }: { facts: RaceFacts }) {
  if (!facts.schedule.length) return null;
  return (
    <section className="sb-section-alt">
      <div className="sb-container">
        <p className="eyebrow text-primary uppercase mb-1">Helgens program</p>
        <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] mb-5 md:mb-8">Tre dagar med Formel 1</h2>
        <ol className={`grid gap-2 sm:gap-4 sm:grid-cols-2 ${facts.schedule.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {facts.schedule.map((s) => {
            const d = new Date(`${s.date}T12:00:00Z`);
            const weekday = d.toLocaleDateString("sv-SE", { weekday: "long", timeZone: "UTC" });
            const day = d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", timeZone: "UTC" });
            const isRace = /lopp/i.test(s.label);
            return (
              <li
                key={s.date}
                className={`rounded-lg px-4 py-3 sm:p-5 grid grid-cols-[96px_1fr] sm:block items-center gap-3 ${isRace ? "bg-primary text-white" : "sb-card"}`}
              >
                <div>
                  <p className={`eyebrow !text-[12px] sm:!text-[0.95rem] uppercase leading-none ${isRace ? "text-sky-200" : "text-primary"}`}>{weekday}</p>
                  <p className="font-display text-lg sm:text-2xl font-bold italic uppercase leading-tight">{day}</p>
                </div>
                <p className={`sm:mt-3 text-sm sm:text-[15px] ${isRace ? "text-white/90" : "text-foreground/80"}`}>{s.label}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** Text slot that hides when empty; locally (npm run dev) it shows a placeholder so the layout can be reviewed. */
function TextOrPlaceholder({ text, what }: { text: string; what: string }) {
  if (text) {
    return (
      <div className="space-y-4 text-[15px] leading-relaxed text-foreground/80">
        {text.split(/\n\s*\n/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }
  return (
    <div className="rounded-lg border-2 border-dashed border-border p-5 text-sm text-muted-foreground">
      Text om {what} läggs in här. (Platshållaren syns bara i förhandsvisningen.)
    </div>
  );
}

const showSection = (text: string) => Boolean(text) || import.meta.env.DEV;

/** "Om banan" and "Varför se loppet" as photo + text bands, then the best-seats tips box. */
export function RaceTextSections({
  facts,
  raceName,
  trackName,
  trackPhoto,
  cityPhoto,
  onEnquire,
}: {
  facts: RaceFacts;
  raceName: string;
  trackName?: string | null;
  trackPhoto: string;
  cityPhoto: string;
  onEnquire: () => void;
}) {
  return (
    <>
      {showSection(facts.aboutTrack) && (
        <section className="sb-section">
          <div className="sb-container grid md:grid-cols-2 gap-5 md:gap-8 lg:gap-12 items-center">
            <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg bg-navy-deep">
              <img src={trackPhoto} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="eyebrow text-primary uppercase mb-1">Om banan</p>
              <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] mb-4">{noBreakHyphen(trackName || raceName)}</h2>
              <TextOrPlaceholder text={facts.aboutTrack} what="banan" />
            </div>
          </div>
        </section>
      )}

      {showSection(facts.whyVisit) && (
        <section className="sb-section-alt">
          <div className="sb-container grid md:grid-cols-2 gap-5 md:gap-8 lg:gap-12 items-center md:[&>*:first-child]:order-2">
            <div className="aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-lg bg-navy-deep">
              <img src={cityPhoto} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="eyebrow text-primary uppercase mb-1">Varför se loppet</p>
              <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] mb-4">{raceName} på plats</h2>
              <TextOrPlaceholder text={facts.whyVisit} what="varför man ska se loppet" />
            </div>
          </div>
        </section>
      )}

      {showSection(facts.bestSeats) && (
        <section className="sb-section">
          <div className="sb-container">
            <div className="relative overflow-hidden rounded-lg border-l-4 border-primary bg-cream p-5 md:p-10 grid md:grid-cols-[1fr_auto] gap-5 md:gap-6 items-center">
              <div className="max-w-3xl">
                <p className="eyebrow text-primary uppercase mb-1">Bästa platserna</p>
                <h2 className="font-display text-[26px] sm:text-3xl md:text-[40px] mb-4">Våra tips för dig som söker bästa platser</h2>
                <TextOrPlaceholder text={facts.bestSeats} what="bästa platserna" />
              </div>
              <button type="button" onClick={onEnquire} className="sb-btn-primary h-11 px-7 w-full sm:w-auto md:self-end">
                Skicka förfrågan <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
