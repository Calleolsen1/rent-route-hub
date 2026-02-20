import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Hotel,
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
  trip?: {
    id: string;
    title: string;
    destination: string | null;
    start_date: string | null;
    hotel_name: string | null;
    hotel_checkin: string | null;
    hotel_checkout: string | null;
    hotel_confirmation: string | null;
  } | null;
};

type TripGroup = {
  id: string;
  name: string;
  description: string | null;
  organizer_user_id: string | null;
  trip_members: TripMember[];
};

const statusColors: Record<string, string> = {
  invited: "bg-primary/10 text-primary",
  confirmed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
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
    selectedMemberIds.length > 0 ? selectedMemberIds.length : group.trip_members.length;

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

      toast({ title: `Faktura skickad till ${result.updated_count} deltagare` });
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
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
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
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Skicka faktura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GroupView = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [invoiceGroup, setInvoiceGroup] = useState<TripGroup | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["organizer-groups", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: groupsData, error } = await supabase
        .from("trip_groups")
        .select("*")
        .eq("organizer_user_id", user.id);

      if (error) throw error;
      if (!groupsData || groupsData.length === 0) return [] as TripGroup[];

      const groupIds = groupsData.map((g) => g.id);
      const { data: membersData } = await supabase
        .from("trip_members")
        .select("*")
        .in("group_id", groupIds);

      const userIds = [...new Set((membersData ?? []).map((m) => m.user_id))];
      const tripIds = (membersData ?? []).map((m) => m.trip_id).filter(Boolean) as string[];

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
              .select("id, title, destination, start_date, hotel_name, hotel_checkin, hotel_checkout, hotel_confirmation")
              .in("id", tripIds)
          : { data: [] },
      ]);

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
      const tripMap = Object.fromEntries((trips ?? []).map((t) => [t.id, t]));

      return groupsData.map((g) => ({
        ...g,
        trip_members: (membersData ?? [])
          .filter((m) => m.group_id === g.id)
          .map((m) => ({
            ...m,
            profiles: profileMap[m.user_id] as Profile | undefined,
            trip: m.trip_id ? tripMap[m.trip_id] : null,
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

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["organizer-groups"] });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="container mx-auto px-4 pb-8 lg:px-8">
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Du har inga gruppresor att hantera just nu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-8 lg:px-8 space-y-8">
      {groups.map((group) => {
        const invoicedCount = group.trip_members.filter((m) => m.invoice_sent_at).length;
        const total = group.trip_members.length;
        const groupSelectedIds = selectedIds.filter((id) =>
          group.trip_members.some((m) => m.id === id)
        );

        // Members with hotel data for room distribution
        const membersWithHotel = group.trip_members.filter((m) => m.trip?.hotel_name);

        return (
          <div key={group.id} className="space-y-4">
            {/* Group header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold">{group.name}</h2>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{group.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {total} deltagare
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {invoicedCount} fakturerade
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {groupSelectedIds.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setInvoiceGroup(group)}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Faktura ({groupSelectedIds.length} valda)
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

            {/* Members table */}
            <Card className="border border-border/60">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Resenärer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Namn</TableHead>
                      <TableHead>E-post</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Destination / Avresa</TableHead>
                      <TableHead className="text-right">Faktura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.trip_members.map((m) => {
                      const name = m.profiles
                        ? `${m.profiles.first_name ?? ""} ${m.profiles.last_name ?? ""}`.trim()
                        : "Okänd";
                      const isOrganizer = group.organizer_user_id === m.user_id;
                      return (
                        <TableRow key={m.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={selectedIds.includes(m.id)}
                              onChange={() => toggleMember(m.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                                {name.charAt(0) || "?"}
                              </div>
                              <span className="font-medium text-sm">{name}</span>
                              {isOrganizer && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  Arrangör
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.profiles?.email ?? "–"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                statusColors[m.status] ?? "bg-muted text-muted-foreground"
                              }`}
                            >
                              {statusLabels[m.status] ?? m.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-2 flex-wrap">
                              {m.trip?.destination && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {m.trip.destination}
                                </span>
                              )}
                              {m.trip?.start_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(m.trip.start_date), "d MMM yyyy", { locale: sv })}
                                </span>
                              )}
                              {!m.trip?.destination && !m.trip?.start_date && "–"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {m.invoice_sent_at ? (
                              <div className="text-right">
                                <span className="text-xs flex items-center gap-1 justify-end text-foreground">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Skickad
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(m.invoice_sent_at), "d MMM yyyy", { locale: sv })}
                                  {m.invoice_amount && ` · ${m.invoice_amount} ${m.invoice_currency}`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs flex items-center gap-1 justify-end text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                Ej fakturerad
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Hotel room distribution */}
            {membersWithHotel.length > 0 && (
              <Card className="border border-border/60">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    Hotellrumfördelning
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deltagare</TableHead>
                        <TableHead>Hotell</TableHead>
                        <TableHead>Incheckning</TableHead>
                        <TableHead>Utcheckning</TableHead>
                        <TableHead>Bekräftelse</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {membersWithHotel.map((m) => {
                        const name = m.profiles
                          ? `${m.profiles.first_name ?? ""} ${m.profiles.last_name ?? ""}`.trim()
                          : "Okänd";
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium text-sm">{name}</TableCell>
                            <TableCell className="text-sm">{m.trip?.hotel_name ?? "–"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {m.trip?.hotel_checkin
                                ? format(new Date(m.trip.hotel_checkin), "d MMM yyyy", { locale: sv })
                                : "–"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {m.trip?.hotel_checkout
                                ? format(new Date(m.trip.hotel_checkout), "d MMM yyyy", { locale: sv })
                                : "–"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground font-mono">
                              {m.trip?.hotel_confirmation ?? "–"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}

      {invoiceGroup && (
        <InvoiceDialog
          open={true}
          onOpenChange={(v) => !v && setInvoiceGroup(null)}
          group={invoiceGroup}
          selectedMemberIds={selectedIds.filter((id) =>
            invoiceGroup.trip_members.some((m) => m.id === id)
          )}
          onSent={() => {
            setSelectedIds([]);
            refresh();
          }}
        />
      )}
    </div>
  );
};

export default GroupView;
