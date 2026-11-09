import { ArrowRight } from "lucide-react";
import type { RaceFacts } from "@/data/raceFacts";
import { noBreakHyphen } from "@/lib/noBreakHyphen";

/** One fact in the spec sheet: quiet label over the value, no icon. */
function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-4 py-3.5 sm:px-5 sm:py-4">
      <p className="text-xs sm:text-[13px] text-muted-foreground mb-1">{label}</p>
      <p className="font-sans text-base sm:text-lg font-medium text-foreground leading-tight tabular-nums">{noBreakHyphen(value)}</p>
      {sub && <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight mt-0.5">{sub}</p>}
    </div>
  );
}

/** Key facts directly under the race banner, as one calm spec sheet. */
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
  return (
    <section className="py-5 md:py-8">
      <div className="sb-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 [&>*]:bg-card [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1">
          {weekend && <Fact label="Datum" value={weekend} sub="Fredag–söndag" />}
          <Fact label="Starttid lopp" value={facts.startTime || "TBC"} />
          {city && <Fact label="Stad" value={city} />}
          {venue && <Fact label="Bana" value={venue} />}
          {facts.length && <Fact label="Banans längd" value={facts.length} />}
          {facts.laps && <Fact label="Antal varv" value={facts.laps} />}
          {facts.firstRace && <Fact label="Första loppet" value={facts.firstRace} />}
          {facts.lapRecord && <Fact label="Snabbaste varv" value={facts.lapRecord} sub={facts.lapRecordBy || undefined} />}
        </div>
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
