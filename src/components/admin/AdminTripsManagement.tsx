import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Plus, Pencil, Trash2, Plane, Search, Users,
  Send, FileText, Hotel, Car, Ticket, CreditCard, Calendar,
  ChevronRight, CheckCircle2, Circle, Bell, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isFuture, isPast } from "date-fns";
import { sv } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import TripGroupsManagement from "@/components/admin/TripGroupsManagement";
import { TripFormDialog, type Trip } from "@/components/admin/TripFormDialog";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  upcoming:  { label: "Kommande",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  ongoing:   { label: "Pågående",  color: "bg-green-100 text-green-700 border-green-200" },
  completed: { label: "Avslutad", color: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "Inställd", color: "bg-red-100 text-red-700 border-red-200" },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  unpaid:  { label: "Obetald",     color: "bg-red-100 text-red-700" },
  partial: { label: "Delbetalad", color: "bg-yellow-100 text-yellow-700" },
  paid:    { label: "Betald",     color: "bg-green-100 text-green-700" },
  overdue: { label: "Förfallen",  color: "bg-orange-100 text-orange-700" },
};

// ─── Invoice HTML builder (mirrors edge function template) ───────────────────
function buildInvoiceHtml(data: {
  invoiceNumber: string; guestName: string; guestEmail: string;
  tripTitle: string; destination: string; startDate?: string; endDate?: string;
  paymentDueDate?: string; paymentMethod?: string;
  breakdown: Array<{ label: string; amount: number }>; total: number; currency: string; invoiceNotes?: string;
}): string {
  const { invoiceNumber, guestName, guestEmail, tripTitle, destination, startDate, endDate, paymentDueDate, paymentMethod, breakdown, total, currency, invoiceNotes } = data;

  const fmt = (n: number) => n.toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtDate = (iso?: string) => {
    if (!iso) return "–";
    try { return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" }); } catch { return iso; }
  };
  const pmLabel: Record<string, string> = { invoice: "Faktura", card: "Kortbetalning", bank_transfer: "Banköverföring", split: "Delad betalning", included: "Ingår i paketet" };

  const rows = breakdown.length > 0
    ? breakdown.map(r => `<tr><td style="padding:10px 0;color:#8a9bb5;font-size:14px;border-bottom:1px solid #1e2d4a;">${r.label}</td><td style="padding:10px 0;color:#c9d6e8;font-size:14px;text-align:right;border-bottom:1px solid #1e2d4a;font-family:monospace;">${fmt(r.amount)} ${currency}</td></tr>`).join("")
    : `<tr><td colspan="2" style="padding:10px 0;color:#4a5d75;font-size:13px;">Ingen specificering tillgänglig</td></tr>`;

  return `<!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Faktura ${invoiceNumber}</title></head>
<body style="margin:0;padding:0;background:#0a1220;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1220;padding:48px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0f1929;border:1px solid #1e2d4a;max-width:600px;width:100%;">
<tr><td style="padding:36px 48px 28px;background:linear-gradient(135deg,#0f1929 0%,#162035 100%);border-bottom:2px solid #8B6914;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><table cellpadding="0" cellspacing="0"><tr>
      <td style="background:#8B6914;width:44px;height:44px;text-align:center;vertical-align:middle;border-radius:50%;"><span style="color:#fff;font-size:20px;font-weight:700;font-family:Georgia,serif;">K</span></td>
      <td style="padding-left:14px;"><div style="color:#d4a84b;font-size:20px;letter-spacing:0.3em;font-family:Georgia,serif;">KAISEN</div><div style="color:#8a9bb5;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;margin-top:2px;">Travel Group</div></td>
    </tr></table></td>
    <td align="right"><div style="color:#4a5d75;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:4px;">Faktura</div><div style="color:#d4a84b;font-size:22px;letter-spacing:0.1em;font-family:monospace;">${invoiceNumber}</div></td>
  </tr></table>
</td></tr>
<tr><td style="background:#8B6914;padding:12px 48px;"><span style="color:#fff;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;">Resebekräftelse &amp; Faktura</span></td></tr>
<tr><td style="padding:36px 48px 28px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="50%" style="vertical-align:top;padding-right:20px;">
      <div style="color:#4a5d75;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:8px;">Faktureras till</div>
      <div style="color:#c9d6e8;font-size:16px;font-family:Georgia,serif;margin-bottom:4px;">${guestName}</div>
      <div style="color:#8a9bb5;font-size:13px;">${guestEmail}</div>
    </td>
    <td width="50%" style="vertical-align:top;">
      <div style="color:#4a5d75;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:8px;">Resa</div>
      <div style="color:#d4a84b;font-size:15px;font-family:Georgia,serif;margin-bottom:4px;">${tripTitle}</div>
      <div style="color:#8a9bb5;font-size:13px;">${destination}</div>
      ${startDate ? `<div style="color:#8a9bb5;font-size:12px;margin-top:6px;">${fmtDate(startDate)}${endDate ? " – " + fmtDate(endDate) : ""}</div>` : ""}
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:0 48px;"><div style="height:1px;background:#1e2d4a;"></div></td></tr>
<tr><td style="padding:28px 48px;">
  <div style="color:#4a5d75;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">Prisspecifikation</div>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${rows}
    <tr>
      <td style="padding:16px 0 0;color:#d4a84b;font-size:16px;font-family:Georgia,serif;font-weight:bold;">Totalt att betala</td>
      <td style="padding:16px 0 0;text-align:right;"><span style="background:#8B6914;color:#fff;font-size:18px;font-family:monospace;padding:6px 16px;display:inline-block;letter-spacing:0.05em;">${fmt(total)} ${currency}</span></td>
    </tr>
  </table>
</td></tr>
<tr><td style="padding:0 48px 28px;">
  <div style="background:#162035;border:1px solid #1e2d4a;padding:20px 24px;">
    <div style="color:#4a5d75;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:12px;">Betalningsinformation</div>
    <table cellpadding="0" cellspacing="0">
      ${paymentDueDate ? `<tr><td style="color:#8a9bb5;font-size:13px;padding:3px 0;width:160px;">Förfallodatum</td><td style="color:#e8a020;font-size:13px;font-weight:bold;padding:3px 0;">${fmtDate(paymentDueDate)}</td></tr>` : ""}
      ${paymentMethod ? `<tr><td style="color:#8a9bb5;font-size:13px;padding:3px 0;width:160px;">Betalningsmetod</td><td style="color:#c9d6e8;font-size:13px;padding:3px 0;">${pmLabel[paymentMethod] || paymentMethod}</td></tr>` : ""}
      <tr><td style="color:#8a9bb5;font-size:13px;padding:3px 0;width:160px;">Bankgiro</td><td style="color:#c9d6e8;font-size:13px;padding:3px 0;">–</td></tr>
      <tr><td style="color:#8a9bb5;font-size:13px;padding:3px 0;width:160px;">Referens</td><td style="color:#c9d6e8;font-size:13px;padding:3px 0;font-family:monospace;">${invoiceNumber}</td></tr>
    </table>
    ${invoiceNotes ? `<p style="margin:14px 0 0;color:#8a9bb5;font-size:12px;line-height:1.6;border-top:1px solid #1e2d4a;padding-top:12px;">${invoiceNotes}</p>` : ""}
  </div>
</td></tr>
<tr><td style="padding:20px 48px 32px;border-top:2px solid #8B6914;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><p style="margin:0 0 4px;color:#4a5d75;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Kaisen Travel Group</p><p style="margin:0;color:#4a5d75;font-size:11px;">info@kaisengroup.se &nbsp;·&nbsp; kaisengroup.se</p></td>
    <td align="right"><div style="background:#8B6914;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;display:inline-block;"><span style="color:#fff;font-size:13px;font-weight:700;font-family:Georgia,serif;">K</span></div></td>
  </tr></table>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

// ─── Invoice Send Dialog ──────────────────────────────────────────────────────
const SendInvoiceDialog = ({
  trip, open, onOpenChange, onSent
}: {
  trip: Trip | null; open: boolean;
  onOpenChange: (v: boolean) => void; onSent: () => void;
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"summary" | "preview">("summary");
  const { user } = useAuth();

  const breakdown = Array.isArray(trip?.price_breakdown) ? trip!.price_breakdown as Array<{ label: string; amount: string | number }> : [];
  const total = trip?.price_total || breakdown.reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0);
  const guestName = trip?.profiles
    ? `${trip.profiles.first_name || ""} ${trip.profiles.last_name || ""}`.trim() || trip.profiles.email
    : trip?.guest_user_id;
  const guestEmail = trip?.profiles?.email;
  const invoiceNum = trip?.invoice_number || `KAI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const previewHtml = useMemo(() => {
    if (!trip) return "";
    return buildInvoiceHtml({
      invoiceNumber: invoiceNum,
      guestName: guestName || guestEmail || "–",
      guestEmail: guestEmail || "–",
      tripTitle: trip.title,
      destination: trip.destination || "",
      startDate: trip.start_date || undefined,
      endDate: trip.end_date || undefined,
      paymentDueDate: trip.payment_due_date || undefined,
      paymentMethod: trip.payment_method || undefined,
      breakdown: breakdown.map(r => ({ label: r.label, amount: parseFloat(String(r.amount)) || 0 })),
      total,
      currency: trip.price_currency || "SEK",
      invoiceNotes: trip.invoice_notes || undefined,
    });
  }, [trip, guestName, guestEmail, invoiceNum]);

  if (!trip) return null;


  const handleSend = async () => {
    if (!guestEmail) {
      toast({ title: "Ingen e-post hittad för resenären", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error: fnError } = await supabase.functions.invoke("send-invoice", {
        body: {
          guestEmail, guestName, invoiceNumber: invoiceNum,
          tripTitle: trip.title, destination: trip.destination || "",
          startDate: trip.start_date || undefined, endDate: trip.end_date || undefined,
          paymentDueDate: trip.payment_due_date || undefined, paymentMethod: trip.payment_method || undefined,
          breakdown: breakdown.map(r => ({ label: r.label, amount: parseFloat(String(r.amount)) || 0 })),
          total, currency: trip.price_currency || "SEK", invoiceNotes: trip.invoice_notes || undefined,
        },
      });
      if (fnError) throw fnError;

      const { error: dbError } = await supabase.from("trips").update({
        invoice_sent_at: new Date().toISOString(), invoice_number: invoiceNum,
      }).eq("id", trip.id);
      if (dbError) throw dbError;

      toast({ title: "Faktura skickad ✓", description: `Skickad till ${guestEmail} · ${invoiceNum}` });
      onSent();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Fel vid utskick", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Faktura – {trip.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={v => setTab(v as "summary" | "preview")} className="flex-1 flex flex-col min-h-0 px-6">
          <TabsList className="mb-3 w-fit">
            <TabsTrigger value="summary" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> Sammanfattning
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5" /> Förhandsgranska e-post
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4 overflow-y-auto flex-1 pb-2 pr-1">
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Till:</span>
                <span className="font-medium">{guestName}</span>
              </div>
              {guestEmail && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">E-post:</span>
                  <span>{guestEmail}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resa:</span>
                <span>{trip.destination}</span>
              </div>
              {trip.start_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Datum:</span>
                  <span>{format(parseISO(trip.start_date), "d MMM yyyy", { locale: sv })}{trip.end_date ? ` – ${format(parseISO(trip.end_date), "d MMM yyyy", { locale: sv })}` : ""}</span>
                </div>
              )}
              {trip.payment_due_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Förfallodatum:</span>
                  <span className="font-medium text-destructive">{format(parseISO(trip.payment_due_date), "d MMM yyyy", { locale: sv })}</span>
                </div>
              )}
            </div>

            {breakdown.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Specifikation</Label>
                {breakdown.map((r, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{r.label}</span>
                    <span>{parseFloat(String(r.amount)).toLocaleString("sv-SE")} {trip.price_currency}</span>
                  </div>
                ))}
                <Separator />
              </div>
            )}

            <div className="flex justify-between font-semibold">
              <span>Totalt</span>
              <span className="text-lg">{total.toLocaleString("sv-SE")} {trip.price_currency || "SEK"}</span>
            </div>

            {trip.invoice_notes && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3">{trip.invoice_notes}</p>
            )}

            {Array.isArray(trip.flights) && trip.flights.some((f: any) => f.ticket_url) && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Bifogade biljetter</Label>
                {trip.flights.filter((f: any) => f.ticket_url).map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Plane className="h-3 w-3 text-muted-foreground" />
                    <a href={f.ticket_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      {f.ticket_name || `Flygbiljett ${f.from}→${f.to}`}
                    </a>
                  </div>
                ))}
              </div>
            )}

            {trip.invoice_sent_at && (
              <p className="text-xs text-muted-foreground">
                Senast skickad: {format(parseISO(trip.invoice_sent_at), "d MMM yyyy HH:mm", { locale: sv })}
                {trip.invoice_number && ` · ${trip.invoice_number}`}
              </p>
            )}
          </TabsContent>

          <TabsContent value="preview" className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border" style={{ minHeight: 460 }}>
            <iframe
              srcDoc={previewHtml}
              title="Faktura förhandsgranskning"
              className="w-full h-full"
              style={{ minHeight: 460 }}
              sandbox="allow-same-origin"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-border mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Stäng</Button>
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Skickar..." : trip.invoice_sent_at ? "Skicka igen" : "Skicka faktura via e-post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};



