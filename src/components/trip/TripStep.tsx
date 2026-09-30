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
        className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-base"
        aria-hidden
      >
        {n}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-0.5 font-sans">
          Steg {n} · {eyebrow}
        </p>
        <h2 className="font-display text-2xl md:text-3xl leading-tight">{title}</h2>
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
  on: boolean;
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
            className={`relative text-left rounded-xl p-3.5 sm:p-4 transition-all ${
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
            <p className="font-semibold text-sm leading-snug">{opt.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{opt.hint}</p>
          </button>
        );
      })}
    </div>
  );
}

/** Scroll to a step on the page. */
export function goToStep(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
