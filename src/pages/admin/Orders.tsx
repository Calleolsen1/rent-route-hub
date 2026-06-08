import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSek } from "@/lib/formatSek";

type OrderRow = {
  id: string;
  status: string;
  total_sek: number;
  currency: string;
  customer_email: string;
  customer_name: string | null;
  created_at: string;
  invoice_number: string | null;
  order_items: { qty: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pågående",
  paid: "Betald",
  fulfilled: "Levererad",
  failed: "Misslyckad",
  refunded: "Återbetald",
  cancelled: "Avbruten",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "secondary",
  fulfilled: "default",
  failed: "destructive",
  refunded: "outline",
  cancelled: "outline",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select(
          "id, status, total_sek, currency, customer_email, customer_name, created_at, invoice_number, order_items(qty)",
        )
        .order("created_at", { ascending: false });
      setOrders((data as unknown as OrderRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = orders.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-3xl font-display mb-2">Beställningar</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Biljettköp och leveransstatus.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Sök på kund, e-post eller order-ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Kund</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Antal</TableHead>
              <TableHead>Belopp</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Laddar...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Inga beställningar.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => {
                const tickets = o.order_items.reduce((s, it) => s + it.qty, 0);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{o.customer_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(o.created_at).toLocaleDateString("sv-SE")}
                    </TableCell>
                    <TableCell>{tickets}</TableCell>
                    <TableCell>{formatSek(o.total_sek)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[o.status] ?? "outline"}>
                        {STATUS_LABELS[o.status] ?? o.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
