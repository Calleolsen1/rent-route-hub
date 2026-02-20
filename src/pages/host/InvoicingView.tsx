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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Send,
  CheckCircle2,
  Clock,
  FileText,
  History,
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
  group_id: string;
  status: string;
  invoice_sent_at: string | null;
  invoice_amount: number | null;
  invoice_currency: string;
  invoice_notes: string | null;
  profiles?: Profile | null;
};

type TripGroup = {
  id: string;
  name: string;
  trip_members: TripMember[];
};

const InvoicingView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("SEK");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["organizer-groups-invoice", user?.id],
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
      const { data: profiles } =
        userIds.length > 0
          ? await supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .in("id", userIds)
          : { data: [] };

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

      return groupsData.map((g) => ({
        ...g,
        trip_members: (membersData ?? [])
          .filter((m) => m.group_id === g.id)
          .map((m) => ({
            ...m,
            profiles: profileMap[m.user_id] as Profile | undefined,
          })),
      })) as TripGroup[];
    },
    enabled: !!user?.id,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["organizer-groups-invoice"] });

  // Filtered members based on selected group
  const filteredGroups =
    selectedGroupId === "all"
      ? groups ?? []
      : (groups ?? []).filter((g) => g.id === selectedGroupId);

  const allMembers = filteredGroups.flatMap((g) => g.trip_members);
  const displayedMembers = selectAll ? allMembers : allMembers.filter((m) => selectedMemberIds.includes(m.id));

  const handleSend = async () => {
    if (!filteredGroups.length) return;
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/send-group-invoice`;

      let totalUpdated = 0;
      for (const group of filteredGroups) {
        const memberIds = selectAll
          ? undefined
          : selectedMemberIds.filter((id) => group.trip_members.some((m) => m.id === id));

        if (!selectAll && (!memberIds || memberIds.length === 0)) continue;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            group_id: group.id,
            member_ids: memberIds,
            invoice_amount: amount ? parseFloat(amount) : undefined,
            invoice_currency: currency,
            invoice_notes: notes || undefined,
          }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Okänt fel");
        totalUpdated += result.updated_count ?? 0;
      }

      toast({ title: `Faktura skickad till ${totalUpdated} deltagare` });
      setAmount("");
      setNotes("");
      setSelectedMemberIds([]);
      refresh();
    } catch (e: any) {
      toast({ title: "Fel", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Invoice history – all members with invoice_sent_at, sorted by date desc
  const invoiceHistory = (groups ?? [])
    .flatMap((g) =>
      g.trip_members
        .filter((m) => m.invoice_sent_at)
        .map((m) => ({ ...m, groupName: g.name }))
    )
    .sort(
      (a, b) =>
        new Date(b.invoice_sent_at!).getTime() - new Date(a.invoice_sent_at!).getTime()
    );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-8 lg:px-8 space-y-8">
      {/* Section A: Send invoice */}
      <Card className="border border-border/60">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Skicka ny faktura
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Group selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Välj grupp</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj grupp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla grupper</SelectItem>
                  {(groups ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient selector */}
            <div className="space-y-1.5">
              <Label>Mottagare</Label>
              <Select
                value={selectAll ? "all" : "specific"}
                onValueChange={(v) => {
                  setSelectAll(v === "all");
                  setSelectedMemberIds([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla deltagare</SelectItem>
                  <SelectItem value="specific">Välj specifika</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Specific member selection */}
          {!selectAll && (
            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
              {allMembers.map((m) => {
                const name = m.profiles
                  ? `${m.profiles.first_name ?? ""} ${m.profiles.last_name ?? ""}`.trim()
                  : "Okänd";
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-accent/30"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selectedMemberIds.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                    />
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                      {name.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{m.profiles?.email}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Amount + currency + message */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Belopp</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="t.ex. 5000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valuta</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Meddelande (valfritt)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="t.ex. Vänligen betala senast 15 mars..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || (!selectAll && selectedMemberIds.length === 0)}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Skicka faktura
          </Button>
        </CardContent>
      </Card>

      {/* Section B: Invoice status */}
      <Card className="border border-border/60">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fakturastatus
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Belopp</TableHead>
                <TableHead>Datum skickat</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Inga deltagare hittades.
                  </TableCell>
                </TableRow>
              ) : (
                allMembers.map((m) => {
                  const name = m.profiles
                    ? `${m.profiles.first_name ?? ""} ${m.profiles.last_name ?? ""}`.trim()
                    : "Okänd";
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-sm">{name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.profiles?.email ?? "–"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.invoice_amount
                          ? `${m.invoice_amount} ${m.invoice_currency}`
                          : "–"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.invoice_sent_at
                          ? format(new Date(m.invoice_sent_at), "d MMM yyyy", { locale: sv })
                          : "–"}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.invoice_sent_at ? (
                          <span className="text-xs flex items-center gap-1 justify-end text-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Skickad
                          </span>
                        ) : (
                          <span className="text-xs flex items-center gap-1 justify-end text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Ej skickad
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section C: History */}
      {invoiceHistory.length > 0 && (
        <Card className="border border-border/60">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historik
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Grupp</TableHead>
                  <TableHead>Belopp</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Meddelande</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceHistory.map((m) => {
                  const name = m.profiles
                    ? `${m.profiles.first_name ?? ""} ${m.profiles.last_name ?? ""}`.trim()
                    : "Okänd";
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-sm">{name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(m as any).groupName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.invoice_amount
                          ? `${m.invoice_amount} ${m.invoice_currency}`
                          : "–"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(m.invoice_sent_at!), "d MMM yyyy", { locale: sv })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {m.invoice_notes ?? "–"}
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
};

export default InvoicingView;
