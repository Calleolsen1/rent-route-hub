import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicPricesEnabled } from "@/hooks/usePublicPrices";
import { useTeamPhotos } from "@/hooks/useTeamPhotos";
import { useTeamCrests } from "@/hooks/useTeamCrests";
import EventImage from "@/components/EventImage";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInquiryDialog } from "@/components/InquiryDialog";
import { formatEventDate } from "@/lib/formatSek";
import { PriceTag } from "@/components/PriceTag";

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

type Props = {
  sport?: "soccer" | "formula1";
  team?: string;
  race?: string;
  /** Filter to events whose tournament_name contains this string (case-insensitive). */
  tournament?: string;
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
  query,
  dateFrom,
  dateTo,
  sort = "soonest",
  limit,
  title = "Aktuella biljetter",
  eyebrow = "Köp biljett",
  compact = false,
  showFilters = false,
}: Props) {
  // A filtered list needs the whole season in hand to build its month chips;
  // an unfiltered teaser keeps the old six-card default.
  const effectiveLimit = limit ?? (showFilters ? 300 : 6);
  const [month, setMonth] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const { open: openInquiry } = useInquiryDialog();
  const [loading, setLoading] = useState(true);
  const [defaultPct, setDefaultPct] = useState<number>(0);
  const { enabled: showPrices } = usePublicPricesEnabled();
  const teamPhotos = useTeamPhotos();
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
      setEvents((data as EventRow[]) ?? []);
      setLoading(false);
    })();
  }, [sport, team, race, tournament, query, dateFrom, dateTo, sort, effectiveLimit]);

  // Months present in the result, in fixture order — only months that
  // actually have games become buttons, so a chip can never yield nothing.
  const months = showFilters
    ? [...new Set(events.map((e) => monthKey(e.starts_at)))]
    : [];
  const visible = month
    ? events.filter((e) => monthKey(e.starts_at) === month)
    : events;

  if (loading) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Hämtar evenemang...
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground text-sm mb-2">
          Inga evenemang matchade - testa att rensa filtren.
        </p>
        <p className="text-foreground font-medium mb-5">
          Hittar du inte det du letar efter? Vi kan säkert fixa det ändå.
        </p>
        <Button
          className="gap-2"
          onClick={() =>
            openInquiry({
              type: "contact",
              presetTopic: "Förfrågan: evenemang som inte listas",
              heading: "Skicka en förfrågan",
              intro: "Berätta vilket evenemang eller vilken resa du letar efter så återkommer vi med ett förslag.",
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
        <p className={`text-[11px] sm:text-xs eyebrow text-primary uppercase font-sans text-center ${compact ? "mb-2" : "mb-3"}`}>
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className={`font-display text-center ${compact ? "text-2xl md:text-3xl mb-5" : "text-3xl md:text-4xl mb-10"}`}>
          {title}
        </h2>
      )}
      {showFilters && months.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMonth(null)}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
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
                className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
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

      <div className={`grid md:grid-cols-2 lg:grid-cols-3 ${compact ? "gap-4" : "gap-6"}`}>
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
          return (
            <Link
              key={e.id}
              to={`/sport/event/${e.id}`}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col"
            >
              {/* Always render an image block. Without a stadium photo the
                  card falls back to a generated plate, so listings look
                  consistent whether or not the team has been photographed. */}
              <div className={`${compact ? "aspect-[16/8]" : "aspect-[16/10]"} overflow-hidden relative`}>
                  <EventImage
                    sport={e.sport}
                    homeTeam={e.home_team}
                    awayTeam={e.away_team}
                    raceName={e.race_name}
                    tournamentName={e.tournament_name}
                    venueName={e.venue_name}
                    coverUrl={e.cover_image_url}
                    photos={teamPhotos}
                    crests={teamCrests}
                    className="group-hover:scale-105 transition-transform duration-700"
                  />
                  {showPrices && displayPrice != null && displayPrice > 0 && (
                    <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-border">
                      <PriceTag
                        currentSek={displayPrice}
                        compareAt={{
                          eventSek: e.compare_at_price_sek,
                          eventPct: e.compare_at_pct,
                          defaultPct,
                        }}
                        variant="card"
                        showFrom={true}
                        className="!text-sm"
                      />
                    </div>
                  )}
              </div>
              <div className={`${compact ? "p-4" : "p-5"} flex flex-col flex-1`}>
                <p className="text-[10px] tracking-[0.25em] uppercase text-primary font-sans mb-2">
                  {e.tournament_name}
                </p>
                <h3 className={`font-display ${compact ? "text-lg mb-2" : "text-xl mb-3"}`}>{headline}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatEventDate(e.starts_at)}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs text-muted-foreground ${compact ? "mb-3" : "mb-4"}`}>
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {e.venue_name}
                    {e.city ? `, ${e.city}` : ""}
                  </span>
                </div>
                <div className={`mt-auto border-t border-border flex items-end justify-between gap-3 ${compact ? "pt-3" : "pt-4"}`}>
                  {showPrices ? (
                    <PriceTag
                      currentSek={displayPrice}
                      compareAt={{
                        eventSek: e.compare_at_price_sek,
                        eventPct: e.compare_at_pct,
                        defaultPct,
                      }}
                      variant="large"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">Pris på förfrågan</span>
                  )}
                  <Button size="sm" className="rounded-full text-xs bg-primary hover:bg-primary/90 shrink-0">
                    {showPrices ? "Köp" : "Se erbjudanden"} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
