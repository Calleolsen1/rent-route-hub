import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEventDate, formatSek } from "@/lib/formatSek";

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
  limit?: number;
  title?: string;
  eyebrow?: string;
};

export default function UpcomingEventsList({
  sport,
  team,
  race,
  limit = 6,
  title = "Aktuella biljetter",
  eyebrow = "Köp biljett",
}: Props) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let q = supabase
        .from("events")
        .select(
          "id, sport, tournament_name, home_team, away_team, race_name, venue_name, city, country, starts_at, cover_image_url, status",
        )
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(limit);
      if (sport) q = q.eq("sport", sport);
      if (team) q = q.or(`home_team.eq.${team},away_team.eq.${team}`);
      if (race) q = q.eq("race_name", race);
      const { data } = await q;
      setEvents((data as EventRow[]) ?? []);
      setLoading(false);
    })();
  }, [sport, team, race, limit]);

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
        Inga kommande biljetter just nu — hör av dig till oss så letar vi åt dig.
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
