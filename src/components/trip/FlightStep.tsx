import { Car, Plane } from "lucide-react";
import { OnOffChoice, StepHeader } from "@/components/trip/TripStep";

// Step 3 on the match page: flight or not, and from where. There is no flight
// supplier — the choice goes into the request and KAISEN books by hand, with
// times fitted to the match and the hotel stay.

export const DEPARTURES = ["Stockholm", "Göteborg", "Malmö / Köpenhamn", "Annan ort"] as const;

export default function FlightStep({
  on,
  onToggle,
  from,
  onFrom,
  stayText,
}: {
  /** null = not answered yet. */
  on: boolean | null;
  onToggle: (on: boolean) => void;
  from: string | null;
  onFrom: (from: string) => void;
  /** The hotel dates, when a hotel is chosen — the flights follow them. */
  stayText: string | null;
}) {
  return (
    <div id="flyg" className="scroll-mt-24">
      <StepHeader n={3} eyebrow="Flyg" title="Behöver ni flyg?" />

      <OnOffChoice
        name="Flyg"
        on={on}
        onChange={onToggle}
        off={{ icon: Car, label: "Utan flyg", hint: "Vi tar oss dit själva" }}
        with={{ icon: Plane, label: "Med flyg", hint: "Tur och retur från Sverige" }}
      />

      {on && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Avresa från</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avresa från">
            {DEPARTURES.map((d) => {
              const selected = from === d;
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onFrom(d)}
                  className={`rounded-full border h-9 px-4 text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-background text-foreground/80 hover:border-primary/40"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            {stayText
              ? `Vi föreslår flygtider som passar ert hotell, ${stayText}, och matchen.`
              : "Vi föreslår flygtider som passar matchen."}{" "}
            Pris i vårt svar - inget bokas förrän ni har bekräftat.
          </p>
        </div>
      )}
    </div>
  );
}
