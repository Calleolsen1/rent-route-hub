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
 * Club colours for the sides we sell most. Everything else derives a stable
 * hue from the name, so an unmapped club still gets a consistent, distinct
 * card rather than a grey box.
 */
const CLUB_COLOURS: Record<string, [string, string]> = {
  "Arsenal": ["#EF0107", "#9C824A"],
  "Chelsea": ["#034694", "#DBA111"],
  "Liverpool": ["#C8102E", "#00B2A9"],
  "Manchester City": ["#6CABDD", "#1C2C5B"],
  "Manchester United": ["#DA291C", "#FBE122"],
  "Tottenham Hotspur": ["#132257", "#FFFFFF"],
  "West Ham United": ["#7A263A", "#1BB1E7"],
  "Aston Villa": ["#95BFE5", "#670E36"],
  "Real Madrid": ["#FEBE10", "#00529F"],
  "FC Barcelona": ["#A50044", "#004D98"],
  "Atlético Madrid": ["#CB3524", "#262E62"],
  "Bayern München": ["#DC052D", "#0066B2"],
  "Borussia Dortmund": ["#FDE100", "#000000"],
  "Juventus": ["#000000", "#FFFFFF"],
  "Inter": ["#0068A8", "#000000"],
  "Milan": ["#FB090B", "#000000"],
  "Roma": ["#8E1F2F", "#F0BC42"],
  "Lazio": ["#87D8F7", "#0B2C5C"],
  "Napoli": ["#12A0D7", "#001B5C"],
};

/** Deterministic hue so the same club always renders the same colour. */
function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function coloursFor(name: string | null): [string, string] {
  if (!name) return ["#1E3A5F", "#0F1F33"];
  const mapped = CLUB_COLOURS[name];
  if (mapped) return mapped;
  const hue = hashHue(name);
  return [`hsl(${hue} 52% 34%)`, `hsl(${(hue + 38) % 360} 46% 18%)`];
}

/** Readable text colour for a given background. */
function inkFor(hex: string): string {
  if (!hex.startsWith("#")) return "#FFFFFF";
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  // Rec. 709 luma — the yellow/white club colours need dark ink.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? "#101828" : "#FFFFFF";
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
