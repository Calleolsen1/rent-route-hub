import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, CheckCircle2, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const HostDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["organizer-dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: groupsData, error } = await supabase
        .from("trip_groups")
        .select("*")
        .eq("organizer_user_id", user.id);

      if (error) throw error;
      if (!groupsData || groupsData.length === 0) return [];

      const groupIds = groupsData.map((g) => g.id);
      const { data: membersData } = await supabase
        .from("trip_members")
        .select("*")
        .in("group_id", groupIds);

      // Get trip dates
      const tripIds = (membersData ?? []).map((m) => m.trip_id).filter(Boolean) as string[];
      const { data: trips } = tripIds.length > 0
        ? await supabase.from("trips").select("id, start_date, destination").in("id", tripIds)
        : { data: [] };

      const tripMap = Object.fromEntries((trips ?? []).map((t) => [t.id, t]));

      return groupsData.map((g) => ({
        ...g,
        trip_members: (membersData ?? [])
          .filter((m) => m.group_id === g.id)
          .map((m) => ({ ...m, trip: m.trip_id ? tripMap[m.trip_id] : null })),
      }));
    },
    enabled: !!user?.id,
  });

  // Aggregate stats across all groups
  const totalMembers = groups?.reduce((acc, g) => acc + g.trip_members.length, 0) ?? 0;
  const confirmedMembers = groups?.reduce(
    (acc, g) => acc + g.trip_members.filter((m: any) => m.status === "confirmed").length,
    0
  ) ?? 0;
  const invoicedMembers = groups?.reduce(
    (acc, g) => acc + g.trip_members.filter((m: any) => m.invoice_sent_at).length,
    0
  ) ?? 0;

  // Find nearest departure date
  const allDates = groups?.flatMap((g) =>
    g.trip_members
      .map((m: any) => m.trip?.start_date)
      .filter(Boolean)
  ) ?? [];
  const nextDeparture = allDates.sort()[0];

  const firstName = user?.email?.split("@")[0] ?? "Arrangör";
  const primaryGroup = groups?.[0];

  return (
    <div className="container mx-auto px-4 pb-8 lg:px-8 space-y-8">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-6">
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Välkommen, {firstName}! 👋
        </h2>
        {primaryGroup ? (
          <p className="text-muted-foreground">
            Du hanterar{" "}
            <span className="font-medium text-foreground">{primaryGroup.name}</span>
            {primaryGroup.description && ` · ${primaryGroup.description}`}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Du har inga gruppresor att hantera ännu.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Resenärer</span>
                </div>
                <p className="text-3xl font-bold">{totalMembers}</p>
              </CardContent>
            </Card>

            <Card className="border border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Bekräftade</span>
                </div>
                <p className="text-3xl font-bold">{confirmedMembers}</p>
              </CardContent>
            </Card>

            <Card className="border border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Fakturerade</span>
                </div>
                <p className="text-3xl font-bold">{invoicedMembers}</p>
              </CardContent>
            </Card>

            <Card className="border border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Nästa avresa</span>
                </div>
                <p className="text-xl font-bold">
                  {nextDeparture
                    ? format(new Date(nextDeparture), "d MMM", { locale: sv })
                    : "–"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/host/group")}
              className="flex items-center justify-between p-5 rounded-xl border border-border/60 bg-card hover:bg-accent/30 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Min grupp</p>
                  <p className="text-sm text-muted-foreground">
                    Se resenärer och hotellfördelning
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate("/host/invoicing")}
              className="flex items-center justify-between p-5 rounded-xl border border-border/60 bg-card hover:bg-accent/30 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Fakturering</p>
                  <p className="text-sm text-muted-foreground">
                    Skicka och följ upp fakturor
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HostDashboard;
