import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicPricesEnabled } from "@/hooks/usePublicPrices";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

export default function UpcomingEventsList({
  sport,
  team,
  race,
  tournament,
  query,
  dateFrom,
  dateTo,
  sort = "soonest",
  limit = 6,
  title = "Aktuella biljetter",
  eyebrow = "Köp biljett",
  compact = false,
}: Props) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultPct, setDefaultPct] = useState<number>(0);
  const { enabled: showPrices } = usePublicPricesEnabled();

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
        .limit(limit);
      if (sport) q = q.eq("sport", sport);
      if (team) q = q.or(`home_team.eq.${team},away_team.eq.${team}`);
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
  }, [sport, team, race, tournament, query, dateFrom, dateTo, sort, limit]);

  if (loading) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Hämtar evenemang...
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Inga evenemang matchade - testa att rensa filtren eller hör av dig så letar vi åt dig.
      </div>
    );
  }

  return (
    <div>
      {eyebrow && (
        <p className={`text-xs tracking-[0.3em] text-primary uppercase font-sans text-center ${compact ? "mb-2" : "mb-3"}`}>
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className={`font-display text-center ${compact ? "text-2xl md:text-3xl mb-5" : "text-3xl md:text-4xl mb-10"}`}>
          {title}
        </h2>
      )}
      <div className={`grid md:grid-cols-2 lg:grid-cols-3 ${compact ? "gap-4" : "gap-6"}`}>
        {events.map((e) => {
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
              {e.cover_image_url && (
                <div className={`${compact ? "aspect-[16/8]" : "aspect-[16/10]"} overflow-hidden relative`}>
                  <img
                    src={e.cover_image_url}
                    alt={headline ?? ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
              )}
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
                    {showPrices ? "Köp" : "Se biljetter"} <ArrowRight className="ml-1 h-3 w-3" />
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
