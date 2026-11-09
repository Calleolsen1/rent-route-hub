import type { ReactNode } from "react";
import { noBreakHyphen } from "@/lib/noBreakHyphen";

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  /** Optional background photo under a navy wash. */
  image?: string;
  /** Buttons/links. */
  children?: ReactNode;
};

/** Rounded navy call-to-action box on a white page (sportsbreaks-style). */
export default function CtaBand({ eyebrow, title, text, image, children }: Props) {
  return (
    <section className="sb-container py-8 md:py-14">
      <div className="relative overflow-hidden rounded-lg bg-primary text-white text-center">
        {image && (
          <>
            <img src={image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-primary/85" />
          </>
        )}
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-28 h-[380px] w-[380px] rotate-12 rounded-[64px] bg-white/[0.06]" />
        <div aria-hidden className="pointer-events-none absolute -right-28 -bottom-40 h-[380px] w-[380px] -rotate-12 rounded-[64px] bg-white/[0.04]" />
        <div className="relative px-5 py-8 md:px-16 md:py-14">
          {eyebrow && <p className="eyebrow text-sky-200 uppercase mb-2">{typeof eyebrow === "string" ? noBreakHyphen(eyebrow) : eyebrow}</p>}
          <h2 className="font-display text-[28px] sm:text-3xl md:text-[36px] lg:text-[44px] text-white">{title}</h2>
          {text && <p className="mt-3 md:mt-4 text-sm md:text-base text-white/80 max-w-lg mx-auto leading-relaxed">{text}</p>}
          {children && <div className="mt-6 md:mt-7 flex flex-wrap justify-center gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}
