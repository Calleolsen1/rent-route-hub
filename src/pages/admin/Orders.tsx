import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, RefreshCcw, Ban, Loader2, Sparkles, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatSek } from "@/lib/formatSek";
import { getStripeEnvironment } from "@/lib/stripe";

type OrderRow = {
  id: string;
  status: string;
  total_sek: number;
  total_paid_sek: number | null;
  refunded_sek: number | null;
  currency: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  invoice_number: string | null;
  xs2_reservation_id: string | null;
  xs2_booking_id: string | null;
  quote_id: string | null;
  notes: string | null;
  last_refund_reason: string | null;
  stripe_checkout_session_id: string | null;
  order_items: Array<{
    id: string;
    qty: number;
    unit_price_sek: number;
    sub_category: string | null;
    events: {
      sport: string;
      tournament_name: string;
      home_team: string | null;
      away_team: string | null;
      race_name: string | null;
      venue_name: string | null;
      city: string | null;
      starts_at: string;
    } | null;
    ticket_categories: { name: string } | null;
  }>;
};

type RefundRow = {
  id: string;
  amount_sek: number;
  reason: string | null;
  stripe_refund_id: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pågående",
  awaiting_payment: "Väntar betalning",
  paid: "Betald",
  fulfilled: "Levererad",
  failed: "Misslyckad",
  refunded: "Återbetald",
  cancelled: "Avbruten",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  awaiting_payment: "outline",
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
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [refundOpen, setRefundOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("orders")
      .select(
        "id, status, total_sek, total_paid_sek, refunded_sek, currency, customer_email, customer_name, customer_phone, created_at, invoice_number, xs2_reservation_id, xs2_booking_id, quote_id, notes, last_refund_reason, stripe_checkout_session_id, order_items(id, qty, unit_price_sek, sub_category, events(sport, tournament_name, home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(name))",
      )
      .order("created_at", { ascending: false });
    setOrders((data as unknown as OrderRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openOrder = async (o: OrderRow) => {
    setSelected(o);
    const { data } = await (supabase as any)
      .from("refunds")
      .select("id, amount_sek, reason, stripe_refund_id, created_at")
      .eq("order_id", o.id)
      .order("created_at", { ascending: false });
    setRefunds((data as RefundRow[]) ?? []);
  };

  const filtered = orders.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.invoice_number?.toLowerCase().includes(q) ||
        o.xs2_booking_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const [sweeping, setSweeping] = useState(false);
  const runCleanup = async () => {
    setSweeping(true);
    try {
      // Expire stale quotes
      const { data: q } = await (supabase as any).rpc("expire_old_quotes");
      const expiredQuotes = (q as number) ?? 0;

      // Cancel orders with expired xs2 reservations still in pending/awaiting state
      const { data: cancelled } = await (supabase as any)
        .from("orders")
        .update({ status: "cancelled" })
        .lt("reservation_expires_at", new Date().toISOString())
        .in("status", ["pending", "awaiting_payment"])
        .not("xs2_reservation_id", "is", null)
        .select("id");
      const cancelledCount = (cancelled as { id: string }[] | null)?.length ?? 0;

      toast.success(
        `Städning klar - ${expiredQuotes} utgångna offerter, ${cancelledCount} släppta reservationer.`,
      );
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Städning misslyckades");
    } finally {
      setSweeping(false);
    }
  };

  const resolveConfirmFailure = async (orderId: string) => {
    const stamp = new Date().toISOString();
    const { error } = await (supabase as any)
      .from("orders")
      .update({
        status: "fulfilled",
        notes: `Manuellt löst av admin ${stamp}`,
      })
      .eq("id", orderId);
    if (error) {
      toast.error(error.message ?? "Kunde inte markera som löst");
      return;
    }
    toast.success("Markerad som manuellt löst");
    setSelected(null);
    load();
  };

  const cancelPending = async (orderId: string) => {
    const { error } = await (supabase as any)
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .in("status", ["pending", "awaiting_payment"]);
    if (error) {
      toast.error(error.message ?? "Kunde inte avbryta");
      return;
    }
    toast.success("Beställningen är markerad som avbruten");
    setSelected(null);
    load();
  };

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-3xl font-display mb-2">Beställningar</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Biljett- och offertbetalningar. Klicka på en rad för detaljer och åtgärder.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Sök på namn, e-post, order-ID, faktura, xs2-ref..."
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
        <Button
          variant="outline"
          size="sm"
          disabled={sweeping}
          onClick={runCleanup}
          className="self-center"
        >
          {sweeping ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
          Städa utgångna
        </Button>
        <div className="ml-auto self-center text-sm text-muted-foreground">
          {filtered.length} av {orders.length} beställningar
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Kund</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Belopp</TableHead>
              <TableHead>Återbetalt</TableHead>
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
              filtered.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => openOrder(o)}
                >
                  <TableCell className="font-mono text-xs">
                    {o.invoice_number ?? `#${o.id.slice(0, 8).toUpperCase()}`}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{o.customer_name ?? "-"}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(o.created_at).toLocaleDateString("sv-SE")}
                  </TableCell>
                  <TableCell>{formatSek(o.total_sek)}</TableCell>
                  <TableCell>
                    {o.refunded_sek && Number(o.refunded_sek) > 0
                      ? <span className="text-amber-700">{formatSek(Number(o.refunded_sek))}</span>
                      : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[o.status] ?? "outline"}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <OrderDetail
              order={selected}
              refunds={refunds}
              onRefundClick={() => setRefundOpen(true)}
              onCancelPending={() => cancelPending(selected.id)}
              onResolveFailure={() => resolveConfirmFailure(selected.id)}
            />
          )}
        </SheetContent>
      </Sheet>

      {selected && (
        <RefundDialog
          order={selected}
          open={refundOpen}
          onOpenChange={setRefundOpen}
          onDone={() => {
            setRefundOpen(false);
            load();
            openOrder(selected); // refresh selected + its refund list
          }}
        />
      )}
    </div>
  );
}

