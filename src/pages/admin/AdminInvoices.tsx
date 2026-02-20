import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle2, Clock, TrendingDown, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

type Member = {
  id: string;
  user_id: string;
  group_id: string;
  invoice_amount: number | null;
  invoice_currency: string;
  invoice_sent_at: string | null;
  invoice_paid_amount: number | null;
  invoice_paid_at: string | null;
  invoice_notes: string | null;
  status: string;
  profiles: { first_name: string | null; last_name: string | null; email: string } | null;
  trip_groups: { name: string } | null;
};

const MarkPaidDialog = ({
  open,
  onOpenChange,
  member,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: Member | null;
  onSaved: () => void;
}) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState(member?.invoice_paid_amount?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!member) return;
    setSaving(true);
    const paidAmount = parseFloat(amount) || 0;
    const { error } = await supabase
      .from("trip_members")
      .update({
        invoice_paid_amount: paidAmount,
        invoice_paid_at: paidAmount > 0 ? new Date().toISOString() : null,
      })
      .eq("id", member.id);
    setSaving(false);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Betalning registrerad" });
      onSaved();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrera betalning</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Faktura: <strong>{(member?.invoice_amount ?? 0).toLocaleString("sv-SE")} {member?.invoice_currency}</strong>
          </p>
          <div className="space-y-1">
            <Label>Betalt belopp</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminInvoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [markPaidMember, setMarkPaidMember] = useState<Member | null>(null);

  const { data: groups } = useQuery({
    queryKey: ["admin-invoice-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("trip_groups").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-invoice-members", search, groupFilter, statusFilter],
    queryFn: async () => {
    let q = supabase
        .from("trip_members")
        .select("id, user_id, group_id, invoice_amount, invoice_currency, invoice_sent_at, invoice_paid_amount, invoice_paid_at, invoice_notes, status")
        .order("invoice_sent_at", { ascending: false, nullsFirst: false });

      if (groupFilter !== "all") q = q.eq("group_id", groupFilter);

      const { data: rawData, error } = await q;
      if (error) throw error;

      // Fetch profiles and groups separately to avoid join issues
      const memberIds = (rawData ?? []).map((m) => m.user_id);
      const groupIds = [...new Set((rawData ?? []).map((m) => m.group_id))];

      const [{ data: profilesData }, { data: groupsData }] = await Promise.all([
        memberIds.length > 0
          ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", memberIds)
          : Promise.resolve({ data: [] }),
        groupIds.length > 0
          ? supabase.from("trip_groups").select("id, name").in("id", groupIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = Object.fromEntries((profilesData ?? []).map((p) => [p.id, p]));
      const groupMap = Object.fromEntries((groupsData ?? []).map((g) => [g.id, g]));

      let result: Member[] = (rawData ?? []).map((m) => ({
        ...m,
        profiles: profileMap[m.user_id] ?? null,
        trip_groups: groupMap[m.group_id] ?? null,
      }));

      if (search) {
        const s = search.toLowerCase();
        result = result.filter((m) => {
          const p = m.profiles;
          const name = p ? `${p.first_name ?? ""} ${p.last_name ?? ""} ${p.email}`.toLowerCase() : "";
          return name.includes(s);
        });
      }

      if (statusFilter === "sent") result = result.filter((m) => m.invoice_sent_at);
      if (statusFilter === "unsent") result = result.filter((m) => !m.invoice_sent_at);
      if (statusFilter === "paid") result = result.filter((m) => (m.invoice_paid_amount ?? 0) >= (m.invoice_amount ?? 1));
      if (statusFilter === "unpaid") result = result.filter((m) => m.invoice_sent_at && (m.invoice_paid_amount ?? 0) < (m.invoice_amount ?? 0));

      return result;
    },
  });

  const totalInvoiced = (members ?? []).reduce((acc, m) => acc + (m.invoice_amount ?? 0), 0);
  const totalPaid = (members ?? []).reduce((acc, m) => acc + (m.invoice_paid_amount ?? 0), 0);
  const outstanding = totalInvoiced - totalPaid;

  return (
    <div className="pb-8 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Totalt fakturerat</p>
              <p className="text-xl font-bold">{totalInvoiced.toLocaleString("sv-SE")} SEK</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Totalt betalt</p>
              <p className="text-xl font-bold">{totalPaid.toLocaleString("sv-SE")} SEK</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${outstanding > 0 ? "bg-destructive/10" : "bg-muted"}`}>
              <TrendingDown className={`h-5 w-5 ${outstanding > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Utestående</p>
              <p className={`text-xl font-bold ${outstanding > 0 ? "text-destructive" : "text-foreground"}`}>
                {outstanding.toLocaleString("sv-SE")} SEK
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök resenär..." className="pl-9" />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Alla grupper" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla grupper</SelectItem>
            {groups?.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Alla statusar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            <SelectItem value="sent">Skickad</SelectItem>
            <SelectItem value="unsent">Ej skickad</SelectItem>
            <SelectItem value="paid">Betald</SelectItem>
            <SelectItem value="unpaid">Ej betald</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">Fakturastatus per resenär</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : members && members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Resenär</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Grupp</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Belopp</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Betalt</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Återstår</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Skickat</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const p = m.profiles;
                    const g = m.trip_groups;
                    const amount = m.invoice_amount ?? 0;
                    const paid = m.invoice_paid_amount ?? 0;
                    const remaining = amount - paid;
                    const isPaid = paid >= amount && amount > 0;
                    const isSent = !!m.invoice_sent_at;
                    return (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : "–"}</div>
                          <div className="text-xs text-muted-foreground">{p?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{g?.name ?? "–"}</td>
                        <td className="px-4 py-3 text-right font-medium">{amount > 0 ? `${amount.toLocaleString("sv-SE")} ${m.invoice_currency}` : "–"}</td>
                        <td className="px-4 py-3 text-right">{paid > 0 ? `${paid.toLocaleString("sv-SE")} ${m.invoice_currency}` : "–"}</td>
                        <td className={`px-4 py-3 text-right font-medium ${remaining > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {amount > 0 ? `${remaining.toLocaleString("sv-SE")} ${m.invoice_currency}` : "–"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!isSent ? (
                            <Badge variant="outline" className="text-xs">Ej skickad</Badge>
                          ) : isPaid ? (
                            <Badge className="text-xs bg-secondary text-secondary-foreground">Betald</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-warning text-warning">Väntar</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {m.invoice_sent_at ? format(new Date(m.invoice_sent_at), "d MMM yyyy", { locale: sv }) : "–"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSent && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => setMarkPaidMember(m)}
                            >
                              {isPaid ? "Ändra" : "Markera betald"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Inga fakturor hittades</p>
          )}
        </CardContent>
      </Card>

      <MarkPaidDialog
        open={!!markPaidMember}
        onOpenChange={(v) => !v && setMarkPaidMember(null)}
        member={markPaidMember}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-invoice-members"] })}
      />
    </div>
  );
}
