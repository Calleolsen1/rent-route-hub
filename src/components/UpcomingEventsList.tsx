import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEventDate } from "@/lib/formatSek";

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
}: Props) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("events")
        .select(
          "id, sport, tournament_name, home_team, away_team, race_name, venue_name, city, country, starts_at, cover_image_url, status",
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
        // Cross-field substring match — Supabase doesn't expose ILIKE-OR easily,
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
        Inga evenemang matchade — testa att rensa filtren eller hör av dig så letar vi åt dig.
      </div>
    );
  }

  return (
    <div>
      {eyebrow && (
        <p className="text-xs tracking-[0.3em] text-primary uppercase mb-3 font-sans text-center">
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className="font-display text-3xl md:text-4xl text-center mb-10">
          {title}
        </h2>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((e) => {
          const headline =
            e.sport === "soccer"
              ? `${e.home_team} vs ${e.away_team}`
              : e.race_name;
          return (
            <Link
              key={e.id}
              to={`/sport/event/${e.id}`}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {e.cover_image_url && (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={e.cover_image_url}
                    alt={headline ?? ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}
              <div className="p-5">
                <p className="text-[10px] tracking-[0.25em] uppercase text-primary font-sans mb-2">
                  {e.tournament_name}
                </p>
                <h3 className="font-display text-xl mb-2">{headline}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatEventDate(e.starts_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {e.venue_name}
                    {e.city ? `, ${e.city}` : ""}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs"
                >
                  Visa biljetter <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
