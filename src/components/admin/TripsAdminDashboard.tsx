import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, UserCheck, FileText, MessageSquare,
  CalendarDays, Send, TrendingUp, AlertCircle, ArrowRight, Plane
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import AdminTripsManagement from "@/components/admin/AdminTripsManagement";
import TripGroupsManagement from "@/components/admin/TripGroupsManagement";
import AdminInvoices from "@/pages/admin/AdminInvoices";
import AdminDashboardSupportInbox from "@/components/admin/AdminDashboardSupportInbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const NAV_ITEMS: NavItem[] = [
  { id: "overview",    label: "Översikt",    icon: LayoutDashboard },
  { id: "trips",       label: "Gruppresor",  icon: Plane },
  { id: "travelers",   label: "Resenärer",   icon: UserCheck },
  { id: "invoicing",   label: "Fakturering", icon: FileText },
  { id: "messages",    label: "Meddelanden", icon: MessageSquare },
];

// ─── Overview Section ─────────────────────────────────────────────────────────
function OverviewSection({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { data: trips = [] } = useQuery({
    queryKey: ["trips-overview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("id, title, destination, start_date, end_date, status, payment_status, price_total, price_currency, invoice_sent_at, guest_user_id")
        .order("start_date", { ascending: true, nullsFirst: false });
      return data ?? [];
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["trip-groups-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("trip_groups").select("id, name");
      return data ?? [];
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["trip-members-overview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trip_members")
        .select("id, status, invoice_amount, invoice_paid_amount, invoice_sent_at");
      return data ?? [];
    },
  });

  const now = new Date();
  const upcoming = trips.filter(t => t.start_date && new Date(t.start_date) > now && t.status !== "cancelled");
  const invoicesSent = trips.filter(t => t.invoice_sent_at).length;
  const confirmedMembers = members.filter(m => m.status === "confirmed").length;
  const outstandingAmount = members.reduce((acc, m) => {
    const owed = (m.invoice_amount ?? 0) - (m.invoice_paid_amount ?? 0);
    return acc + (owed > 0 ? owed : 0);
  }, 0);

  const kpis = [
    { label: "Aktiva grupper",       value: groups.length,         icon: Users,        color: "hsl(38 65% 38%)" },
    { label: "Bekräftade resenärer", value: `${confirmedMembers} / ${members.length}`, icon: UserCheck,    color: "hsl(142 71% 45%)" },
    { label: "Fakturor skickade",    value: invoicesSent,          icon: FileText,     color: "hsl(217 91% 60%)" },
    { label: "Utestående belopp",    value: `${outstandingAmount.toLocaleString("sv-SE")} SEK`, icon: TrendingUp, color: outstandingAmount > 0 ? "hsl(0 72% 51%)" : "hsl(142 71% 45%)" },
  ];

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming trips */}
        <Card className="border border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" /> Kommande resor
              </h3>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-muted-foreground" onClick={() => onNavigate("trips")}>
                Visa alla <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Inga kommande resor</p>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.destination} · {t.start_date ? format(parseISO(t.start_date), "d MMM yyyy", { locale: sv }) : "–"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent invoices */}
        <Card className="border border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" /> Senaste fakturor
              </h3>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-muted-foreground" onClick={() => onNavigate("invoicing")}>
                Visa alla <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            {invoicesSent === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Inga fakturor skickade ännu</p>
            ) : (
              <div className="space-y-3">
                {trips.filter(t => t.invoice_sent_at).slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">Skickad {format(parseISO(t.invoice_sent_at!), "d MMM", { locale: sv })}</p>
                    </div>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", t.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                      {t.payment_status === "paid" ? "Betald" : "Väntar"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Groups summary */}
      <Card className="border border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" /> Gruppsummering
            </h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-muted-foreground" onClick={() => onNavigate("trips")}>
              Hantera grupper <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Inga grupper skapade ännu</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {groups.map(g => (
                <div key={g.id} className="p-3 rounded-lg bg-muted/50 text-sm font-medium truncate">
                  {g.name}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Travelers Section ────────────────────────────────────────────────────────
function TravelersSection() {
  const { data: travelers = [], isLoading } = useQuery({
    queryKey: ["all-travelers"],
    queryFn: async () => {
      const { data: members } = await supabase
        .from("trip_members")
        .select("id, user_id, group_id, status, invoice_amount, invoice_paid_amount, invoice_currency, invoice_sent_at")
        .order("created_at", { ascending: false });

      if (!members || members.length === 0) return [];

      const userIds = [...new Set(members.map(m => m.user_id))];
      const groupIds = [...new Set(members.map(m => m.group_id))];

      const [{ data: profiles }, { data: groups }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, email, avatar_url").in("id", userIds),
        supabase.from("trip_groups").select("id, name").in("id", groupIds),
      ]);

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
      const groupMap = Object.fromEntries((groups ?? []).map(g => [g.id, g]));

      return members.map(m => ({
        ...m,
        profile: profileMap[m.user_id] ?? null,
        group: groupMap[m.group_id] ?? null,
      }));
    },
  });

  const statusColor: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    invited: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const statusLabel: Record<string, string> = {
    confirmed: "Bekräftad", invited: "Inbjuden", pending: "Väntar", cancelled: "Avbokad",
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Laddar resenärer...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Resenärer</h2>
        <p className="text-sm text-muted-foreground">{travelers.length} totalt</p>
      </div>

      {travelers.length === 0 ? (
        <Card className="border border-border/60">
          <CardContent className="py-16 text-center text-muted-foreground">
            <UserCheck className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>Inga resenärer registrerade ännu</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Resenär</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Grupp</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Faktura</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Betalt</th>
                </tr>
              </thead>
              <tbody>
                {travelers.map(t => {
                  const paid = t.invoice_paid_amount ?? 0;
                  const total = t.invoice_amount ?? 0;
                  const remaining = total - paid;
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {t.profile ? `${t.profile.first_name ?? ""} ${t.profile.last_name ?? ""}`.trim() || t.profile.email : "–"}
                        </div>
                        <div className="text-xs text-muted-foreground">{t.profile?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.group?.name ?? "–"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColor[t.status] ?? "bg-muted text-muted-foreground")}>
                          {statusLabel[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {total > 0 ? `${total.toLocaleString("sv-SE")} ${t.invoice_currency}` : "–"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {paid > 0 ? (
                          <span className={remaining > 0 ? "text-orange-600" : "text-green-600"}>
                            {paid.toLocaleString("sv-SE")} {t.invoice_currency}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function TripsAdminDashboard() {
  const [active, setActive] = useState<string>("overview");

  const activeNav = NAV_ITEMS.find(n => n.id === active) ?? NAV_ITEMS[0];

  const content = () => {
    switch (active) {
      case "overview":  return <OverviewSection onNavigate={setActive} />;
      case "trips":     return <AdminTripsManagement />;
      case "travelers": return <TravelersSection />;
      case "invoicing": return <AdminInvoices />;
      case "messages":  return <AdminDashboardSupportInbox />;
      default:          return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border/60 flex flex-col py-6 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(38 65% 38%)" }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: "Georgia, serif" }}>K</span>
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: "hsl(38 65% 38%)" }}>KAISEN</div>
              <div className="text-[10px] text-muted-foreground tracking-wider">TRAVEL GROUP</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                active === id
                  ? "font-medium text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              style={active === id ? { backgroundColor: "hsl(38 65% 38%)" } : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <activeNav.icon className="h-6 w-6 text-muted-foreground" />
              {activeNav.label}
            </h1>
          </div>
          {content()}
        </div>
      </main>
    </div>
  );
}
