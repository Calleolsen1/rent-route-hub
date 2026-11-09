import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicPricesEnabled } from "@/hooks/usePublicPrices";
import { useTeamCrests } from "@/hooks/useTeamCrests";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInquiryDialog } from "@/components/InquiryDialog";
import { formatEventDate, eventDateParts } from "@/lib/formatSek";
import { PriceTag } from "@/components/PriceTag";
import { Input } from "@/components/ui/input";

type EventRow = {
  id: string;
  sport: "soccer" | "formula1";
  tournament_name: string;
  home_team: string | null;
  away_team: string | null;
  race_name: string | null;
  venue_name: string | null;
  city: string | null;
  country: string | null;
  starts_at: string;
  cover_image_url: string | null;
  status: string;
  min_price_sek: number | null;
  compare_at_price_sek: number | null;
  compare_at_pct: number | null;
  ticket_categories: Array<{ unit_price_sek: number | null }> | null;
};

/**
 * Samma lopp/match kan komma från flera källor (biljettleverantör + kalender-sync)
 * med olika stavning på bana och datum för olika sessioner. Slå ihop dem så att
 * kunden bara ser ett kort per lopp/match och månad - biljettkortet vinner.
 */
function dedupeEvents(rows: EventRow[]): EventRow[] {
  const norm = (s: string | null) =>
    (s ?? "").toLowerCase().replace(/[^a-z0-9åäö]+/g, "");
  const hasTickets = (e: EventRow) =>
    (e.ticket_categories?.length ?? 0) > 0 || e.min_price_sek != null;
  const byKey = new Map<string, EventRow>();
  for (const e of rows) {
    const month = (e.starts_at ?? "").slice(0, 7);
    const key = e.race_name
      ? `race|${norm(e.race_name)}|${month}`
      : `match|${norm(e.home_team)}|${norm(e.away_team)}|${month}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, e);
      continue;
    }
    if (hasTickets(e) && !hasTickets(prev)) byKey.set(key, e);
  }
  return rows.filter((e) => byKey.get(
    e.race_name
      ? `race|${norm(e.race_name)}|${(e.starts_at ?? "").slice(0, 7)}`
      : `match|${norm(e.home_team)}|${norm(e.away_team)}|${(e.starts_at ?? "").slice(0, 7)}`,
  ) === e);
}


type Props = {
  sport?: "soccer" | "formula1";
  team?: string;
  race?: string;
  /** Filter to events whose tournament_name contains this string (case-insensitive). */
  tournament?: string;
  /** Several tournament-name patterns matched case-insensitively (e.g. a cup
      known under multiple supplier names). Overrides `tournament` when set. */
  tournaments?: string[];
  /** Free-text search across team/race/tournament names. */
  query?: string;
  /** Earliest start date (ISO). */
  dateFrom?: string;
  /** Latest start date (ISO). */
  dateTo?: string;
  /** Default "soonest" (starts_at asc). */
  sort?: "soonest" | "latest";
  limit?: number;
  title?: string;
  eyebrow?: string;
  compact?: boolean;
  /**
   * Show a month filter and every matching fixture rather than a teaser.
   * A club plays ~20 home games a season, so a team page that stops at six
   * hides most of what is on sale.
   */
  showFilters?: boolean;
  /** Meddelar föräldern när listan visar sitt "inga evenemang"-läge (eller inte). */
  onEmptyChange?: (isEmpty: boolean) => void;
  /** Race pages offer an inquiry when their advertised season has no tickets. */
  emptyMessage?: string;
  /** Lopp-sidorna visar bara förfrågningsknappen, ingen förklarande rad. */
  hideEmptyMessage?: boolean;
  inquiryDestination?: string;
};

/** Svenska månadsnamn för filterknapparna. */
const MONTHS_SV = [
  "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
];

const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM


export default function UpcomingEventsList({
  sport,
  team,
  race,
  tournament,
  tournaments,
  query,
  dateFrom,
  dateTo,
  sort = "soonest",
  limit,
  title = "Aktuella biljetter",
  eyebrow = "Köp biljett",
  compact = false,
  showFilters = false,
  onEmptyChange,
  emptyMessage,
  hideEmptyMessage,
  inquiryDestination,
}: Props) {
  // A filtered list needs the whole season in hand to build its month chips;
  // an unfiltered teaser keeps the old six-card default.
  const effectiveLimit = limit ?? (showFilters ? 300 : 6);
  const [month, setMonth] = useState<string | null>(null);
  const [mobileSearch, setMobileSearch] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const { open: openInquiry } = useInquiryDialog();
  const [loading, setLoading] = useState(true);
  const [defaultPct, setDefaultPct] = useState<number>(0);
  const { enabled: showPrices } = usePublicPricesEnabled();
  const teamCrests = useTeamCrests();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: pct } = await (supabase as any).rpc("get_platform_decimal", {
        p_key: "compare_at_default_pct",
        p_default: 0,
      });
      setDefaultPct(Number(pct ?? 0));
      let q = (supabase as any)
        .from("events")
        .select(
          "id, sport, tournament_name, home_team, away_team, race_name, venue_name, city, country, starts_at, cover_image_url, status, min_price_sek, compare_at_price_sek, compare_at_pct, ticket_categories(unit_price_sek)",
        )
        .eq("status", "upcoming")
        .gte("starts_at", dateFrom ?? new Date().toISOString())
        .order("starts_at", { ascending: sort === "soonest" })
        .limit(effectiveLimit);
      if (sport) q = q.eq("sport", sport);
      // Home fixtures only. A team page sells the trip to that club's city —
      // an away game means a different stadium, a different city, and the
      // wrong venue photo (EventImage keys on home_team), so it has no place
      // on the page even though the club is playing in it.
      if (team) q = q.eq("home_team", team);
      if (race) q = q.eq("race_name", race);
      if (tournament) q = q.ilike("tournament_name", `%${tournament}%`);
      if (tournaments?.length) {
        const or = tournaments
          .filter(Boolean)
          .map((t) => `tournament_name.ilike.%${t}%`)
          .join(",");
        if (or) q = q.or(or);
      }
      if (dateTo) q = q.lte("starts_at", dateTo);
      if (query && query.trim()) {
        const term = query.trim().replace(/[,]/g, " ");
        // Cross-field substring match - Supabase doesn't expose ILIKE-OR easily,
        // so search the most common surfaces individually
        q = q.or(
          `home_team.ilike.%${term}%,away_team.ilike.%${term}%,race_name.ilike.%${term}%,tournament_name.ilike.%${term}%,venue_name.ilike.%${term}%,city.ilike.%${term}%`,
        );
      }
      const { data } = await q;
      setEvents(dedupeEvents((data as EventRow[]) ?? []));
      setLoading(false);
    })();
  }, [sport, team, race, tournament, tournaments, query, dateFrom, dateTo, sort, effectiveLimit]);

  // Months present in the result, in fixture order — only months that
  // actually have games become buttons, so a chip can never yield nothing.
  const months = showFilters
    ? [...new Set(events.map((e) => monthKey(e.starts_at)))]
    : [];
  const visible = month
    ? events.filter((e) => monthKey(e.starts_at) === month)
    : events;

  const isEmptyState = !loading && !events.length;
  useEffect(() => {
    onEmptyChange?.(isEmptyState);
  }, [isEmptyState, onEmptyChange]);

  if (loading) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Hämtar evenemang...
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="text-center py-4 md:py-10">
        {!hideEmptyMessage && (
          <p className="text-muted-foreground text-sm mb-2">
            {emptyMessage ?? "Inga evenemang matchade - testa att rensa filtren."}
          </p>
        )}
        {!emptyMessage && <p className="text-foreground font-medium mb-5">
          Hittar du inte det du letar efter? Vi kan säkert fixa det ändå.
        </p>}
        <Button
          className="gap-2 h-10 rounded-lg px-6 font-display uppercase font-semibold text-[15px] tracking-wide"
          onClick={() =>
            openInquiry({
              type: "contact",
              presetTopic: inquiryDestination ? `Förfrågan: ${inquiryDestination}` : "Förfrågan: evenemang som inte listas",
              defaultDestination: inquiryDestination,
              heading: "Skicka en förfrågan",
              intro: inquiryDestination ? `Förfrågan gäller ${inquiryDestination}. Berätta vad du vill ska ingå i resan så återkommer vi med ett förslag.` : "Berätta vilket evenemang eller vilken resa du letar efter så återkommer vi med ett förslag.",
              showTripParts: true,
            })
          }
        >
          Skicka förfrågan <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      {eyebrow && (
        <p className={`eyebrow text-primary uppercase ${compact ? "mb-1" : "mb-2"}`}>
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className={`font-display ${compact ? "text-3xl md:text-[44px] mb-6" : "text-3xl md:text-5xl mb-8"}`}>
          {title}
        </h2>
      )}
      {showFilters && months.length > 1 && (
        <div className="sb-scroll-row items-center mb-4 md:mb-5">
          <button
            type="button"
            onClick={() => setMonth(null)}
            className={`shrink-0 whitespace-nowrap rounded-md border px-3 md:px-3.5 py-1.5 font-display uppercase font-semibold text-sm tracking-wide transition-colors ${
              month === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
          >
            Alla ({events.length})
          </button>
          {months.map((m) => {
            const count = events.filter((e) => monthKey(e.starts_at) === m).length;
            const [y, mm] = m.split("-");
            const label = `${MONTHS_SV[Number(mm) - 1]} ${y}`;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMonth(m === month ? null : m)}
                className={`shrink-0 whitespace-nowrap rounded-md border px-3 md:px-3.5 py-1.5 font-display uppercase font-semibold text-sm tracking-wide transition-colors ${
                  month === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {showFilters && (
        <div className="md:hidden mb-4">
          <Input type="search" aria-label="Sök matcher" placeholder="Sök lag, arena eller tävling" value={mobileSearch} onChange={(event) => setMobileSearch(event.target.value)} className="h-12 bg-card" />
        </div>
      )}

      {/* Fixture rows (sportsbreaks-style): date block | match | crests | price + CTA */}
      <div className={`flex flex-col ${compact ? "gap-2.5 md:gap-3" : "gap-3 md:gap-4"}`}>
        {visible.map((e) => {
          const headline =
            e.sport === "soccer"
              ? `${e.home_team} vs ${e.away_team}`
              : e.race_name;
          // Fall back to cheapest ticket_categories.unit_price_sek when the
          // events.min_price_sek column is null (e.g. the supplier sync hasn't run yet
          // since the price columns were added).
          const categoryMin = (e.ticket_categories ?? [])
            .map((c) => Number(c.unit_price_sek))
            .filter((n) => Number.isFinite(n) && n > 0)
            .reduce((m, n) => (m == null || n < m ? n : m), null as number | null);
          const displayPrice = e.min_price_sek != null && e.min_price_sek > 0
            ? e.min_price_sek
            : categoryMin;
          const d = eventDateParts(e.starts_at);
          const homeCrest = e.sport === "soccer" && e.home_team ? teamCrests[e.home_team] : undefined;
          const awayCrest = e.sport === "soccer" && e.away_team ? teamCrests[e.away_team] : undefined;
          const hiddenByMobileSearch =
            showFilters &&
            mobileSearch.trim() &&
            ![e.home_team, e.away_team, e.race_name, e.venue_name, e.tournament_name]
              .join(" ")
              .toLocaleLowerCase("sv")
              .includes(mobileSearch.trim().toLocaleLowerCase("sv"));
          return (
            <Link
              key={e.id}
              to={`/sport/event/${e.id}`}
              aria-label={`${headline}, ${formatEventDate(e.starts_at)}`}
              className={`group sb-card grid grid-cols-[58px_1fr] md:grid-cols-[110px_1fr_auto_auto] items-center gap-x-3 md:gap-x-6 gap-y-2.5 p-3 md:px-5 md:py-4 hover:border-primary/50 hover:shadow-md transition-all ${hiddenByMobileSearch ? "hidden md:grid" : ""}`}
            >
              {/* Date block */}
              <div className="self-stretch flex flex-col justify-center border-r border-border pr-3 md:pr-6">
                <span className="font-display font-bold text-[22px] md:text-[28px] leading-none text-foreground">
                  <span className="md:hidden">{d.day}<br />{d.month}</span>
                  <span className="hidden md:inline whitespace-nowrap">{d.day} {d.month}</span>
                </span>
                <span className="mt-1 md:mt-1.5 text-[11px] md:text-xs text-muted-foreground leading-tight">
                  <span className="md:hidden">{d.weekday.slice(0, 3)}</span>
                  <span className="hidden md:inline">{d.weekday}</span>
                </span>
                <span className="text-[11px] md:text-xs text-muted-foreground leading-tight">{d.year}</span>
              </div>

              {/* Match */}
              <div className="min-w-0">
                <p className="eyebrow !tracking-[0.04em] !text-[12px] md:!text-[13px] text-primary uppercase leading-none mb-1 md:mb-1.5 truncate">
                  {e.tournament_name}
                </p>
                <h3 className="font-display text-[17px] md:text-[22px] leading-[1.1] text-foreground group-hover:text-primary transition-colors">
                  {headline}
                </h3>
                {(e.venue_name || e.city) && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {e.venue_name}
                      {e.city ? `, ${e.city}` : ""}
                    </span>
                  </p>
                )}
              </div>

              {/* Crests (soccer) */}
              <div className="hidden md:flex items-center gap-2 pl-2">
                {homeCrest && awayCrest ? (
                  <>
                    <img src={homeCrest} alt={e.home_team ?? ""} loading="lazy" className="h-10 w-10 object-contain" />
                    <span className="font-display text-xs font-semibold text-muted-foreground">VS</span>
                    <img src={awayCrest} alt={e.away_team ?? ""} loading="lazy" className="h-10 w-10 object-contain" />
                  </>
                ) : null}
              </div>

              {/* Price + CTA */}
              <div className="col-span-2 md:col-span-1 flex items-center justify-between md:justify-end gap-3 md:gap-4 border-t border-border pt-2.5 md:border-0 md:pt-0">
                {showPrices ? (
                  <PriceTag
                    currentSek={displayPrice}
                    compareAt={{
                      eventSek: e.compare_at_price_sek,
                      eventPct: e.compare_at_pct,
                      defaultPct,
                    }}
                    variant="card"
                    showFrom={true}
                  />
                ) : (
                  <span className="text-[13px] md:text-sm text-muted-foreground whitespace-nowrap">Pris på förfrågan</span>
                )}
                <span className="sb-btn-primary h-8 md:h-10 px-3.5 md:px-6 text-[13px] md:text-[15px] md:min-w-[150px] shrink-0">
                  {showPrices ? "Köp" : "Se erbjudanden"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {showFilters && mobileSearch.trim() && !visible.some((e) => [e.home_team, e.away_team, e.race_name, e.venue_name, e.tournament_name].join(" ").toLocaleLowerCase("sv").includes(mobileSearch.trim().toLocaleLowerCase("sv"))) && <p className="md:hidden text-center py-6 text-muted-foreground" role="status">Inga matcher matchar sökningen.</p>}
    </div>
  );
}
