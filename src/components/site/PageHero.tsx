import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { noBreakHyphen } from "@/lib/noBreakHyphen";
import { resizedImage, responsiveSrcSet } from "@/lib/imageUrl";

type Props = {
  image: string;
  imageAlt: string;
  /** Small label above the title (e.g. "Fotbollsresor - Premier League"). */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Optional league/cup logo shown in a white tile on the right. */
  logo?: string;
  logoAlt?: string;
  /** Intro text under the title. */
  children?: ReactNode;
  /** Defaults to the "Kontakta oss" link every sport page had. */
  action?: ReactNode | null;
};

/**
 * Compact dark banner used at the top of the public pages: our photo under
 * a deep-navy wash, angular shapes, condensed caps title, optional logo.
 */
export default function PageHero({ image, imageAlt, eyebrow, title, logo, logoAlt, children, action }: Props) {
  // Phones: long intros are clamped to four lines with a "Läs mer" toggle so
  // the banner doesn't push the content a full screen down.
  const [expanded, setExpanded] = useState(false);
  const longIntro = typeof children === "string" && children.length > 180;
  const cta =
    action === undefined ? (
      <Link to="/contact" className="sb-btn-light">
        Kontakta oss
      </Link>
    ) : (
      action
    );
  return (
    <section className="relative overflow-hidden bg-navy-deep text-white">
      <img src={resizedImage(image, 1600)} srcSet={responsiveSrcSet(image)} sizes="100vw" alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" decoding="async" fetchPriority="high" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/85 to-navy-deep/55" />
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-40 h-[420px] w-[520px] rotate-[18deg] rounded-[80px] bg-white/[0.05]" />
      <div aria-hidden className="pointer-events-none absolute right-[30%] -bottom-56 h-[360px] w-[420px] -rotate-[24deg] rounded-[80px] bg-white/[0.035]" />

      <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-12 flex items-end justify-between gap-6">
        <div className="min-w-0 max-w-4xl">
          {eyebrow && <p className="eyebrow text-sky-300 uppercase mb-1.5">{eyebrow}</p>}
          <h1 className="font-display text-[32px] sm:text-5xl md:text-6xl text-white">{typeof title === "string" ? noBreakHyphen(title) : title}</h1>
          {children && (
            <div
              className={`mt-2 md:mt-3 text-white/85 text-sm md:text-base leading-relaxed max-w-2xl whitespace-pre-line ${
                longIntro && !expanded ? "line-clamp-4 md:line-clamp-none" : ""
              }`}
            >
              {children}
            </div>
          )}
          {longIntro && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="md:hidden mt-1 text-sm font-semibold text-sky-200 underline underline-offset-2"
            >
              {expanded ? "Visa mindre" : "Läs mer"}
            </button>
          )}
          {cta && <div className="mt-4 md:mt-6">{cta}</div>}
        </div>
        {logo && (
          <div className="hidden sm:flex shrink-0 h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-lg bg-white p-3 shadow-lg">
            <img src={logo} alt={logoAlt ?? ""} className="h-full w-full object-contain" />
          </div>
        )}
      </div>
    </section>
  );
}
