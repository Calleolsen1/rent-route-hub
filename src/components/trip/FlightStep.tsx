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
}: {
  /** null = not answered yet. */
  on: boolean | null;
  onToggle: (on: boolean) => void;
  from: string | null;
  onFrom: (from: string) => void;
}) {
  // "Annan ort" stays selected while the visitor types their own place: the
  // value is then that place, not one of the four buttons.
  const other =
    from !== null && (from === "Annan ort" || !DEPARTURES.includes(from as (typeof DEPARTURES)[number]));
  const otherText = other && from !== "Annan ort" ? from : "";

  return (
    <div id="flyg" className="scroll-mt-36">
      <StepHeader n={3} eyebrow="Flyg" title="Välj om ni önskar hjälp med flyg">
        Vi har egen IATA-licens och har därmed tillgång till och kan boka de flesta flygbolag.
      </StepHeader>

      <OnOffChoice
        name="Flyg"
        on={on}
        onChange={onToggle}
        off={{ icon: Car, label: "Utan flyg", hint: "Vi tar oss dit själva" }}
        with={{ icon: Plane, label: "Med flyg", hint: "Tur och retur från samtliga svenska flygplatser, Köpenhamn och Oslo" }}
      />

      {on && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Avresa från</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avresa från">
            {DEPARTURES.map((d) => {
              const selected = d === "Annan ort" ? other : from === d;
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

          {/* Free text when the place is not one of the four buttons. */}
          {other && (
            <label className="mt-3 block">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Ange avreseort
              </span>
              <input
                type="text"
                value={otherText}
                onChange={(e) => onFrom(e.target.value)}
                placeholder="Skriv din avreseort"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
