import type { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";

// Building blocks for the match page's steps: 1 Biljetter, 2 Hotell, 3 Flyg.

/** Numbered heading for a step. */
export function StepHeader({
  n,
  eyebrow,
  title,
  children,
}: {
  n: number;
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span
        className="mt-0.5 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-display text-xl font-bold italic tabular-nums"
        aria-hidden
      >
        {n}
      </span>
      <div className="min-w-0">
        <p className="eyebrow text-primary uppercase mb-0.5">
          Steg {n} · {eyebrow}
        </p>
        <h2 className="font-display text-[23px] sm:text-[28px] md:text-[34px] leading-[1.05]">{title}</h2>
        {children && <div className="mt-1 text-xs text-muted-foreground">{children}</div>}
      </div>
    </div>
  );
}

export type ChoiceOption = { icon: LucideIcon; label: string; hint: string };

/** Two cards side by side: without / with. */
export function OnOffChoice({
  on,
  onChange,
  off: offOpt,
  with: onOpt,
  name,
}: {
  /** null = not answered yet: neither card is picked. */
  on: boolean | null;
  onChange: (on: boolean) => void;
  off: ChoiceOption;
  with: ChoiceOption;
  name: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3" role="radiogroup" aria-label={name}>
      {[
        { opt: offOpt, value: false },
        { opt: onOpt, value: true },
      ].map(({ opt, value }) => {
        const selected = on === value;
        const Icon = opt.icon;
        return (
          <button
            key={String(value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(value)}
            className={`relative text-left rounded-lg p-3.5 sm:p-4 transition-all ${
              selected
                ? "border-2 border-primary bg-primary/5"
                : "border border-border bg-card hover:border-primary/40"
            }`}
          >
            {selected && (
              <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
            <Icon className={`h-5 w-5 mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`} />
            <p className="font-display uppercase font-semibold text-base leading-snug">{opt.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{opt.hint}</p>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The first of steps 2–3 the visitor hasn't answered yet, or null when both
 * are. Until then the page's buttons lead there instead of sending, so
 * nobody takes the ticket list for the whole booking.
 */
export function nextStep(e: { hotel: boolean | null; flight: boolean | null }): { id: string; n: number; label: string } | null {
  if (e.hotel === null) return { id: "hotell", n: 2, label: "Hotell" };
  if (e.flight === null) return { id: "flyg", n: 3, label: "Flyg" };
  return null;
}

/** Scroll to a step on the page. */
export function goToStep(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
