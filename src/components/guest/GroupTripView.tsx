import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Users,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

type TripMember = {
  id: string;
  user_id: string;
  status: string;
  invoice_sent_at: string | null;
  invoice_amount: number | null;
  invoice_currency: string;
  profiles?: Profile | null;
  trips?: { title: string; destination: string | null; start_date: string | null } | null;
};

type TripGroup = {
  id: string;
  name: string;
  description: string | null;
  organizer_user_id: string | null;
  trip_members: TripMember[];
};

const statusColors: Record<string, string> = {
  invited: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  invited: "Inbjuden",
  confirmed: "Bekräftad",
  cancelled: "Avbokad",
};

const InvoiceDialog = ({
  open,
  onOpenChange,
  group,
  selectedMemberIds,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: TripGroup;
  selectedMemberIds: string[];
  onSent: () => void;
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("SEK");
  const [notes, setNotes] = useState("");

  const targetCount =
    selectedMemberIds.length > 0
      ? selectedMemberIds.length
      : group.trip_members.length;

  const handleSend = async () => {
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/send-group-invoice`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_id: group.id,
          member_ids: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
          invoice_amount: amount ? parseFloat(amount) : undefined,
          invoice_currency: currency,
          invoice_notes: notes || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Okänt fel");

      toast({
        title: `Faktura skickad till ${result.updated_count} deltagare`,
      });
      onSent();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Fel", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Skicka faktura</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Faktura skickas till <strong>{targetCount} deltagare</strong> i{" "}
            <strong>{group.name}</strong>.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Belopp</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="t.ex. 5000"
              />
            </div>
            <div className="space-y-1">
              <Label>Valuta</Label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Meddelande</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="t.ex. Vänligen betala senast 15 mars..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Skicka faktura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GroupTripView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [invoiceGroup, setInvoiceGroup] = useState<TripGroup | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["organizer-groups", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get groups where user is organizer
      const { data: groupsData, error } = await supabase
        .from("trip_groups")
        .select("*")
        .eq("organizer_user_id", user.id);

      if (error) throw error;
      if (!groupsData || groupsData.length === 0) return [] as TripGroup[];

      const groupIds = groupsData.map((g) => g.id);

      // Get members
      const { data: membersData } = await supabase
        .from("trip_members")
        .select("*")
        .in("group_id", groupIds);

      // Get profiles & trips
      const userIds = [...new Set((membersData ?? []).map((m) => m.user_id))];
      const tripIds = (membersData ?? [])
        .map((m) => m.trip_id)
        .filter(Boolean) as string[];

      const [{ data: profiles }, { data: trips }] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .in("id", userIds)
          : { data: [] },
        tripIds.length > 0
          ? supabase
              .from("trips")
              .select("id, title, destination, start_date")
              .in("id", tripIds)
          : { data: [] },
      ]);

      const profileMap = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, p])
      );
      const tripMap = Object.fromEntries((trips ?? []).map((t) => [t.id, t]));

      return groupsData.map((g) => ({
        ...g,
        trip_members: (membersData ?? [])
          .filter((m) => m.group_id === g.id)
          .map((m) => ({
            ...m,
            profiles: profileMap[m.user_id] as Profile | undefined,
            trips: m.trip_id ? tripMap[m.trip_id] : null,
          })),
      })) as TripGroup[];
    },
    enabled: !!user?.id,
  });

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["organizer-groups"] });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Du har inga gruppresor att hantera just nu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const invoicedCount = group.trip_members.filter(
          (m) => m.invoice_sent_at
        ).length;
        const total = group.trip_members.length;

        return (
          <Card key={group.id} className="border border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {total} deltagare
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {invoicedCount} fakturerade
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setInvoiceGroup(group);
                      }}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Faktura ({selectedIds.length} valda)
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setSelectedIds([]);
                      setInvoiceGroup(group);
                    }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Faktura alla
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t divide-y">
                {group.trip_members.map((m) => {
                  const name = m.profiles
                    ? `${m.profiles.first_name ?? ""} ${m.profiles.last_name ?? ""}`.trim()
                    : "Okänd";
                  const isOrganizer =
                    group.organizer_user_id === m.user_id;

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-6 py-4 gap-4 flex-wrap"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={selectedIds.includes(m.id)}
                          onChange={() => toggleMember(m.id)}
                        />
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {name.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{name}</span>
                            {isOrganizer && (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                Du (Arrangör)
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                statusColors[m.status] ??
                                "bg-muted text-muted-foreground"
                              }`}
                            >
                              {statusLabels[m.status] ?? m.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                            {m.profiles?.email && (
                              <span>{m.profiles.email}</span>
                            )}
                            {m.trips?.destination && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {m.trips.destination}
                              </span>
                            )}
                            {m.trips?.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(
                                  new Date(m.trips.start_date),
                                  "d MMM yyyy",
                                  { locale: sv }
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        {m.invoice_sent_at ? (
                          <div className="text-right">
                            <span className="text-xs flex items-center gap-1 text-green-600 justify-end">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Faktura skickad
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(m.invoice_sent_at),
                                "d MMM yyyy",
                                { locale: sv }
                              )}
                              {m.invoice_amount &&
                                ` · ${m.invoice_amount} ${m.invoice_currency}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Ej fakturerad
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {invoiceGroup && (
        <InvoiceDialog
          open={true}
          onOpenChange={(v) => !v && setInvoiceGroup(null)}
          group={invoiceGroup}
          selectedMemberIds={selectedIds}
          onSent={() => {
            setSelectedIds([]);
            refresh();
          }}
        />
      )}
    </div>
  );
};

export default GroupTripView;
