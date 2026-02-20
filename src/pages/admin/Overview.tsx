import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  FileText,
  CalendarClock,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function Overview() {
  const navigate = useNavigate();

  // All trips for KPIs + "Alla resor" summary
  const { data: tripsData, isLoading: tripsKpiLoading } = useQuery({
    queryKey: ["admin-trips-kpi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id, status, payment_status, price_total, price_currency, invoice_sent_at, title, destination, start_date, guest_user_id");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  // Upcoming trips (status upcoming/ongoing, ordered by start_date)
  const { data: upcomingTrips, isLoading: upcomingLoading } = useQuery({
    queryKey: ["admin-upcoming-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id, title, destination, start_date, status, guest_user_id")
        .in("status", ["upcoming", "ongoing"])
        .order("start_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  // Recent invoices from trips table
  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["admin-recent-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id, title, destination, invoice_sent_at, price_total, price_currency, payment_status, guest_user_id")
        .not("invoice_sent_at", "is", null)
        .order("invoice_sent_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  // KPI derivations
  const trips = tripsData ?? [];
  const activeTrips = trips.filter((t) => t.status === "upcoming" || t.status === "ongoing").length;
  const paidTrips = trips.filter((t) => t.payment_status === "paid").length;
  const invoicedTrips = trips.filter((t) => t.invoice_sent_at).length;
  const outstandingAmount = trips
    .filter((t) => t.payment_status !== "paid")
    .reduce((acc, t) => acc + (t.price_total ?? 0), 0);

  const kpiCards = [
    {
      label: "Aktiva resor",
      value: tripsKpiLoading ? null : activeTrips,
      icon: Plane,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/trips",
    },
    {
      label: "Betalda resor",
      value: tripsKpiLoading ? null : `${paidTrips} / ${trips.length}`,
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/admin/trips",
    },
    {
      label: "Fakturor skickade",
      value: tripsKpiLoading ? null : invoicedTrips,
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/admin/invoices",
    },
    {
      label: "Utestående belopp",
      value: tripsKpiLoading ? null : `${outstandingAmount.toLocaleString("sv-SE")} SEK`,
      icon: TrendingUp,
      color: outstandingAmount > 0 ? "text-destructive" : "text-emerald-600",
      bg: outstandingAmount > 0 ? "bg-destructive/10" : "bg-emerald-50",
      href: "/admin/invoices",
    },
  ];

  const statusLabel: Record<string, string> = {
    upcoming: "Kommande",
    ongoing: "Pågående",
    completed: "Avslutad",
    cancelled: "Avbokad",
  };
  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    upcoming: "default",
    ongoing: "secondary",
    completed: "outline",
    cancelled: "destructive",
  };

  return (
    <div className="pb-8 space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card
            key={card.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(card.href)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                  {card.value === null ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">{card.value}</p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-full ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming trips */}
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" /> Kommande resor
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/admin/trips")}>
                Visa alla <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {upcomingLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : upcomingTrips && upcomingTrips.length > 0 ? (
              upcomingTrips.map((trip) => {
                return (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/30 px-1 rounded"
                    onClick={() => navigate("/admin/trips")}
                  >
                    <div>
                      <p className="text-sm font-medium">{trip.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {trip.destination ?? "–"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">
                        {trip.start_date ? format(new Date(trip.start_date), "d MMM", { locale: sv }) : "TBD"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Inga kommande resor</p>
            )}
          </CardContent>
        </Card>

        {/* Recent invoices */}
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Senaste fakturor
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/admin/invoices")}>
                Visa alla <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {invoicesLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : recentInvoices && recentInvoices.length > 0 ? (
              recentInvoices.map((trip) => {
                const isPaid = trip.payment_status === "paid";
                return (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/30 px-1 rounded"
                    onClick={() => navigate("/admin/invoices")}
                  >
                    <div>
                      <p className="text-sm font-medium">{trip.title}</p>
                      <p className="text-xs text-muted-foreground">{trip.destination ?? "–"}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {(trip.price_total ?? 0).toLocaleString("sv-SE")} {trip.price_currency ?? "SEK"}
                      </span>
                      {isPaid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Inga fakturor skickade ännu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All trips summary */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" /> Alla resor
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/admin/trips")}>
              Hantera resor <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {tripsKpiLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : trips.length > 0 ? (
            <div className="space-y-3">
              {trips.slice(0, 8).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() => navigate("/admin/trips")}
                >
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.destination ?? "–"}
                      {t.start_date ? ` · ${format(new Date(t.start_date), "d MMM yyyy", { locale: sv })}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[t.status] ?? "outline"} className="text-xs">
                      {statusLabel[t.status] ?? t.status}
                    </Badge>
                    <Badge
                      variant={t.payment_status === "paid" ? "outline" : "secondary"}
                      className="text-xs"
                    >
                      {t.payment_status === "paid" ? "Betald" : t.payment_status === "partial" ? "Delvis betald" : "Obetald"}
                    </Badge>
                  </div>
                </div>
              ))}
              {trips.length > 8 && (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate("/admin/trips")}>
                  Visa alla {trips.length} resor <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Inga resor skapade ännu</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
