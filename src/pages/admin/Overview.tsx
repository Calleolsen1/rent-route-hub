import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  UsersRound,
  UserCheck,
  FileText,
  CalendarClock,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function Overview() {
  const navigate = useNavigate();

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["admin-groups-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_groups")
        .select("*, trip_members(id, status, invoice_sent_at, invoice_amount, invoice_paid_amount)");
      if (error) throw error;
      return data;
    },
  });

  const { data: upcomingTrips, isLoading: tripsLoading } = useQuery({
    queryKey: ["admin-upcoming-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id, title, destination, start_date, status, guest_user_id, profiles:profiles(first_name, last_name)")
        .order("start_date", { ascending: true })
        .gte("start_date", new Date().toISOString().split("T")[0])
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["admin-recent-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_members")
        .select("id, invoice_amount, invoice_currency, invoice_sent_at, invoice_paid_amount, user_id, group_id, profiles:profiles(first_name, last_name, email), trip_groups(name)")
        .not("invoice_sent_at", "is", null)
        .order("invoice_sent_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const allMembers = groups?.flatMap((g) => g.trip_members) ?? [];
  const totalMembers = allMembers.length;
  const confirmedMembers = allMembers.filter((m) => m.status === "confirmed").length;
  const invoicedMembers = allMembers.filter((m) => m.invoice_sent_at).length;
  const totalInvoiced = allMembers.reduce((acc, m) => acc + (m.invoice_amount ?? 0), 0);
  const totalPaid = allMembers.reduce((acc, m) => acc + (m.invoice_paid_amount ?? 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  const kpiCards = [
    {
      label: "Aktiva grupper",
      value: groupsLoading ? null : (groups?.length ?? 0),
      icon: UsersRound,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/trips",
    },
    {
      label: "Bekräftade resenärer",
      value: groupsLoading ? null : `${confirmedMembers} / ${totalMembers}`,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/admin/users",
    },
    {
      label: "Fakturor skickade",
      value: groupsLoading ? null : invoicedMembers,
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/admin/invoices",
    },
    {
      label: "Utestående belopp",
      value: groupsLoading ? null : `${totalOutstanding.toLocaleString("sv-SE")} SEK`,
      icon: TrendingUp,
      color: totalOutstanding > 0 ? "text-destructive" : "text-emerald-600",
      bg: totalOutstanding > 0 ? "bg-destructive/10" : "bg-emerald-50",
      href: "/admin/invoices",
    },
  ];

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
            {tripsLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : upcomingTrips && upcomingTrips.length > 0 ? (
              upcomingTrips.map((trip) => {
                const profile = Array.isArray(trip.profiles) ? trip.profiles[0] : trip.profiles;
                return (
                  <div key={trip.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{trip.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "–"}
                        {trip.destination ? ` · ${trip.destination}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">
                        {trip.start_date ? format(new Date(trip.start_date), "d MMM", { locale: sv }) : "–"}
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
              recentInvoices.map((m) => {
                const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                const group = Array.isArray(m.trip_groups) ? m.trip_groups[0] : m.trip_groups;
                const isPaid = (m.invoice_paid_amount ?? 0) >= (m.invoice_amount ?? 0);
                return (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "–"}
                      </p>
                      <p className="text-xs text-muted-foreground">{group?.name ?? "–"}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {(m.invoice_amount ?? 0).toLocaleString("sv-SE")} {m.invoice_currency}
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

      {/* Groups summary */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-primary" /> Gruppsummering
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/admin/trips")}>
              Hantera grupper <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {groupsLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((g) => {
                const members = g.trip_members ?? [];
                const confirmed = members.filter((m: any) => m.status === "confirmed").length;
                const invoiced = members.filter((m: any) => m.invoice_sent_at).length;
                const paid = members.filter((m: any) => (m.invoice_paid_amount ?? 0) > 0).length;
                return (
                  <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => navigate("/admin/trips")}>
                    <div>
                      <p className="text-sm font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{members.length} resenärer · {confirmed} bekräftade</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{invoiced} fakturerade</span>
                      <span className="text-emerald-600 font-medium">{paid} betalda</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Inga grupper skapade ännu</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
