import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plane, Hotel, Car, Calendar, Ticket, MapPin, Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

type Trip = {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  notes: string | null;
  hotel_name: string | null;
  hotel_address: string | null;
  hotel_checkin: string | null;
  hotel_checkout: string | null;
  hotel_confirmation: string | null;
  hotel_notes: string | null;
  hotel_stars: number | null;
  flights: any[];
  transfers: any[];
  schedule: any[];
  tickets: any[];
};

const statusLabel: Record<string, { label: string; color: string }> = {
  upcoming: { label: "Kommande", color: "bg-blue-100 text-blue-700" },
  ongoing: { label: "Pågående", color: "bg-green-100 text-green-700" },
  completed: { label: "Avslutad", color: "bg-muted text-muted-foreground" },
  cancelled: { label: "Inställd", color: "bg-red-100 text-red-700" },
};

const TripCard = ({ trip }: { trip: Trip }) => {
  const [expanded, setExpanded] = useState(false);
  const status = statusLabel[trip.status] || { label: trip.status, color: "bg-muted text-muted-foreground" };

  const formatDate = (d: string | null) =>
    d ? format(new Date(d), "d MMM yyyy", { locale: sv }) : "–";

  const stars = trip.hotel_stars ? "★".repeat(trip.hotel_stars) : null;

  return (
    <Card className="overflow-hidden border border-border/60">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Plane className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-foreground">{trip.title}</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {trip.destination && (
                <>
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{trip.destination}</span>
                  <span className="text-border">·</span>
                </>
              )}
              {trip.start_date && (
                <span>{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</span>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-border/40 px-6 py-5 space-y-6">
          {/* Flyg */}
          {trip.flights && trip.flights.length > 0 && (
            <section>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Plane className="h-4 w-4 text-primary" /> Flyg
              </h4>
              <div className="space-y-3">
                {trip.flights.map((f: any, i: number) => (
                  <div key={i} className="bg-muted/30 rounded-lg px-4 py-3 text-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-medium">{f.from} → {f.to}</span>
                      {f.flight_number && <span className="text-muted-foreground">{f.flight_number}</span>}
                    </div>
                    {(f.departure || f.arrival) && (
                      <div className="text-muted-foreground mt-1 flex gap-4 flex-wrap">
                        {f.departure && <span>Avgång: {f.departure}</span>}
                        {f.arrival && <span>Ankomst: {f.arrival}</span>}
                      </div>
                    )}
                    {f.airline && <div className="text-muted-foreground">{f.airline}</div>}
                    {f.notes && <div className="mt-1 text-muted-foreground italic">{f.notes}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hotell */}
          {trip.hotel_name && (
            <section>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Hotel className="h-4 w-4 text-primary" /> Hotell
              </h4>
              <div className="bg-muted/30 rounded-lg px-4 py-3 text-sm space-y-1">
                <div className="font-medium">
                  {trip.hotel_name} {stars && <span className="text-amber-500 text-xs">{stars}</span>}
                </div>
                {trip.hotel_address && <div className="text-muted-foreground">{trip.hotel_address}</div>}
                <div className="flex gap-4 flex-wrap text-muted-foreground">
                  {trip.hotel_checkin && <span>Incheckning: {formatDate(trip.hotel_checkin)}</span>}
                  {trip.hotel_checkout && <span>Utcheckning: {formatDate(trip.hotel_checkout)}</span>}
                </div>
                {trip.hotel_confirmation && (
                  <div className="text-muted-foreground">Bokningsref: <span className="font-mono">{trip.hotel_confirmation}</span></div>
                )}
                {trip.hotel_notes && <div className="italic text-muted-foreground">{trip.hotel_notes}</div>}
              </div>
            </section>
          )}

          {/* Transfer */}
          {trip.transfers && trip.transfers.length > 0 && (
            <section>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Car className="h-4 w-4 text-primary" /> Transfer
              </h4>
              <div className="space-y-3">
                {trip.transfers.map((t: any, i: number) => (
                  <div key={i} className="bg-muted/30 rounded-lg px-4 py-3 text-sm">
                    <div className="font-medium">{t.from} → {t.to}</div>
                    {t.datetime && <div className="text-muted-foreground">{t.datetime}</div>}
                    {t.vehicle && <div className="text-muted-foreground">{t.vehicle}</div>}
                    {t.notes && <div className="italic text-muted-foreground">{t.notes}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Schema */}
          {trip.schedule && trip.schedule.length > 0 && (
            <section>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Calendar className="h-4 w-4 text-primary" /> Schema
              </h4>
              <div className="space-y-2">
                {trip.schedule.map((s: any, i: number) => (
                  <div key={i} className="flex gap-4 text-sm border-l-2 border-primary/30 pl-4 py-1">
                    <div className="flex-shrink-0 w-28 text-muted-foreground">
                      {s.date ? formatDate(s.date) : ""} {s.time && <span>{s.time}</span>}
                    </div>
                    <div>
                      <div className="font-medium">{s.title}</div>
                      {s.description && <div className="text-muted-foreground">{s.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Biljetter */}
          {trip.tickets && trip.tickets.length > 0 && (
            <section>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Ticket className="h-4 w-4 text-primary" /> Biljetter
              </h4>
              <div className="space-y-2">
                {trip.tickets.map((t: any, i: number) => (
                  <div key={i} className="bg-muted/30 rounded-lg px-4 py-3 text-sm flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      {t.date && <div className="text-muted-foreground">{formatDate(t.date)}</div>}
                      {t.notes && <div className="text-muted-foreground italic">{t.notes}</div>}
                    </div>
                    {t.url && (
                      <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Anteckningar */}
          {trip.notes && (
            <section>
              <h4 className="text-sm font-semibold text-foreground mb-2">Anteckningar</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{trip.notes}</p>
            </section>
          )}
        </div>
      )}
    </Card>
  );
};

const TripsList = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("guest_user_id", user.id)
        .order("start_date", { ascending: true });
      if (!error && data) setTrips(data as any);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Plane className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Inga resor ännu</h3>
        <p className="text-muted-foreground max-w-sm">
          Dina resor visas här när Kaisen Travel Group lägger till dem åt dig.
        </p>
      </div>
    );
  }

  const upcoming = trips.filter(t => t.status === "upcoming" || t.status === "ongoing");
  const past = trips.filter(t => t.status === "completed" || t.status === "cancelled");

  return (
    <div className="space-y-8">
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-4">Kommande & pågående</h2>
          <div className="space-y-4">
            {upcoming.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-muted-foreground mb-4">Tidigare resor</h2>
          <div className="space-y-4">
            {past.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsList;