// ─── Trip Card ────────────────────────────────────────────────────────────────
const CHECKLIST_KEYS = ["flights", "hotel", "transfers", "tickets"];

const TripCard = ({ trip, onEdit, onDelete, onInvoice }: {
  trip: Trip; onEdit: () => void; onDelete: () => void; onInvoice: () => void;
}) => {
  const statusCfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.upcoming;
  const payStatusCfg = PAYMENT_STATUS_CONFIG[trip.payment_status || "unpaid"] || PAYMENT_STATUS_CONFIG.unpaid;
  const guestName = trip.profiles
    ? `${trip.profiles.first_name || ""} ${trip.profiles.last_name || ""}`.trim() || trip.profiles.email
    : "–";

  const daysUntil = trip.start_date
    ? Math.ceil((new Date(trip.start_date).getTime() - new Date().getTime()) / 86400000)
    : null;

  const flights = Array.isArray(trip.flights) ? trip.flights : [];
  const transfers = Array.isArray(trip.transfers) ? trip.transfers : [];
  const tickets = Array.isArray(trip.tickets) ? trip.tickets : [];

  // Checklist progress
  const checklist = trip.booking_checklist || {};
  const doneCount = CHECKLIST_KEYS.filter(k => (checklist as any)[k]?.done).length;
  const allDone = doneCount === CHECKLIST_KEYS.length;

  return (
    <Card className="border border-border/60 hover:border-border transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Date column */}
            <div className="text-center min-w-[52px]">
              {trip.start_date ? (
                <>
                  <div className="text-xs text-muted-foreground uppercase">{format(parseISO(trip.start_date), "MMM", { locale: sv })}</div>
                  <div className="text-2xl font-bold leading-tight">{format(parseISO(trip.start_date), "d")}</div>
                  <div className="text-xs text-muted-foreground">{format(parseISO(trip.start_date), "yyyy")}</div>
                </>
              ) : (
                <div className="text-muted-foreground text-xs">–</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">{trip.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
                {daysUntil !== null && daysUntil > 0 && trip.status === "upcoming" && (
                  <span className="text-xs text-muted-foreground">om {daysUntil} dagar</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {guestName}
                {trip.destination && <><ChevronRight className="inline h-3 w-3" />{trip.destination}</>}
              </div>

              {/* Quick summary icons */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {flights.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Plane className="h-3 w-3" /> {flights.length} flyg
                    {flights.some((f: any) => f.ticket_url) && <FileText className="h-3 w-3 text-primary" />}
                  </div>
                )}
                {(trip.hotel_name) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Hotel className="h-3 w-3" /> {trip.hotel_name}
                    {trip.hotel_stars && " · " + "★".repeat(trip.hotel_stars)}
                  </div>
                )}
                {transfers.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Car className="h-3 w-3" /> {transfers.length} transfer
                  </div>
                )}
                {tickets.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Ticket className="h-3 w-3" /> {tickets.length} biljett{tickets.length !== 1 ? "er" : ""}
                  </div>
                )}
                {trip.price_total && (
                  <div className="flex items-center gap-1 text-xs">
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{Number(trip.price_total).toLocaleString("sv-SE")} {trip.price_currency}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${payStatusCfg.color}`}>
                      {payStatusCfg.label}
                    </span>
                  </div>
                )}
                {trip.payment_status === "paid" && (
                  <div className="flex items-center gap-1 text-xs text-primary font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Betald
                  </div>
                )}
                {trip.invoice_sent_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Send className="h-3 w-3" /> Faktura skickad {format(parseISO(trip.invoice_sent_at), "d MMM", { locale: sv })}
                  </div>
                )}
                {trip.customer_notified_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Bell className="h-3 w-3" /> Kund notifierad {format(parseISO(trip.customer_notified_at), "d MMM", { locale: sv })}
                  </div>
                )}
              </div>

              {/* Checklist progress bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1">
                  {CHECKLIST_KEYS.map(k => (
                    <div key={k} className={`w-4 h-1.5 rounded-full ${(checklist as any)[k]?.done ? "bg-primary" : "bg-muted"}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {allDone ? "Allt klart ✓" : `${doneCount}/${CHECKLIST_KEYS.length} bokat`}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onInvoice} className="gap-1 text-xs">
              <FileText className="h-3.5 w-3.5" /> Faktura
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Individual Trips Tab ─────────────────────────────────────────────────────
const IndividualTripsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [invoicingTrip, setInvoicingTrip] = useState<Trip | null>(null);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["admin-trips", search, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("trips")
        .select("*")
        // Sort by start_date ascending – next upcoming first
        .order("start_date", { ascending: true, nullsFirst: false });

      if (search) q = q.ilike("title", `%${search}%`);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);

      const { data, error } = await q;
      if (error) throw error;

      const tripList = data as unknown as Trip[];

      // Fetch profiles
      if (tripList.length > 0) {
        const userIds = [...new Set(tripList.map(t => t.guest_user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);
        if (profiles) {
          const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
          tripList.forEach(t => { (t as any).profiles = profileMap[t.guest_user_id] || null; });
        }
      }
      return tripList;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Vill du verkligen ta bort denna resa?")) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resa borttagen" });
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
    }
  };

  const onSaved = () => queryClient.invalidateQueries({ queryKey: ["admin-trips"] });

  // Group trips: upcoming first, then by date
  const upcoming = trips?.filter(t => t.status === "upcoming") || [];
  const ongoing = trips?.filter(t => t.status === "ongoing") || [];
  const others = trips?.filter(t => t.status !== "upcoming" && t.status !== "ongoing") || [];

  const grouped = statusFilter === "all"
    ? [...ongoing, ...upcoming, ...others]
    : (trips || []);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök resa..." className="pl-9" />
        </div>
        <div className="flex gap-1">
          {[["all","Alla"],["upcoming","Kommande"],["ongoing","Pågående"],["completed","Avslutade"],["cancelled","Inställda"]].map(([val, label]) => (
            <Button key={val} variant={statusFilter === val ? "default" : "outline"} size="sm"
              onClick={() => setStatusFilter(val)} className="text-xs">
              {label}
            </Button>
          ))}
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2 ml-auto">
          <Plus className="h-4 w-4" /> Ny resa
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : grouped.length > 0 ? (
        <div className="space-y-2">
          {grouped.map(t => (
            <TripCard
              key={t.id}
              trip={t}
              onEdit={() => { setEditing(t); setDialogOpen(true); }}
              onDelete={() => handleDelete(t.id)}
              onInvoice={() => { setInvoicingTrip(t); setInvoiceOpen(true); }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Inga resor hittades</p>
        </div>
      )}

      <TripFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trip={editing}
        onSaved={onSaved}
      />
      <SendInvoiceDialog
        trip={invoicingTrip}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        onSent={onSaved}
      />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminTripsManagement = () => {
  return (
    <Tabs defaultValue="individual">
      <TabsList className="mb-6">
        <TabsTrigger value="individual" className="gap-2">
          <Plane className="h-4 w-4" /> Individuella resor
        </TabsTrigger>
        <TabsTrigger value="groups" className="gap-2">
          <Users className="h-4 w-4" /> Gruppresor
        </TabsTrigger>
      </TabsList>
      <TabsContent value="individual">
        <IndividualTripsTab />
      </TabsContent>
      <TabsContent value="groups">
        <TripGroupsManagement />
      </TabsContent>
    </Tabs>
  );
};

export default AdminTripsManagement;
