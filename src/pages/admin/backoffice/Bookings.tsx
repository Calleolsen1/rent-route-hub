import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, ArrowRight } from "lucide-react";
import { formatSek, STATUS_LABEL, type BookingStatus } from "./shared";

type Row = {
  booking_id: string;
  booking_number: string | null;
  title: string;
  destination: string | null;
  status: BookingStatus;
  depart_date: string | null;
  return_date: string | null;
  travellers_count: number;
  company_name: string | null;
  contact_name: string | null;
  sale_total_sek: number;
  cost_total_sek: number;
  margin_sek: number;
};

export default function BackofficeBookings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [customers, setCustomers] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    customer_id: "",
    title: "",
    destination: "",
    depart_date: "",
    return_date: "",
    travellers_count: 0,
  });

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: cust }] = await Promise.all([
      supabase.from("booking_margin_view").select("*").order("depart_date", { ascending: true }),
      supabase.from("customers").select("id, company_name, contact_name").order("contact_name"),
    ]);
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setCustomers(
      (cust ?? []).map((c: any) => ({
        id: c.id,
        label: c.company_name ? `${c.company_name} (${c.contact_name})` : c.contact_name,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchQuery =
        !q ||
        [r.title, r.destination, r.company_name, r.contact_name, r.booking_number]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [rows, query, statusFilter]);

  const create = async () => {
    if (!draft.customer_id || !draft.title.trim()) {
      return toast.error("Välj kund och ange en titel");
    }
    setSaving(true);
    const { error } = await supabase.from("bookings").insert({
      customer_id: draft.customer_id,
      title: draft.title,
      destination: draft.destination || null,
      depart_date: draft.depart_date || null,
      return_date: draft.return_date || null,
      travellers_count: Number(draft.travellers_count) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Bokningen skapad");
    setOpen(false);
    setDraft({
      customer_id: "",
      title: "",
      destination: "",
      depart_date: "",
      return_date: "",
      travellers_count: 0,
    });
    load();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground">Bokningar</h1>
          <p className="text-sm text-muted-foreground">
            Resor med hotell, flyg, biljetter och transfer — samt marginal per resa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök bokning…"
              className="w-56 pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla statusar</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ny bokning
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Inga bokningar ännu.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nr</th>
                <th className="px-4 py-3">Resa</th>
                <th className="px-4 py-3">Kund</th>
                <th className="px-4 py-3">Avresa</th>
                <th className="px-4 py-3">Res.</th>
                <th className="px-4 py-3 text-right">Försäljning</th>
                <th className="px-4 py-3 text-right">Inköp</th>
                <th className="px-4 py-3 text-right">Vinst</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.booking_id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{r.booking_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.destination}</div>
                  </td>
                  <td className="px-4 py-3">{r.company_name || r.contact_name}</td>
                  <td className="px-4 py-3">{r.depart_date ?? "—"}</td>
                  <td className="px-4 py-3">{r.travellers_count}</td>
                  <td className="px-4 py-3 text-right">{formatSek(r.sale_total_sek)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatSek(r.cost_total_sek)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatSek(r.margin_sek)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/admin/backoffice/bokningar/${r.booking_id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny bokning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={draft.customer_id}
              onValueChange={(v) => setDraft({ ...draft, customer_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj kund" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Titel, t.ex. Träningsläger Valencia v.12"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <Input
              placeholder="Destination"
              value={draft.destination}
              onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Avresa</label>
                <Input
                  type="date"
                  value={draft.depart_date}
                  onChange={(e) => setDraft({ ...draft, depart_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hemkomst</label>
                <Input
                  type="date"
                  value={draft.return_date}
                  onChange={(e) => setDraft({ ...draft, return_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Antal resenärer</label>
              <Input
                type="number"
                min={0}
                value={draft.travellers_count}
                onChange={(e) =>
                  setDraft({ ...draft, travellers_count: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={create} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Skapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
