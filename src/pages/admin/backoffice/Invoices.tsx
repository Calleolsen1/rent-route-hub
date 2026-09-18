import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Mail, Search, Plus, Download, Eye } from "lucide-react";
import {
  formatSek,
  INVOICE_STATUS_LABEL,
  downloadCsv,
  type InvoiceStatus,
} from "./shared";

type Invoice = {
  id: string;
  invoice_number: string | null;
  booking_id: string | null;
  customer_id: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  vat_rate: number;
  subtotal_sek: number;
  vat_sek: number;
  total_sek: number;
  paid_sek: number;
  reference: string | null;
  sent_at: string | null;
};

export default function BackofficeInvoices() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState("Banköverföring");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: cust }] = await Promise.all([
      supabase.from("invoices").select("*").order("issue_date", { ascending: false }),
      supabase.from("customers").select("id, company_name, contact_name"),
    ]);
    if (error) toast.error(error.message);
    setRows((data ?? []) as Invoice[]);
    setCustomers(
      Object.fromEntries(
        (cust ?? []).map((c: any) => [c.id, c.company_name || c.contact_name]),
      ),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const highlight = params.get("invoice");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchQuery =
        !q ||
        [r.invoice_number, r.reference, customers[r.customer_id]]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [rows, query, statusFilter, customers]);

  const send = async (inv: Invoice) => {
    setBusy(inv.id);
    const { error } = await supabase.functions.invoke("send-booking-invoice", {
      body: { invoice_id: inv.id },
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Fakturan är skickad");
    load();
  };

  const openPreview = async (inv: Invoice) => {
    setBusy(inv.id);
    const { data, error } = await supabase.functions.invoke("send-booking-invoice", {
      body: { invoice_id: inv.id, preview: true },
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    setPreviewTitle(`Faktura ${inv.invoice_number ?? ""}`);
    setPreviewHtml((data as any)?.html ?? "");
  };

  const registerPayment = async () => {
    if (!payFor) return;
    const amount = Number(payAmount);
    if (!amount) return toast.error("Ange belopp");
    const { error } = await supabase.from("invoice_payments").insert({
      invoice_id: payFor.id,
      amount_sek: amount,
      paid_on: payDate,
      method: payMethod,
    });
    if (error) return toast.error(error.message);
    toast.success("Betalning registrerad");
    setPayFor(null);
    setPayAmount("");
    load();
  };

  const exportCsv = () => {
    downloadCsv("fakturor.csv", [
      ["Fakturanr", "Kund", "Fakturadatum", "Förfaller", "Netto", "Moms", "Totalt", "Betalt", "Status"],
      ...filtered.map((r) => [
        r.invoice_number,
        customers[r.customer_id] ?? "",
        r.issue_date,
        r.due_date,
        r.subtotal_sek,
        r.vat_sek,
        r.total_sek,
        r.paid_sek,
        INVOICE_STATUS_LABEL[r.status],
      ]),
    ]);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground">Fakturor</h1>
          <p className="text-sm text-muted-foreground">
            Fakturanummer, förfallodatum, moms, delbetalningar och betalstatus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök faktura…"
              className="w-56 pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla statusar</SelectItem>
              {Object.entries(INVOICE_STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Exportera
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Inga fakturor ännu — skapa en från en bokning.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fakturanr</th>
                <th className="px-4 py-3">Kund</th>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Förfaller</th>
                <th className="px-4 py-3 text-right">Totalt</th>
                <th className="px-4 py-3 text-right">Betalt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t border-border ${highlight === r.id ? "bg-accent/40" : ""}`}
                >
                  <td className="px-4 py-3">{r.invoice_number}</td>
                  <td className="px-4 py-3">{customers[r.customer_id] ?? "—"}</td>
                  <td className="px-4 py-3">{r.issue_date}</td>
                  <td className="px-4 py-3">{r.due_date}</td>
                  <td className="px-4 py-3 text-right">{formatSek(r.total_sek)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatSek(r.paid_sek)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{INVOICE_STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Förhandsgranska"
                      onClick={() => openPreview(r)}
                      disabled={busy === r.id}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Skicka"
                      onClick={() => send(r)}
                      disabled={busy === r.id}
                    >
                      {busy === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPayFor(r);
                        setPayAmount(String(Math.max(0, Number(r.total_sek) - Number(r.paid_sek))));
                        setParams({});
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!payFor} onOpenChange={(o) => !o && setPayFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrera betalning – {payFor?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Belopp (kr)</label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Betaldatum</label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <Input
              placeholder="Betalsätt"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayFor(null)}>
              Avbryt
            </Button>
            <Button onClick={registerPayment}>Registrera</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewHtml} onOpenChange={(o) => !o && setPreviewHtml(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <iframe
            title="Fakturaförhandsvisning"
            srcDoc={previewHtml ?? ""}
            className="h-[70vh] w-full rounded-md border border-border bg-white"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
