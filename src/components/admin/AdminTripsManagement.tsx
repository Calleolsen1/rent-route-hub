import { useState } from "react";
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
  ChevronRight, CheckCircle2, Circle, Bell
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

// ─── Invoice Send Dialog ──────────────────────────────────────────────────────
const SendInvoiceDialog = ({
  trip, open, onOpenChange, onSent
}: {
  trip: Trip | null; open: boolean;
  onOpenChange: (v: boolean) => void; onSent: () => void;
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  if (!trip) return null;

  const breakdown = Array.isArray(trip.price_breakdown) ? trip.price_breakdown as Array<{ label: string; amount: string | number }> : [];
  const total = trip.price_total || breakdown.reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0);
  const guestName = trip.profiles
    ? `${trip.profiles.first_name || ""} ${trip.profiles.last_name || ""}`.trim() || trip.profiles.email
    : trip.guest_user_id;
  const guestEmail = trip.profiles?.email;

  const handleSend = async () => {
    if (!guestEmail) {
      toast({ title: "Ingen e-post hittad för resenären", variant: "destructive" });
      return;
    }
    setSending(true);

    const invoiceNum = trip.invoice_number || `KAI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    try {
      // Send invoice email via edge function
      const { error: fnError } = await supabase.functions.invoke("send-invoice", {
        body: {
          guestEmail,
          guestName,
          invoiceNumber: invoiceNum,
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
        },
      });

      if (fnError) throw fnError;

      // Mark as sent in DB
      const { error: dbError } = await supabase.from("trips").update({
        invoice_sent_at: new Date().toISOString(),
        invoice_number: invoiceNum,
      }).eq("id", trip.id);

      if (dbError) throw dbError;

      toast({
        title: "Faktura skickad ✓",
        description: `Skickad till ${guestEmail} · ${invoiceNum}`,
      });
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Faktura – {trip.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Header */}
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

          {/* Price breakdown */}
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

          {/* Flight tickets links */}
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
        </div>

        <DialogFooter>
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
