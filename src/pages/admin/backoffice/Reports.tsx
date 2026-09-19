import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download } from "lucide-react";
import { formatSek, downloadCsv, STATUS_LABEL, INVOICE_STATUS_LABEL } from "./shared";

export default function BackofficeReports() {
  const [loading, setLoading] = useState(true);
  const [departures, setDepartures] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [margins, setMargins] = useState<any[]>([]);
  const [unpaid, setUnpaid] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await supabase.rpc("complete_past_bookings");
      const [d, f, m, u] = await Promise.all([
        supabase.from("upcoming_departures_view").select("*"),
        supabase.from("sales_forecast_view").select("*"),
        supabase.from("booking_margin_view").select("*"),
        supabase
          .from("invoices")
          .select("*")
          .in("status", ["sent", "partly_paid", "overdue"])
          .order("due_date"),
      ]);
      if (d.error || f.error || m.error || u.error) {
        toast.error(d.error?.message ?? f.error?.message ?? m.error?.message ?? u.error?.message);
      }
      setDepartures(d.data ?? []);
      setForecast(f.data ?? []);
      setMargins(m.data ?? []);
      setUnpaid(u.data ?? []);
      setLoading(false);
    })();
  }, []);

  const exportAccounting = async () => {
    setExporting(true);
    const { data, error } = await supabase.functions.invoke("export-accounting", { body: {} });
    setExporting(false);
    if (error) return toast.error(error.message);
    const rows = (data as any)?.rows ?? [];
    if (rows.length === 0) return toast.info("Inget nytt att exportera");
    downloadCsv("bokforing-spiris.csv", [
      [
        "Fakturanr",
        "Kundnummer",
        "Kund",
        "Fakturadatum",
        "Förfallodatum",
        "Netto",
        "Momssats",
        "Moms",
        "Totalt",
        "Betalt",
        "Betaldatum",
        "Konto",
      ],
      ...rows.map((r: any) => [
        r.invoice_number,
        r.customer_number,
        r.customer_name,
        r.issue_date,
        r.due_date,
        r.subtotal_sek,
        r.vat_rate,
        r.vat_sek,
        r.total_sek,
        r.paid_sek,
        r.paid_at ?? "",
        r.accounting_account ?? "",
      ]),
    ]);
    toast.success(`${rows.length} fakturor exporterade`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const totalMargin = margins.reduce((s, r) => s + Number(r.margin_sek ?? 0), 0);
  const totalSale = margins.reduce((s, r) => s + Number(r.sale_total_sek ?? 0), 0);
  const totalUnpaid = unpaid.reduce(
    (s, r) => s + (Number(r.total_sek ?? 0) - Number(r.paid_sek ?? 0)),
    0,
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground">Rapporter</h1>
          <p className="text-sm text-muted-foreground">
            Avresekalender, såld volym framåt, vinst per resa och obetalda fakturor.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportAccounting} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Bokföringsexport (Spiris)
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Såld volym</p>
          <p className="text-xl font-medium">{formatSek(totalSale)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Vinst</p>
          <p className="text-xl font-medium">{formatSek(totalMargin)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Obetalt</p>
          <p className="text-xl font-medium">{formatSek(totalUnpaid)}</p>
        </div>
      </div>

      <Tabs defaultValue="departures">
        <TabsList>
          <TabsTrigger value="departures">Avresor</TabsTrigger>
          <TabsTrigger value="forecast">Volym framåt</TabsTrigger>
          <TabsTrigger value="margin">Vinst</TabsTrigger>
          <TabsTrigger value="unpaid">Obetalda fakturor</TabsTrigger>
        </TabsList>

        <TabsContent value="departures" className="mt-4 space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv("avresor.csv", [
                ["Bokningsnr", "Resa", "Destination", "Avresa", "Hemkomst", "Resenärer", "Kund", "E-post"],
                ...departures.map((r) => [
                  r.booking_number,
                  r.title,
                  r.destination,
                  r.depart_date,
                  r.return_date,
                  r.travellers_count,
                  r.company_name || r.contact_name,
                  r.email,
                ]),
              ])
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Exportera
          </Button>
          <Table
            head={["Nr", "Resa", "Destination", "Avresa", "Resenärer", "Kund", "Status"]}
            rows={departures.map((r) => [
              r.booking_number,
              r.title,
              r.destination ?? "-",
              r.depart_date ?? "-",
              r.travellers_count,
              r.company_name || r.contact_name,
              STATUS_LABEL[r.status as keyof typeof STATUS_LABEL] ?? r.status,
            ])}
          />
        </TabsContent>

        <TabsContent value="forecast" className="mt-4 space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv("volym-framat.csv", [
                ["Månad", "Destination", "Bokningar", "Försäljning", "Inköp", "Vinst"],
                ...forecast.map((r) => [
                  String(r.month).slice(0, 10),
                  r.destination,
                  r.bookings_count,
                  r.sale_total_sek,
                  r.cost_total_sek,
                  r.margin_sek,
                ]),
              ])
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Exportera
          </Button>
          <Table
            head={["Månad", "Destination", "Bokningar", "Försäljning", "Vinst"]}
            rows={forecast.map((r) => [
              String(r.month).slice(0, 7),
              r.destination ?? "-",
              r.bookings_count,
              formatSek(r.sale_total_sek),
              formatSek(r.margin_sek),
            ])}
          />
        </TabsContent>

        <TabsContent value="margin" className="mt-4 space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv("vinst.csv", [
                ["Bokningsnr", "Resa", "Kund", "Avresa", "Försäljning", "Inköp", "Vinst"],
                ...margins.map((r) => [
                  r.booking_number,
                  r.title,
                  r.company_name || r.contact_name,
                  r.depart_date,
                  r.sale_total_sek,
                  r.cost_total_sek,
                  r.margin_sek,
                ]),
              ])
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Exportera
          </Button>
          <Table
            head={["Nr", "Resa", "Kund", "Försäljning", "Inköp", "Vinst"]}
            rows={margins.map((r) => [
              r.booking_number,
              r.title,
              r.company_name || r.contact_name,
              formatSek(r.sale_total_sek),
              formatSek(r.cost_total_sek),
              formatSek(r.margin_sek),
            ])}
          />
        </TabsContent>

        <TabsContent value="unpaid" className="mt-4 space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv("obetalda-fakturor.csv", [
                ["Fakturanr", "Förfaller", "Totalt", "Betalt", "Kvar", "Status"],
                ...unpaid.map((r) => [
                  r.invoice_number,
                  r.due_date,
                  r.total_sek,
                  r.paid_sek,
                  Number(r.total_sek) - Number(r.paid_sek),
                  INVOICE_STATUS_LABEL[r.status as keyof typeof INVOICE_STATUS_LABEL],
                ]),
              ])
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Exportera
          </Button>
          <Table
            head={["Fakturanr", "Förfaller", "Totalt", "Betalt", "Kvar", "Status"]}
            rows={unpaid.map((r) => [
              r.invoice_number,
              r.due_date,
              formatSek(r.total_sek),
              formatSek(r.paid_sek),
              formatSek(Number(r.total_sek) - Number(r.paid_sek)),
              INVOICE_STATUS_LABEL[r.status as keyof typeof INVOICE_STATUS_LABEL],
            ])}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number | null)[][] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Ingen data ännu.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3">
                  {c ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
