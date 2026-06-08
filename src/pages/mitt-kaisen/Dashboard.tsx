import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarDays, MapPin, FileText, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function MittKaisenDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["mk-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["mk-bookings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select(`
          id, checkin_date, checkout_date, status, total_price, nights,
          listings ( title, city, country, cover_image )
        `)
        .eq("guest_user_id", user!.id)
        .order("checkin_date", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && !isPast(new Date(b.checkin_date))
  );
  const active = bookings.filter((b) => b.status === "confirmed" && isPast(new Date(b.checkin_date)) && !isPast(new Date(b.checkout_date)));
  const nextTrip = upcoming[0] || active[0];

  const daysUntil = nextTrip
    ? Math.ceil((new Date(nextTrip.checkin_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const firstName = profile?.first_name || user?.email?.split("@")[0] || "Resenär";

  const stats = [
    { label: "Kommande resor", value: upcoming.length, icon: CalendarDays, color: "hsl(201 100% 35%)" },
    { label: "Genomförda resor", value: bookings.filter((b) => b.status === "completed").length, icon: MapPin, color: "hsl(142 71% 45%)" },
    { label: "Aktiva bokningar", value: active.length + upcoming.length, icon: FileText, color: "hsl(217 91% 60%)" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-10">
        <h1
          className="text-4xl font-light mb-1"
          style={{ color: "hsl(222 35% 15%)", fontFamily: "'Cormorant Garamond', serif" }}
        >
          Välkommen, {firstName}
        </h1>
        <p className="text-sm" style={{ color: "hsl(215 15% 52%)" }}>
          {format(new Date(), "EEEE d MMMM yyyy", { locale: sv })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-5 bg-white border" style={{ borderColor: "hsl(215 20% 87%)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-light" style={{ color: "hsl(222 35% 15%)" }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(215 15% 52%)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Next trip */}
      {nextTrip ? (
        <div className="rounded-2xl overflow-hidden mb-8" style={{ backgroundColor: "hsl(222 50% 10%)" }}>
          <div className="relative h-40 overflow-hidden">
            {(nextTrip.listings as any)?.cover_image ? (
              <img
                src={(nextTrip.listings as any).cover_image}
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
            ) : (
              <div className="w-full h-full" style={{ backgroundColor: "hsl(222 40% 18%)" }} />
            )}
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3" style={{ color: "hsl(201 100% 55%)" }} />
                <span className="text-xs font-medium" style={{ color: "hsl(201 100% 55%)" }}>
                  {daysUntil !== null && daysUntil > 0 ? `Om ${daysUntil} dagar` : "Pågår nu"}
                </span>
              </div>
              <h2 className="text-2xl font-light" style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}>
                {(nextTrip.listings as any)?.title || "Din nästa resa"}
              </h2>
              <p className="text-sm" style={{ color: "hsl(215 15% 65%)" }}>
                {(nextTrip.listings as any)?.city}, {(nextTrip.listings as any)?.country}
              </p>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs mb-1" style={{ color: "hsl(215 15% 50%)" }}>Datum</p>
              <p className="text-sm font-light" style={{ color: "hsl(210 30% 92%)" }}>
                {format(new Date(nextTrip.checkin_date), "d MMM", { locale: sv })} –{" "}
                {format(new Date(nextTrip.checkout_date), "d MMM yyyy", { locale: sv })}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "hsl(215 15% 50%)" }}>Nätter</p>
              <p className="text-sm font-light" style={{ color: "hsl(210 30% 92%)" }}>{nextTrip.nights}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "hsl(215 15% 50%)" }}>Totalt</p>
              <p className="text-sm font-light" style={{ color: "hsl(210 30% 92%)" }}>
                {new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(nextTrip.total_price)}
              </p>
            </div>
            <Link
              to="/mitt-kaisen/resor"
              className="px-4 py-2 rounded-lg text-xs font-medium"
              style={{ backgroundColor: "hsl(201 100% 35%)", color: "white" }}
            >
              Se detaljer
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-10 text-center mb-8" style={{ backgroundColor: "hsl(210 20% 97%)", border: "1px dashed hsl(215 20% 87%)" }}>
          <p className="text-lg font-light mb-2" style={{ color: "hsl(222 35% 15%)", fontFamily: "'Cormorant Garamond', serif" }}>
            Inga kommande resor
          </p>
          <p className="text-sm" style={{ color: "hsl(215 15% 52%)" }}>
            Kontakta Kaisen Travel för att boka din nästa upplevelse.
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/mitt-kaisen/resor"
          className="rounded-xl p-5 flex items-center gap-3 bg-white border hover:shadow-sm transition-shadow"
          style={{ borderColor: "hsl(215 20% 87%)" }}
        >
          <MapPin className="h-5 w-5" style={{ color: "hsl(201 100% 35%)" }} />
          <span className="text-sm font-light" style={{ color: "hsl(222 35% 15%)" }}>Alla mina resor</span>
        </Link>
        <Link
          to="/mitt-kaisen/fakturor"
          className="rounded-xl p-5 flex items-center gap-3 bg-white border hover:shadow-sm transition-shadow"
          style={{ borderColor: "hsl(215 20% 87%)" }}
        >
          <FileText className="h-5 w-5" style={{ color: "hsl(201 100% 35%)" }} />
          <span className="text-sm font-light" style={{ color: "hsl(222 35% 15%)" }}>Fakturor & betalningar</span>
        </Link>
      </div>
    </div>
  );
}
