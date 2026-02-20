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

type TripInvoice = {
  id: string;
  title: string;
  destination: string | null;
  guest_user_id: string;
  invoice_sent_at: string | null;
  invoice_number: string | null;
  price_total: number | null;
  price_currency: string | null;
  payment_status: string | null;
  payment_confirmed_at: string | null;
  payment_due_date: string | null;
  profile: { first_name: string | null; last_name: string | null; email: string } | null;
};

const MarkPaidDialog = ({
  open,
  onOpenChange,
  trip,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trip: TripInvoice | null;
  onSaved: () => void;
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleMark = async (status: "paid" | "unpaid") => {
    if (!trip) return;
    setSaving(true);
    const { error } = await supabase
      .from("trips")
      .update({
        payment_status: status,
        payment_confirmed_at: status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", trip.id);
    setSaving(false);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "paid" ? "Markerad som betald" : "Markerad som obetald" });
      onSaved();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Uppdatera betalningsstatus</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Resa: <strong>{trip?.title}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Belopp: <strong>{(trip?.price_total ?? 0).toLocaleString("sv-SE")} {trip?.price_currency ?? "SEK"}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Nuvarande status: <strong>{trip?.payment_status === "paid" ? "Betald" : "Obetald"}</strong>
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          {trip?.payment_status !== "paid" ? (
            <Button onClick={() => handleMark("paid")} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Markera betald
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleMark("unpaid")} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Markera obetald
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminInvoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTrip, setSelectedTrip] = useState<TripInvoice | null>(null);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["admin-invoice-trips"],
    queryFn: async () => {
      const { data: tripsData, error } = await supabase
        .from("trips")
        .select("id, title, destination, guest_user_id, invoice_sent_at, invoice_number, price_total, price_currency, payment_status, payment_confirmed_at, payment_due_date")
        .order("invoice_sent_at", { ascending: false, nullsFirst: false });
      if (error) throw error;

      const userIds = [...new Set((tripsData ?? []).map((t) => t.guest_user_id))];
      const { data: profilesData } = userIds.length > 0
        ? await supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds)
        : { data: [] };

      const profileMap = Object.fromEntries((profilesData ?? []).map((p) => [p.id, p]));

      return (tripsData ?? []).map((t): TripInvoice => ({
        ...t,
        profile: profileMap[t.guest_user_id] ?? null,
      }));
    },
    refetchInterval: 30_000,
  });

  const filtered = (trips ?? []).filter((t) => {
    const p = t.profile;
    const nameMatch = search
      ? `${p?.first_name ?? ""} ${p?.last_name ?? ""} ${p?.email ?? ""} ${t.title}`.toLowerCase().includes(search.toLowerCase())
      : true;

    const statusMatch =
      statusFilter === "all" ? true :
      statusFilter === "sent" ? !!t.invoice_sent_at :
      statusFilter === "unsent" ? !t.invoice_sent_at :
      statusFilter === "paid" ? t.payment_status === "paid" :
      statusFilter === "unpaid" ? t.payment_status !== "paid" : true;

    return nameMatch && statusMatch;
  });

  const totalInvoiced = filtered.filter(t => t.invoice_sent_at).reduce((acc, t) => acc + (t.price_total ?? 0), 0);
  const totalPaid = filtered.filter(t => t.payment_status === "paid").reduce((acc, t) => acc + (t.price_total ?? 0), 0);
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
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
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
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök resa eller kund..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Alla statusar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            <SelectItem value="sent">Faktura skickad</SelectItem>
            <SelectItem value="unsent">Ej fakturerad</SelectItem>
            <SelectItem value="paid">Betald</SelectItem>
            <SelectItem value="unpaid">Ej betald</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">Fakturastatus per resa ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kund</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Resa</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fakturanr</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Belopp</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Skickat</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Förfaller</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const p = t.profile;
                    const isPaid = t.payment_status === "paid";
                    const isSent = !!t.invoice_sent_at;
                    return (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : "–"}</div>
                          <div className="text-xs text-muted-foreground">{p?.email ?? "–"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{t.title}</div>
                          {t.destination && <div className="text-xs text-muted-foreground">{t.destination}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{t.invoice_number ?? "–"}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {t.price_total != null ? `${t.price_total.toLocaleString("sv-SE")} ${t.price_currency ?? "SEK"}` : "–"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!isSent ? (
                            <Badge variant="outline" className="text-xs">Ej fakturerad</Badge>
                          ) : isPaid ? (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Betald
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Clock className="h-3 w-3" /> Väntar
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {t.invoice_sent_at ? format(new Date(t.invoice_sent_at), "d MMM yyyy", { locale: sv }) : "–"}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {t.payment_due_date ? format(new Date(t.payment_due_date), "d MMM yyyy", { locale: sv }) : "–"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSent && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => setSelectedTrip(t)}
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
        open={!!selectedTrip}
        onOpenChange={(v) => !v && setSelectedTrip(null)}
        trip={selectedTrip}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-invoice-trips"] })}
      />
    </div>
  );
}
