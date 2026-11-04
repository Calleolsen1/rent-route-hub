import { useMemo } from "react";

/**
 * The image for an event card, resolved in order:
 *
 *   1. the stadium photo uploaded for the HOME team (or the F1 race)
 *   2. a cover image the data source happened to provide
 *   3. both clubs' crests on a colour gradient
 *   4. a generated text card — always works, never 404s
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
  venueName: string | null;
  /** Supplier-provided cover, if any. */
  coverUrl: string | null;
  /** match_key -> image_url, from useTeamPhotos(). */
  photos: Record<string, string>;
  /** canonical team name -> crest url, from useTeamCrests(). */
  crests?: Record<string, string>;
  className?: string;
};

/**
 * Every fallback plate uses the same navy palette - club colours are not
 * used anywhere on the site, so all cards share one consistent blue tone.
 */
const NAVY: [string, string] = ["#1E3A5F", "#0F1F33"];

/** F1 has no crest pair — a race is one event, not two sides. */
const isRaceSport = (sport: string | null) => sport === "formula1";

function coloursFor(_name: string | null): [string, string] {
  return NAVY;
}

/** Readable text colour for a given background - always white on navy. */
function inkFor(_hex: string): string {
  return "#FFFFFF";
}

export default function EventImage({
  sport, homeTeam, awayTeam, raceName, venueName,
  coverUrl, photos, crests, className = "",
}: Props) {
  const key = sport === "formula1" ? raceName : homeTeam;
  const photo = (key && photos[`${sport}|${key}`]) || coverUrl || null;
  // photos[] can legitimately miss a team that only has a seating chart.

  // Crests come first, ahead of any uploaded stadium photo.
  //
  // A stadium photo is per home team, so every one of Atlético's 21 home
  // fixtures rendered the identical image and the listing read as one photo
  // repeated down the page. The crest pair changes with the opponent, so each
  // card is distinguishable at a glance — which is the job of a listing.
  // The stadium photo still carries F1 races and any club whose crest is
  // missing.
  const homeCrest = !isRaceSport(sport) && homeTeam ? crests?.[homeTeam] : undefined;
  const awayCrest = !isRaceSport(sport) && awayTeam ? crests?.[awayTeam] : undefined;
  const useCrests = Boolean(homeCrest && awayCrest);

  const [c1, c2] = useMemo(() => coloursFor(key), [key]);
  const ink = useMemo(() => inkFor(c1), [c1]);

  if (photo && !useCrests) {
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

  // Needs both badges: one crest beside a blank would read as a loading
  // failure rather than a design.
  if (useCrests) {
    return (
      <div
        className={`w-full h-full relative overflow-hidden ${className}`}
        style={{ background: `linear-gradient(115deg, ${c1} 0%, ${c2} 100%)` }}
        role="img"
        aria-label={`${homeTeam} mot ${awayTeam}`}
      >
        <div className="absolute inset-0 flex items-center justify-center gap-[8%] px-[8%]">
          <img
            src={homeCrest}
            alt=""
            loading="lazy"
            className="h-[52%] w-auto max-w-[34%] object-contain drop-shadow-lg"
          />
          <span
            className="font-display text-sm opacity-60 select-none"
            style={{ color: ink }}
          >
            vs
          </span>
          <img
            src={awayCrest}
            alt=""
            loading="lazy"
            className="h-[52%] w-auto max-w-[34%] object-contain drop-shadow-lg"
          />
        </div>
      </div>
    );
  }

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
