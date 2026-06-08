import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, ArrowRight } from "lucide-react";
import { formatEventDateTime, formatSek } from "@/lib/formatSek";

type OrderWithItems = {
  id: string;
  status: string;
  total_sek: number;
  created_at: string;
  invoice_number: string | null;
  order_items: Array<{
    id: string;
    qty: number;
    unit_price_sek: number;
    events: {
      sport: string;
      tournament_name: string;
      home_team: string | null;
      away_team: string | null;
      race_name: string | null;
      venue_name: string | null;
      city: string | null;
      starts_at: string;
    };
    ticket_categories: { name: string };
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pågående",
  paid: "Betald",
  fulfilled: "Levererad",
  failed: "Misslyckad",
  refunded: "Återbetald",
  cancelled: "Avbruten",
};

export default function MittKaisenBiljetter() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select(
          "id, status, total_sek, created_at, invoice_number, order_items(id, qty, unit_price_sek, events(sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(name))",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as unknown as OrderWithItems[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1
        className="text-4xl md:text-5xl font-light mb-2"
        style={{ color: "hsl(210 30% 92%)", fontFamily: "'Cormorant Garamond', serif" }}
      >
        Mina biljetter
      </h1>
      <p className="text-sm mb-10" style={{ color: "hsl(210 20% 70%)" }}>
        Här samlas dina match- och racebiljetter.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: "hsl(210 20% 70%)" }}>Laddar...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: "hsl(222 40% 18%)" }}>
          <Ticket className="h-12 w-12 mx-auto mb-4" style={{ color: "hsl(201 100% 55%)" }} />
          <p className="text-lg font-light" style={{ color: "hsl(210 30% 92%)" }}>
            Du har inga biljetter ännu.
          </p>
          <p className="text-sm mt-2 mb-6" style={{ color: "hsl(210 20% 70%)" }}>
            När du köpt en biljett dyker den upp här.
          </p>
          <Link
            to="/services/sportresor"
            className="inline-flex items-center gap-2 text-sm px-5 py-2 rounded-full"
            style={{ backgroundColor: "hsl(201 100% 45%)", color: "white" }}
          >
            Se evenemang <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/order/${o.id}`}
              className="block rounded-xl p-5 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "hsl(222 40% 18%)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: "hsl(210 20% 70%)" }}>
                    Beställning #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "hsl(210 20% 60%)" }}>
                    {new Date(o.created_at).toLocaleDateString("sv-SE")}
                  </p>
                </div>
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full"
                  style={{ backgroundColor: "hsl(201 100% 35%)", color: "white" }}
                >
                  {STATUS_LABELS[o.status] ?? o.status}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                {o.order_items.map((it) => {
                  const headline =
                    it.events.sport === "soccer"
                      ? `${it.events.home_team} vs ${it.events.away_team}`
                      : it.events.race_name;
                  return (
                    <div key={it.id} className="text-sm" style={{ color: "hsl(210 30% 92%)" }}>
                      <p>{headline} — {it.ticket_categories.name} × {it.qty}</p>
                      <p className="text-xs" style={{ color: "hsl(210 20% 60%)" }}>
                        {formatEventDateTime(it.events.starts_at)} · {it.events.venue_name}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="text-right text-lg" style={{ color: "hsl(210 30% 92%)" }}>
                {formatSek(o.total_sek)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