function OrderDetail({
  order,
  refunds,
  onRefundClick,
  onCancelPending,
  onResolveFailure,
}: {
  order: OrderRow;
  refunds: RefundRow[];
  onRefundClick: () => void;
  onCancelPending: () => void;
  onResolveFailure: () => void;
}) {
  const paid = Number(order.total_paid_sek ?? order.total_sek);
  const refunded = Number(order.refunded_sek ?? 0);
  const remaining = paid - refunded;
  const canRefund = ["paid", "fulfilled"].includes(order.status) && remaining > 0;
  const isPending = ["pending", "awaiting_payment"].includes(order.status);
  const isQuote = !!order.quote_id;
  const isXs2 = !!order.xs2_reservation_id;
  const orderRef = order.invoice_number ?? order.id.slice(0, 8).toUpperCase();
  const needsManualFulfillment = !!(order.notes && order.notes.startsWith("xs2 confirm failed"));

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-display text-2xl">{orderRef}</SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={STATUS_VARIANTS[order.status]}>
            {STATUS_LABELS[order.status] ?? order.status}
          </Badge>
          {isQuote && <Badge variant="outline">Offert</Badge>}
          {isXs2 && <Badge variant="outline">xs2event</Badge>}
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(order.created_at).toLocaleString("sv-SE")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Namn" value={order.customer_name} />
          <Info label="E-post" value={order.customer_email} />
          <Info label="Telefon" value={order.customer_phone} />
          {order.xs2_booking_id && (
            <Info label="xs2 bokning" value={order.xs2_booking_id} mono />
          )}
        </div>

        {/* Items */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            {isQuote ? "Offert" : "Biljetter"}
          </Label>
          {order.order_items.length === 0 && isQuote ? (
            <p className="text-xs text-muted-foreground">
              Offertbetalning - rader finns på offerten.
            </p>
          ) : (
            <div className="space-y-2">
              {order.order_items.map((it) => {
                const ev = it.events;
                const headline = ev?.home_team
                  ? `${ev.home_team} vs ${ev.away_team}`
                  : ev?.race_name ?? "-";
                return (
                  <div key={it.id} className="border border-border rounded-lg p-3 text-sm">
                    <p className="font-medium">{headline}</p>
                    <p className="text-xs text-muted-foreground">
                      {ev?.venue_name}{ev?.city ? `, ${ev.city}` : ""}
                      {ev?.starts_at && ` · ${new Date(ev.starts_at).toLocaleDateString("sv-SE")}`}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span>{it.ticket_categories?.name ?? "-"} × {it.qty}</span>
                      <span>{formatSek(Number(it.unit_price_sek) * it.qty)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment summary */}
        <div className="border-t border-border pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Totalt</span>
            <span>{formatSek(order.total_sek)}</span>
          </div>
          {order.total_paid_sek != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Betalt</span>
              <span>{formatSek(paid)}</span>
            </div>
          )}
          {refunded > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Återbetalt</span>
              <span>{formatSek(refunded)}</span>
            </div>
          )}
          {refunded > 0 && (
            <div className="flex justify-between border-t border-border pt-1.5 font-medium">
              <span>Kvar</span>
              <span>{formatSek(remaining)}</span>
            </div>
          )}
        </div>

        {/* Refund history */}
        {refunds.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Återbetalningar
            </Label>
            {refunds.map((r) => (
              <div key={r.id} className="border border-border rounded-lg p-3 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{formatSek(Number(r.amount_sek))}</span>
                  <span className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("sv-SE")}
                  </span>
                </div>
                {r.reason && <p className="text-muted-foreground">{r.reason}</p>}
                {r.stripe_refund_id && (
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">
                    {r.stripe_refund_id}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Anteckningar
            </Label>
            <p className="mt-1 text-xs text-muted-foreground bg-muted/30 p-3 rounded whitespace-pre-wrap">
              {order.notes}
            </p>
          </div>
        )}

        {/* Manual-fulfillment banner - Stripe paid but xs2 confirm failed */}
        {needsManualFulfillment && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
            <div className="flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Manuell bokning krävs</p>
                <p>
                  Kunden har betalat men xs2-bokningen kunde inte slutföras automatiskt.
                  Kontakta xs2event-support och bekräfta bokningen där. Klicka sedan
                  "Markera som löst" - kunden får ingen ny aviseringsmail automatiskt.
                </p>
              </div>
            </div>
            <Button onClick={onResolveFailure} size="sm" className="w-full" variant="default">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Markera som löst
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-border pt-4 space-y-2">
          {order.stripe_checkout_session_id && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const url = `/order/${order.id}?session_id=${encodeURIComponent(order.stripe_checkout_session_id!)}`;
                window.open(url, "_blank", "noopener");
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Visa som kund
            </Button>
          )}
          {canRefund && (
            <Button onClick={onRefundClick} className="w-full" variant="outline">
              <RefreshCcw className="h-3.5 w-3.5 mr-2" />
              Återbetala
            </Button>
          )}
          {isPending && (
            <Button onClick={onCancelPending} className="w-full" variant="outline">
              <Ban className="h-3.5 w-3.5 mr-2" />
              Markera som avbruten
            </Button>
          )}
          {canRefund && isXs2 && (
            <p className="text-[11px] text-muted-foreground flex items-start gap-2 pt-1">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Återbetalningen gäller bara Stripe-betalningen. xs2event-bokningar måste avbokas separat via deras support.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function RefundDialog({
  order,
  open,
  onOpenChange,
  onDone,
}: {
  order: OrderRow;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const paid = Number(order.total_paid_sek ?? order.total_sek);
  const refunded = Number(order.refunded_sek ?? 0);
  const remaining = paid - refunded;
  const [amount, setAmount] = useState(remaining);
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(remaining);
      setReason("");
      setNotify(true);
    }
  }, [open, remaining]);

  const submit = async () => {
    if (amount <= 0 || amount > remaining + 0.01) {
      toast.error(`Belopp måste vara mellan 0 och ${remaining.toFixed(2)}`);
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-refund-order", {
        body: {
          order_id: order.id,
          amount_sek: amount,
          reason: reason.trim() || undefined,
          environment: getStripeEnvironment(),
          notify_customer: notify,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error ?? error?.message ?? "Återbetalning misslyckades");
      }
      toast.success("Återbetalning genomförd");
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Återbetala</DialogTitle>
          <DialogDescription>
            Återbetalt belopp dras från originalbetalningen i Stripe. Kvar att återbetala: {formatSek(remaining)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="refund-amount" className="text-xs uppercase tracking-wider">
              Belopp (SEK)
            </Label>
            <Input
              id="refund-amount"
              type="number"
              min={0}
              max={remaining}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="refund-reason" className="text-xs uppercase tracking-wider">
              Anledning (visas för kund)
            </Label>
            <Textarea
              id="refund-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="T.ex. Evenemang inställt, kundens önskemål..."
              className="mt-1"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
            />
            Meddela kunden via e-post
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            Återbetala {formatSek(amount)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className={`text-foreground ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}
