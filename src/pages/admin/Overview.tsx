import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag,
  Inbox,
  FileText,
  Mail,
  RefreshCcw,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { formatSek } from "@/lib/formatSek";

type Stats = {
  ordersToday: number;
  ordersWeek: number;
  revenueWeekSek: number;
  refundsWeekSek: number;
  inquiriesNew: number;
  quotesSent: number;
  newsletterSignups: number;
  fulfillmentFailed: number;
  pendingDeliveries: number;
};

type RecentOrder = {
  id: string;
  status: string;
  total_sek: number;
  customer_name: string | null;
  customer_email: string;
  created_at: string;
  invoice_number: string | null;
};

const startOfDayIso = (offsetDays = 0): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = startOfDayIso(0);
      const weekAgo = startOfDayIso(7);

      const [
        { count: ordersToday },
        { count: ordersWeek },
        { data: revenueRows },
        { data: refundRows },
        { count: inquiriesNew },
        { count: quotesSent },
        { count: newsletterSignups },
        { count: fulfillmentFailed },
        { count: pendingDeliveries },
        { data: recentRows },
      ] = await Promise.all([
        (supabase as any)
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("paid_at", today)
          .in("status", ["paid", "fulfilled"]),
        (supabase as any)
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("paid_at", weekAgo)
          .in("status", ["paid", "fulfilled"]),
        (supabase as any)
          .from("orders")
          .select("total_paid_sek, total_sek")
          .gte("paid_at", weekAgo)
          .in("status", ["paid", "fulfilled"]),
        (supabase as any)
          .from("refunds")
          .select("amount_sek")
          .gte("created_at", weekAgo),
        (supabase as any)
          .from("inquiries")
          .select("*", { count: "exact", head: true })
          .eq("status", "new"),
        (supabase as any)
          .from("quotes")
          .select("*", { count: "exact", head: true })
          .eq("status", "sent"),
        (supabase as any)
          .from("newsletter_signups")
          .select("*", { count: "exact", head: true }),
        (supabase as any)
          .from("orders")
          .select("*", { count: "exact", head: true })
          .ilike("notes", "supplier confirm failed%"),
        (supabase as any)
          .from("ticket_deliveries")
          .select("*", { count: "exact", head: true })
          .is("file_url", null),
        (supabase as any)
          .from("orders")
          .select("id, status, total_sek, customer_name, customer_email, created_at, invoice_number")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const revenueSum = (revenueRows ?? []).reduce(
        (s: number, r: any) => s + Number(r.total_paid_sek ?? r.total_sek ?? 0),
        0,
      );
      const refundSum = (refundRows ?? []).reduce(
        (s: number, r: any) => s + Number(r.amount_sek ?? 0),
        0,
      );

      setStats({
        ordersToday: ordersToday ?? 0,
        ordersWeek: ordersWeek ?? 0,
        revenueWeekSek: revenueSum,
        refundsWeekSek: refundSum,
        inquiriesNew: inquiriesNew ?? 0,
        quotesSent: quotesSent ?? 0,
        newsletterSignups: newsletterSignups ?? 0,
        fulfillmentFailed: fulfillmentFailed ?? 0,
        pendingDeliveries: pendingDeliveries ?? 0,
      });
      setRecent((recentRows as RecentOrder[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Laddar...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-display mb-2">Översikt</h1>
        <p className="text-muted-foreground text-sm">
          Snapshot från de senaste 7 dagarna. Klicka på ett kort för detaljerad vy.
        </p>
      </div>

      {/* Alert banners */}
      {stats!.fulfillmentFailed > 0 && (
        <Link to="/admin/orders" className="block">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3 hover:bg-amber-100/60 transition-colors">
            <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">
                {stats!.fulfillmentFailed}{" "}
                {stats!.fulfillmentFailed === 1 ? "beställning behöver" : "beställningar behöver"}{" "}
                manuell uppföljning
              </p>
              <p className="text-xs">
                Stripe-betalningen gick igenom men leverantörsbekräftelsen misslyckades. Kontakta leverantören.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-700 ml-auto self-center" />
          </div>
        </Link>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Beställningar idag" value={String(stats!.ordersToday)} icon={ShoppingBag} to="/admin/orders" />
        <Kpi label="Beställningar 7d" value={String(stats!.ordersWeek)} icon={ShoppingBag} to="/admin/orders" />
        <Kpi label="Omsättning 7d" value={formatSek(stats!.revenueWeekSek)} icon={ShoppingBag} to="/admin/orders" />
        <Kpi
          label="Återbetalat 7d"
          value={formatSek(stats!.refundsWeekSek)}
          icon={RefreshCcw}
          to="/admin/orders"
          dim={stats!.refundsWeekSek === 0}
        />
        <Kpi
          label="Nya förfrågningar"
          value={String(stats!.inquiriesNew)}
          icon={Inbox}
          to="/admin/inquiries"
          alert={stats!.inquiriesNew > 0}
        />
        <Kpi label="Skickade offerter" value={String(stats!.quotesSent)} icon={FileText} to="/admin/inquiries" />
        <Kpi
          label="Nyhetsbrev-anmälda"
          value={String(stats!.newsletterSignups)}
          icon={Mail}
          to="/admin/diagnostics"
        />
        <Kpi
          label="Olevererade biljetter"
          value={String(stats!.pendingDeliveries)}
          icon={AlertTriangle}
          to="/admin/tickets"
          alert={stats!.pendingDeliveries > 0}
        />
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Senaste beställningar</h2>
          <Link to="/admin/orders" className="text-xs underline text-muted-foreground hover:text-foreground">
            Se alla
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-6 text-center">
            Inga beställningar än.
          </p>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {recent.map((o) => (
              <Link
                key={o.id}
                to="/admin/orders"
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">
                    {o.invoice_number ?? `#${o.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="text-sm font-medium truncate">{o.customer_name ?? o.customer_email}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm">{formatSek(Number(o.total_sek))}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("sv-SE")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  to,
  alert,
  dim,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  alert?: boolean;
  dim?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow ${
        alert ? "border-primary/40" : "border-border"
      } ${dim ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-3.5 w-3.5 ${alert ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className="font-display text-2xl">{value}</p>
    </Link>
  );
}
