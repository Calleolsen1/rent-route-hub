import { useMemo } from "react";

/**
 * The image for an event card, resolved in order:
 *
 *   1. the stadium photo uploaded for the HOME team (or the F1 race)
 *   2. a cover image the supplier happened to provide
 *   3. a generated card — always works, never 404s
 *
 * Layer 3 is the point: 883 fixtures exist today and the supplier ships a
 * usable photo for roughly 3 in 164, so waiting on photography would leave
 * almost every card blank. Every stadium photo uploaded quietly upgrades that
 * team's fixtures without anything else changing.
 */

type Props = {
  sport: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  raceName: string | null;
  tournamentName: string | null;
  venueName: string | null;
  /** Supplier-provided cover, if any. */
  coverUrl: string | null;
  /** match_key -> image_url, from useTeamPhotos(). */
  photos: Record<string, string>;
  className?: string;
};

/**
 * Every fallback plate uses the same navy palette - club colours are not
 * used anywhere on the site, so all cards share one consistent blue tone.
 */
const NAVY: [string, string] = ["#1E3A5F", "#0F1F33"];

function coloursFor(_name: string | null): [string, string] {
  return NAVY;
}

/** Readable text colour for a given background - always white on navy. */
function inkFor(_hex: string): string {
  return "#FFFFFF";
}

export default function EventImage({
  sport, homeTeam, awayTeam, raceName, tournamentName, venueName,
  coverUrl, photos, className = "",
}: Props) {
  const key = sport === "formula1" ? raceName : homeTeam;
  const photo = (key && photos[`${sport}|${key}`]) || coverUrl || null;

  const [c1, c2] = useMemo(() => coloursFor(key), [key]);
  const ink = useMemo(() => inkFor(c1), [c1]);

  if (photo) {
    return (
      <img
        src={photo}
        alt={raceName ?? `${homeTeam} - ${awayTeam}`}
        loading="lazy"
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  const isRace = sport === "formula1";
  const title = isRace ? raceName : homeTeam;
  const subtitle = isRace ? venueName : awayTeam;

  return (
    <div
      className={`w-full h-full relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
      role="img"
      aria-label={isRace ? (raceName ?? "") : `${homeTeam} mot ${awayTeam}`}
    >
      {/* Faint pitch/track arc so the plate reads as sport, not a colour swatch */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14]"
        viewBox="0 0 400 240"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle cx="200" cy="120" r="54" fill="none" stroke={ink} strokeWidth="1.5" />
        <line x1="200" y1="0" x2="200" y2="240" stroke={ink} strokeWidth="1.5" />
        <rect x="0" y="62" width="58" height="116" fill="none" stroke={ink} strokeWidth="1.5" />
        <rect x="342" y="62" width="58" height="116" fill="none" stroke={ink} strokeWidth="1.5" />
      </svg>

      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        {tournamentName && (
          <p
            className="text-[9px] tracking-[0.28em] uppercase mb-2 opacity-80"
            style={{ color: ink }}
          >
            {tournamentName}
          </p>
        )}
        <p
          className="font-display text-lg md:text-xl leading-tight"
          style={{ color: ink }}
        >
          {title}
        </p>
        {subtitle && (
          <>
            {!isRace && (
              <span
                className="text-[10px] uppercase tracking-[0.2em] my-1 opacity-70"
                style={{ color: ink }}
              >
                mot
              </span>
            )}
            <p
              className={`font-display leading-tight ${isRace ? "text-xs opacity-75 mt-1" : "text-lg md:text-xl"}`}
              style={{ color: ink }}
            >
              {subtitle}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
