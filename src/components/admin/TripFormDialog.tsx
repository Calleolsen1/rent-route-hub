import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Plus, Trash2, Plane, Car, Hotel, Ticket, Info,
  Upload, FileText, X, DollarSign, CheckCircle2, Circle, Bell, CreditCard,
  Search, User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
export type FlightLeg = {
  id: string;
  from: string; to: string;
  flight_number: string; airline: string;
  departure: string; arrival: string;
  class: string;
  ticket_url?: string;
  ticket_name?: string;
};

export type Transfer = {
  id: string;
  from: string; to: string;
  datetime: string;
  vehicle: string;
  notes?: string;
};

export type HotelData = {
  name: string; address: string; stars: string;
  checkin: string; checkout: string;
  confirmation: string; notes: string;
};

export type ScheduleItem = {
  id: string;
  date: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
};

export type RestaurantItem = {
  id: string;
  name: string;
  date: string;
  time: string;
  address?: string;
  reservation_ref?: string;
  notes?: string;
};

export type TicketItem = {
  id: string;
  name: string; date: string; time: string;
  description?: string;
  file_url?: string;
  file_name?: string;
};

export type PriceRow = {
  id: string;
  label: string;
  amount: string;
};

// ─── Booking Checklist ────────────────────────────────────────────────────────
// Each item: { done: boolean, visible_to_customer: boolean, included: boolean }
export type ChecklistItem = {
  done: boolean;
  visible_to_customer: boolean;
  included: boolean; // whether this section is part of this trip
};

export type BookingChecklist = {
  hotel?: ChecklistItem;
  flights?: ChecklistItem;
  transfers?: ChecklistItem;
  tickets?: ChecklistItem;
  restaurants?: ChecklistItem;
  schedule?: ChecklistItem;
  payment?: ChecklistItem;
  [key: string]: ChecklistItem | undefined;
};

export type TripFormData = {
  guest_user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
  hotel: HotelData;
  flights: FlightLeg[];
  transfers: Transfer[];
  tickets: TicketItem[];
  schedule: ScheduleItem[];
  restaurants: RestaurantItem[];
  price_total: string;
  price_currency: string;
  payment_method: string;
  payment_due_date: string;
  payment_status: string;
  invoice_notes: string;
  price_breakdown: PriceRow[];
  booking_checklist: BookingChecklist;
};

export type Trip = {
  id: string;
  guest_user_id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  notes: string | null;
  hotel_name: string | null;
  hotel_address: string | null;
  hotel_checkin: string | null;
  hotel_checkout: string | null;
  hotel_confirmation: string | null;
  hotel_notes: string | null;
  hotel_stars: number | null;
  flights: FlightLeg[];
  transfers: Transfer[];
  schedule: any[];
  tickets: TicketItem[];
  price_total: number | null;
  price_currency: string | null;
  payment_method: string | null;
  payment_due_date: string | null;
  payment_status: string | null;
  invoice_notes: string | null;
  price_breakdown: PriceRow[];
  invoice_sent_at: string | null;
  invoice_number: string | null;
  booking_checklist: BookingChecklist | null;
  customer_notified_at: string | null;
  payment_confirmed_at: string | null;
  created_at: string;
  profiles?: { first_name: string | null; last_name: string | null; email: string } | null;
};

const newId = () => crypto.randomUUID();

// ─── Customer type ────────────────────────────────────────────────────────────
type CustomerOption = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

// ─── Customer Picker ──────────────────────────────────────────────────────────
const CustomerPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) => {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .order("first_name")
      .then(({ data }) => {
        setCustomers((data as CustomerOption[]) || []);
        setLoading(false);
      });
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = customers.find(c => c.id === value);
  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const name = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
    return name.includes(q) || c.email.toLowerCase().includes(q);
  });

  const displayName = (c: CustomerOption) =>
    `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email;

  return (
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm text-left transition-colors",
          "bg-background hover:bg-muted/40",
          open && "ring-2 ring-ring"
        )}
      >
        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        {selected ? (
          <span className="flex-1 truncate">
            <span className="font-medium">{displayName(selected)}</span>
            <span className="text-muted-foreground ml-2 text-xs">{selected.email}</span>
          </span>
        ) : (
          <span className="text-muted-foreground flex-1">Välj resenär...</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-muted rounded outline-none"
                placeholder="Sök namn eller e-post..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground text-center">Laddar...</div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">Inga kunder hittades</div>
            ) : filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setOpen(false); setSearch(""); }}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors",
                  c.id === value && "bg-primary/10"
                )}
              >
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary">
                  {(c.first_name?.[0] || c.email[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{displayName(c)}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                  <div className="text-[10px] text-muted-foreground/60 font-mono truncate">{c.id}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



const emptyFlight = (): FlightLeg => ({
  id: newId(), from: "", to: "", flight_number: "", airline: "",
  departure: "", arrival: "", class: "economy"
});
const emptyTransfer = (): Transfer => ({
  id: newId(), from: "", to: "", datetime: "", vehicle: "taxi"
});
const emptyTicket = (): TicketItem => ({
  id: newId(), name: "", date: "", time: ""
});
const emptyPriceRow = (): PriceRow => ({
  id: newId(), label: "", amount: ""
});
const emptyHotel = (): HotelData => ({
  name: "", address: "", stars: "", checkin: "", checkout: "", confirmation: "", notes: ""
});
const defaultChecklist = (): BookingChecklist => ({
  hotel: { done: false, visible_to_customer: true, included: true },
  flights: { done: false, visible_to_customer: true, included: true },
  transfers: { done: false, visible_to_customer: true, included: true },
  tickets: { done: false, visible_to_customer: true, included: true },
  restaurants: { done: false, visible_to_customer: true, included: false },
  schedule: { done: false, visible_to_customer: true, included: false },
  payment: { done: false, visible_to_customer: false, included: true },
});

const emptyScheduleItem = (): ScheduleItem => ({
  id: newId(), date: "", time: "", title: "", description: "", location: ""
});
const emptyRestaurant = (): RestaurantItem => ({
  id: newId(), name: "", date: "", time: "", address: "", reservation_ref: "", notes: ""
});

const initForm = (trip: Trip | null): TripFormData => {
  if (!trip) return {
    guest_user_id: "", title: "", destination: "", start_date: "", end_date: "",
    status: "upcoming", notes: "",
    hotel: emptyHotel(),
    flights: [], transfers: [], tickets: [], schedule: [], restaurants: [],
    price_total: "", price_currency: "SEK",
    payment_method: "invoice", payment_due_date: "", payment_status: "unpaid",
    invoice_notes: "", price_breakdown: [],
    booking_checklist: defaultChecklist(),
  };
  return {
    guest_user_id: trip.guest_user_id,
    title: trip.title,
    destination: trip.destination || "",
    start_date: trip.start_date || "",
    end_date: trip.end_date || "",
    status: trip.status,
    notes: trip.notes || "",
    hotel: {
      name: trip.hotel_name || "", address: trip.hotel_address || "",
      stars: trip.hotel_stars?.toString() || "",
      checkin: trip.hotel_checkin || "", checkout: trip.hotel_checkout || "",
      confirmation: trip.hotel_confirmation || "", notes: trip.hotel_notes || "",
    },
    flights: Array.isArray(trip.flights) ? trip.flights.map(f => ({ ...f, id: f.id || newId() })) : [],
    transfers: Array.isArray(trip.transfers) ? trip.transfers.map(t => ({ ...t, id: t.id || newId() })) : [],
    tickets: Array.isArray(trip.tickets) ? trip.tickets.map(t => ({ ...t, id: t.id || newId() })) : [],
    schedule: Array.isArray(trip.schedule) ? trip.schedule.filter((s: any) => s._type !== 'restaurant').map((s: any) => ({ ...s, id: s.id || newId() })) : [],
    restaurants: Array.isArray(trip.schedule) ? trip.schedule.filter((s: any) => s._type === 'restaurant').map((r: any) => ({ ...r, id: r.id || newId() })) : [],
    price_total: trip.price_total?.toString() || "",
    price_currency: trip.price_currency || "SEK",
    payment_method: trip.payment_method || "invoice",
    payment_due_date: trip.payment_due_date || "",
    payment_status: trip.payment_status || "unpaid",
    invoice_notes: trip.invoice_notes || "",
    price_breakdown: Array.isArray(trip.price_breakdown)
      ? trip.price_breakdown.map((r: any) => ({ ...r, id: r.id || newId() }))
      : [],
    booking_checklist: trip.booking_checklist
      ? { ...defaultChecklist(), ...trip.booking_checklist }
      : defaultChecklist(),
  };
};

// ─── Checklist Row ────────────────────────────────────────────────────────────
const ChecklistRow = ({
  label, icon: Icon, item, onChange,
}: {
  label: string;
  icon: React.ElementType;
  item: ChecklistItem;
  onChange: (update: Partial<ChecklistItem>) => void;
}) => (
  <div className={cn(
    "flex items-center justify-between p-3 rounded-lg border transition-colors",
  item.done ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border"
  )}>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange({ done: !item.done })}
        className="flex-shrink-0"
      >
        {item.done
          ? <CheckCircle2 className="h-5 w-5 text-primary" />
          : <Circle className="h-5 w-5 text-muted-foreground" />}
      </button>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className={cn("text-sm font-medium", item.done && "line-through text-muted-foreground")}>
          {label}
        </span>
        {item.done && (
          <span className="text-xs text-primary font-medium">Klart</span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Synlig för kund</span>
      <Switch
        checked={item.visible_to_customer}
        onCheckedChange={v => onChange({ visible_to_customer: v })}
        className="scale-75"
      />
    </div>
  </div>
);

// ─── Checklist Section ────────────────────────────────────────────────────────
const ChecklistSection = ({
  checklist, onChange, trip, onNotifySent, onPaymentConfirmed,
}: {
  checklist: BookingChecklist;
  onChange: (key: string, update: Partial<ChecklistItem>) => void;
  trip: Trip | null;
  onNotifySent: () => void;
  onPaymentConfirmed: () => void;
}) => {
  const { toast } = useToast();
  const [notifying, setNotifying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const ITEMS = [
    { key: "flights", label: "Flyg", icon: Plane },
    { key: "hotel", label: "Hotell", icon: Hotel },
    { key: "transfers", label: "Transfer", icon: Car },
    { key: "tickets", label: "Biljetter & Events", icon: Ticket },
  ];

  const doneCount = ITEMS.filter(i => checklist[i.key]?.done).length;
  const progress = Math.round((doneCount / ITEMS.length) * 100);

  const handleNotify = async () => {
    if (!trip) return;
    setNotifying(true);
    try {
      const { error } = await supabase.from("trips").update({
        customer_notified_at: new Date().toISOString(),
      }).eq("id", trip.id);
      if (error) throw error;
      toast({ title: "Notifikation skickad till kund ✓" });
      onNotifySent();
    } catch (e: any) {
      toast({ title: "Fel", description: e.message, variant: "destructive" });
    } finally {
      setNotifying(false);
    }
  };

  const handlePaymentConfirmed = async () => {
    if (!trip) return;
    setConfirming(true);
    try {
      const newStatus = trip.payment_status === "paid" ? "unpaid" : "paid";
      const { error } = await supabase.from("trips").update({
        payment_status: newStatus,
        payment_confirmed_at: newStatus === "paid" ? new Date().toISOString() : null,
      }).eq("id", trip.id);
      if (error) throw error;
      toast({ title: newStatus === "paid" ? "Betalning bekräftad ✓" : "Betalning avmarkerad" });
      onPaymentConfirmed();
    } catch (e: any) {
      toast({ title: "Fel", description: e.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Bokningsstatus</span>
          <span className="text-muted-foreground">{doneCount}/{ITEMS.length} klara</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {ITEMS.map(item => (
          <ChecklistRow
            key={item.key}
            label={item.label}
            icon={item.icon}
            item={checklist[item.key] || { done: false, visible_to_customer: true, included: true }}
            onChange={update => onChange(item.key, update)}
          />
        ))}
      </div>

      {/* Payment confirmation */}
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Betalning
        </h4>
        {trip ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                Status: <span className={cn(
                  "font-medium",
                  trip.payment_status === "paid" ? "text-primary" :
                  trip.payment_status === "overdue" ? "text-destructive" :
                  "text-muted-foreground"
                )}>
                  {trip.payment_status === "paid" ? "Betald" :
                   trip.payment_status === "partial" ? "Delbetalad" :
                   trip.payment_status === "overdue" ? "Förfallen" : "Obetald"}
                </span>
              </p>
              {trip.payment_confirmed_at && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bekräftad {format(parseISO(trip.payment_confirmed_at), "d MMM yyyy HH:mm", { locale: sv })}
                </p>
              )}
            </div>
            <Button
              variant={trip.payment_status === "paid" ? "default" : "outline"}
              size="sm"
              onClick={handlePaymentConfirmed}
              disabled={confirming}
              className={cn("gap-2", trip.payment_status === "paid" && "bg-primary hover:bg-primary/90")}
            >
              {confirming ? <Loader2 className="h-3 w-3 animate-spin" /> :
                trip.payment_status === "paid"
                  ? <CheckCircle2 className="h-3 w-3" />
                  : <Circle className="h-3 w-3" />}
              {trip.payment_status === "paid" ? "Betald ✓" : "Markera som betald"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Spara resan först för att bekräfta betalning</p>
        )}
      </div>

      {/* Customer notification */}
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          Kundnotifikation
        </h4>
        <p className="text-xs text-muted-foreground">
          Skicka en notifikation till kunden om vad som är bokat. Kunden ser bara de komponenter du markerat som "Synlig för kund".
        </p>
        {trip?.customer_notified_at && (
          <p className="text-xs text-muted-foreground">
            Senast notifierad: {format(parseISO(trip.customer_notified_at), "d MMM yyyy HH:mm", { locale: sv })}
          </p>
        )}
        {trip ? (
          <Button
            onClick={handleNotify}
            disabled={notifying}
            variant="outline"
            className="gap-2 w-full"
          >
            {notifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            {trip.customer_notified_at ? "Skicka notifikation igen" : "Skicka notifikation till kund"}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Spara resan först för att skicka notifikation</p>
        )}
      </div>
    </div>
  );
};

// ─── PDF Upload helper ────────────────────────────────────────────────────────
const useFileUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, folder: string): Promise<{ url: string; name: string } | null> => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${newId()}.${ext}`;
      const { error } = await supabase.storage.from("trip-attachments").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("trip-attachments").getPublicUrl(path);
      return { url: data.publicUrl, name: file.name };
    } catch (e: any) {
      toast({ title: "Uppladdning misslyckades", description: e.message, variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const FlightSection = ({ flights, onChange }: { flights: FlightLeg[]; onChange: (f: FlightLeg[]) => void }) => {
  const { uploadFile, uploading } = useFileUpload();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const update = (id: string, key: keyof FlightLeg, val: string) =>
    onChange(flights.map(f => f.id === id ? { ...f, [key]: val } : f));

  const handleTicketUpload = async (id: string, file: File) => {
    const res = await uploadFile(file, "flights");
    if (res) onChange(flights.map(f => f.id === id ? { ...f, ticket_url: res.url, ticket_name: res.name } : f));
  };

  return (
    <div className="space-y-4">
      {flights.map((f, idx) => (
        <div key={f.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Flygning {idx + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => onChange(flights.filter(x => x.id !== f.id))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Från (IATA)</Label><Input value={f.from} onChange={e => update(f.id, "from", e.target.value)} placeholder="ARN" /></div>
            <div className="space-y-1"><Label className="text-xs">Till (IATA)</Label><Input value={f.to} onChange={e => update(f.id, "to", e.target.value)} placeholder="CDG" /></div>
            <div className="space-y-1"><Label className="text-xs">Flygbolag</Label><Input value={f.airline} onChange={e => update(f.id, "airline", e.target.value)} placeholder="SAS" /></div>
            <div className="space-y-1"><Label className="text-xs">Flygnummer</Label><Input value={f.flight_number} onChange={e => update(f.id, "flight_number", e.target.value)} placeholder="SK1234" /></div>
            <div className="space-y-1"><Label className="text-xs">Avgång</Label><Input type="datetime-local" value={f.departure} onChange={e => update(f.id, "departure", e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Ankomst</Label><Input type="datetime-local" value={f.arrival} onChange={e => update(f.id, "arrival", e.target.value)} /></div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Klass</Label>
              <Select value={f.class} onValueChange={v => update(f.id, "class", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium_economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Ticket upload */}
          <div className="space-y-1">
            <Label className="text-xs">Flygbiljett (PDF)</Label>
            {f.ticket_url ? (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <a href={f.ticket_url} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate max-w-[200px]">{f.ticket_name || "Biljett"}</a>
                <Button variant="ghost" size="sm" onClick={() => update(f.id, "ticket_url", "")}><X className="h-3 w-3" /></Button>
              </div>
            ) : (
              <div>
                <input type="file" accept=".pdf,image/*" className="hidden" ref={el => fileRefs.current[f.id] = el}
                  onChange={async e => { if (e.target.files?.[0]) await handleTicketUpload(f.id, e.target.files[0]); }} />
                <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRefs.current[f.id]?.click()}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                  Ladda upp biljett
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...flights, emptyFlight()])}>
        <Plus className="h-4 w-4 mr-1" /> Lägg till flygning
      </Button>
    </div>
  );
};

const TransferSection = ({ transfers, onChange }: { transfers: Transfer[]; onChange: (t: Transfer[]) => void }) => {
  const update = (id: string, key: keyof Transfer, val: string) =>
    onChange(transfers.map(t => t.id === id ? { ...t, [key]: val } : t));

  return (
    <div className="space-y-4">
      {transfers.map((t, idx) => (
        <div key={t.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Transfer {idx + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => onChange(transfers.filter(x => x.id !== t.id))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Från</Label><Input value={t.from} onChange={e => update(t.id, "from", e.target.value)} placeholder="Arlanda" /></div>
            <div className="space-y-1"><Label className="text-xs">Till</Label><Input value={t.to} onChange={e => update(t.id, "to", e.target.value)} placeholder="Hotell" /></div>
            <div className="space-y-1"><Label className="text-xs">Datum & tid</Label><Input type="datetime-local" value={t.datetime} onChange={e => update(t.id, "datetime", e.target.value)} /></div>
            <div className="space-y-1">
              <Label className="text-xs">Fordon</Label>
              <Select value={t.vehicle} onValueChange={v => update(t.id, "vehicle", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="taxi">Taxi</SelectItem>
                  <SelectItem value="limousine">Limousin</SelectItem>
                  <SelectItem value="shuttle">Shuttle</SelectItem>
                  <SelectItem value="private_car">Privat bil</SelectItem>
                  <SelectItem value="bus">Buss</SelectItem>
                  <SelectItem value="train">Tåg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Anteckningar</Label><Input value={t.notes || ""} onChange={e => update(t.id, "notes", e.target.value)} placeholder="t.ex. Chauffören heter Erik" /></div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...transfers, emptyTransfer()])}>
        <Plus className="h-4 w-4 mr-1" /> Lägg till transfer
      </Button>
    </div>
  );
};

const TicketSection = ({ tickets, onChange }: { tickets: TicketItem[]; onChange: (t: TicketItem[]) => void }) => {
  const { uploadFile, uploading } = useFileUpload();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const update = (id: string, key: keyof TicketItem, val: string) =>
    onChange(tickets.map(t => t.id === id ? { ...t, [key]: val } : t));

  const handleUpload = async (id: string, file: File) => {
    const res = await uploadFile(file, "tickets");
    if (res) onChange(tickets.map(t => t.id === id ? { ...t, file_url: res.url, file_name: res.name } : t));
  };

  return (
    <div className="space-y-4">
      {tickets.map((t, idx) => (
        <div key={t.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Biljett / Event {idx + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => onChange(tickets.filter(x => x.id !== t.id))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">Namn / Event</Label><Input value={t.name} onChange={e => update(t.id, "name", e.target.value)} placeholder="t.ex. Champions League Final" /></div>
            <div className="space-y-1"><Label className="text-xs">Datum</Label><Input type="date" value={t.date} onChange={e => update(t.id, "date", e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Tid</Label><Input type="time" value={t.time} onChange={e => update(t.id, "time", e.target.value)} /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Beskrivning</Label><Input value={t.description || ""} onChange={e => update(t.id, "description", e.target.value)} /></div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Biljettkopia (PDF/Bild)</Label>
            {t.file_url ? (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <a href={t.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate max-w-[200px]">{t.file_name || "Biljettkopia"}</a>
                <Button variant="ghost" size="sm" onClick={() => update(t.id, "file_url", "")}><X className="h-3 w-3" /></Button>
              </div>
            ) : (
              <div>
                <input type="file" accept=".pdf,image/*" className="hidden" ref={el => fileRefs.current[t.id] = el}
                  onChange={async e => { if (e.target.files?.[0]) await handleUpload(t.id, e.target.files[0]); }} />
                <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRefs.current[t.id]?.click()}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                  Ladda upp biljettkopia
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...tickets, emptyTicket()])}>
        <Plus className="h-4 w-4 mr-1" /> Lägg till biljett / event
      </Button>
    </div>
  );
};

const PricingSection = ({ form, onChange }: { form: TripFormData; onChange: (updates: Partial<TripFormData>) => void }) => {
  const totalFromBreakdown = form.price_breakdown.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const updateRow = (id: string, key: keyof PriceRow, val: string) =>
    onChange({ price_breakdown: form.price_breakdown.map(r => r.id === id ? { ...r, [key]: val } : r) });

  return (
    <div className="space-y-5">
      {/* Price breakdown rows */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Prisposter</Label>
        {form.price_breakdown.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <Input placeholder="Beskrivning (t.ex. Flyg tur-retur)" value={r.label}
              onChange={e => updateRow(r.id, "label", e.target.value)} className="flex-1" />
            <Input placeholder="Belopp" type="number" value={r.amount}
              onChange={e => updateRow(r.id, "amount", e.target.value)} className="w-28" />
            <Button variant="ghost" size="sm" onClick={() => onChange({ price_breakdown: form.price_breakdown.filter(x => x.id !== r.id) })}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onChange({ price_breakdown: [...form.price_breakdown, emptyPriceRow()] })}>
          <Plus className="h-4 w-4 mr-1" /> Lägg till prispost
        </Button>
        {form.price_breakdown.length > 0 && (
          <div className="flex justify-between items-center border-t pt-2 font-medium text-sm">
            <span>Summa från poster</span>
            <span>{totalFromBreakdown.toLocaleString("sv-SE")} {form.price_currency}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Totalpris (manuellt)</Label>
          <Input type="number" value={form.price_total} onChange={e => onChange({ price_total: e.target.value })}
            placeholder={totalFromBreakdown > 0 ? totalFromBreakdown.toString() : "0"} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valuta</Label>
          <Select value={form.price_currency} onValueChange={v => onChange({ price_currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SEK">SEK</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Betalningsmetod</Label>
          <Select value={form.payment_method} onValueChange={v => onChange({ payment_method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Faktura</SelectItem>
              <SelectItem value="card">Kortbetalning</SelectItem>
              <SelectItem value="bank_transfer">Banköverföring</SelectItem>
              <SelectItem value="split">Delad betalning</SelectItem>
              <SelectItem value="included">Ingår i paketet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Förfallodatum</Label>
          <Input type="date" value={form.payment_due_date} onChange={e => onChange({ payment_due_date: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Betalningsstatus</Label>
          <Select value={form.payment_status} onValueChange={v => onChange({ payment_status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">Obetald</SelectItem>
              <SelectItem value="partial">Delbetalad</SelectItem>
              <SelectItem value="paid">Betald</SelectItem>
              <SelectItem value="overdue">Förfallen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Fakturanot (visas på fakturan)</Label>
        <Textarea rows={2} value={form.invoice_notes} onChange={e => onChange({ invoice_notes: e.target.value })}
          placeholder="t.ex. Betalas via bankgiro 123-456. Ange referensnummer." />
      </div>
    </div>
  );
};

// ─── Hotel Section ────────────────────────────────────────────────────────────
const HotelSection = ({ hotel, onChange }: { hotel: HotelData; onChange: (updates: Partial<HotelData>) => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1"><Label className="text-xs">Hotellnamn</Label><Input value={hotel.name} onChange={e => onChange({ name: e.target.value })} /></div>
      <div className="space-y-1"><Label className="text-xs">Stjärnor</Label>
        <Select value={hotel.stars || ""} onValueChange={v => onChange({ stars: v })}>
          <SelectTrigger><SelectValue placeholder="–" /></SelectTrigger>
          <SelectContent>
            {[1,2,3,4,5].map(s => <SelectItem key={s} value={s.toString()}>{s} ★</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 space-y-1"><Label className="text-xs">Adress</Label><Input value={hotel.address} onChange={e => onChange({ address: e.target.value })} /></div>
      <div className="space-y-1"><Label className="text-xs">Incheckning</Label><Input type="date" value={hotel.checkin} onChange={e => onChange({ checkin: e.target.value })} /></div>
      <div className="space-y-1"><Label className="text-xs">Utcheckning</Label><Input type="date" value={hotel.checkout} onChange={e => onChange({ checkout: e.target.value })} /></div>
      <div className="space-y-1"><Label className="text-xs">Bokningsreferens</Label><Input value={hotel.confirmation} onChange={e => onChange({ confirmation: e.target.value })} /></div>
      <div className="space-y-1"><Label className="text-xs">Hotellnot</Label><Input value={hotel.notes} onChange={e => onChange({ notes: e.target.value })} /></div>
    </div>
  </div>
);

// ─── Restaurant Section ───────────────────────────────────────────────────────
const RestaurantSection = ({ restaurants, onChange }: { restaurants: RestaurantItem[]; onChange: (r: RestaurantItem[]) => void }) => {
  const update = (id: string, key: keyof RestaurantItem, val: string) =>
    onChange(restaurants.map(r => r.id === id ? { ...r, [key]: val } : r));

  return (
    <div className="space-y-4">
      {restaurants.map((r, idx) => (
        <div key={r.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Restaurang {idx + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => onChange(restaurants.filter(x => x.id !== r.id))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">Restaurangnamn</Label><Input value={r.name} onChange={e => update(r.id, "name", e.target.value)} placeholder="t.ex. Le Bernardin" /></div>
            <div className="space-y-1"><Label className="text-xs">Datum</Label><Input type="date" value={r.date} onChange={e => update(r.id, "date", e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Tid</Label><Input type="time" value={r.time} onChange={e => update(r.id, "time", e.target.value)} /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Adress</Label><Input value={r.address || ""} onChange={e => update(r.id, "address", e.target.value)} placeholder="t.ex. 155 W 51st St, New York" /></div>
            <div className="space-y-1"><Label className="text-xs">Bokningsreferens</Label><Input value={r.reservation_ref || ""} onChange={e => update(r.id, "reservation_ref", e.target.value)} placeholder="t.ex. CONF-12345" /></div>
            <div className="space-y-1"><Label className="text-xs">Anteckningar</Label><Input value={r.notes || ""} onChange={e => update(r.id, "notes", e.target.value)} placeholder="t.ex. Vegetarisk meny bokad" /></div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...restaurants, emptyRestaurant()])}>
        <Plus className="h-4 w-4 mr-1" /> Lägg till restaurang
      </Button>
    </div>
  );
};

// ─── Schedule Section ─────────────────────────────────────────────────────────
const ScheduleSection = ({ schedule, onChange }: { schedule: ScheduleItem[]; onChange: (s: ScheduleItem[]) => void }) => {
  const update = (id: string, key: keyof ScheduleItem, val: string) =>
    onChange(schedule.map(s => s.id === id ? { ...s, [key]: val } : s));

  const sorted = [...schedule].sort((a, b) => {
    const da = a.date + a.time;
    const db = b.date + b.time;
    return da.localeCompare(db);
  });

  return (
    <div className="space-y-4">
      {sorted.map((s, idx) => (
        <div key={s.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Aktivitet {idx + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => onChange(schedule.filter(x => x.id !== s.id))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">Titel</Label><Input value={s.title} onChange={e => update(s.id, "title", e.target.value)} placeholder="t.ex. Match Champions League Final" /></div>
            <div className="space-y-1"><Label className="text-xs">Datum</Label><Input type="date" value={s.date} onChange={e => update(s.id, "date", e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Tid</Label><Input type="time" value={s.time} onChange={e => update(s.id, "time", e.target.value)} /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Plats / Lokal</Label><Input value={s.location || ""} onChange={e => update(s.id, "location", e.target.value)} placeholder="t.ex. Stade de France" /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Beskrivning</Label><Input value={s.description || ""} onChange={e => update(s.id, "description", e.target.value)} /></div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...schedule, emptyScheduleItem()])}>
        <Plus className="h-4 w-4 mr-1" /> Lägg till aktivitet
      </Button>
    </div>
  );
};

// ─── Main Dialog ──────────────────────────────────────────────────────────────
export const TripFormDialog = ({
  open, onOpenChange, trip, onSaved
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  trip: Trip | null; onSaved: () => void;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TripFormData>(() => initForm(trip));

  // Re-init when trip changes
  const prevTripId = useRef(trip?.id);
  if (prevTripId.current !== trip?.id) {
    prevTripId.current = trip?.id;
    setForm(initForm(trip));
  }

  const set = (updates: Partial<TripFormData>) => setForm(f => ({ ...f, ...updates }));
  const setHotel = (updates: Partial<HotelData>) => set({ hotel: { ...form.hotel, ...updates } });

  const updateChecklist = (key: string, update: Partial<ChecklistItem>) => {
    setForm(f => {
      const existing = f.booking_checklist[key] || { done: false, visible_to_customer: true, included: true };
      return {
        ...f,
        booking_checklist: {
          ...f.booking_checklist,
          [key]: { ...existing, ...update } as ChecklistItem,
        }
      };
    });
  };

  const effectiveTotal = form.price_total
    ? parseFloat(form.price_total)
    : form.price_breakdown.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const handleSave = async () => {
    if (!form.guest_user_id || !form.title) {
      toast({ title: "Fyll i resenärens ID och resans titel", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      guest_user_id: form.guest_user_id,
      title: form.title,
      destination: form.destination || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      notes: form.notes || null,
      hotel_name: form.hotel.name || null,
      hotel_address: form.hotel.address || null,
      hotel_checkin: form.hotel.checkin || null,
      hotel_checkout: form.hotel.checkout || null,
      hotel_confirmation: form.hotel.confirmation || null,
      hotel_notes: form.hotel.notes || null,
      hotel_stars: form.hotel.stars ? parseInt(form.hotel.stars) : null,
      flights: form.flights,
      transfers: form.transfers,
      schedule: [
        ...form.schedule.map(s => ({ ...s, _type: 'activity' })),
        ...form.restaurants.map(r => ({ ...r, _type: 'restaurant' })),
      ],
      tickets: form.tickets,
      price_total: effectiveTotal || null,
      price_currency: form.price_currency,
      payment_method: form.payment_method,
      payment_due_date: form.payment_due_date || null,
      payment_status: form.payment_status,
      invoice_notes: form.invoice_notes || null,
      price_breakdown: form.price_breakdown,
      booking_checklist: form.booking_checklist,
      created_by_admin_id: user?.id,
    };

    try {
      if (trip) {
        const { error } = await supabase.from("trips").update(payload).eq("id", trip.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("trips").insert(payload);
        if (error) throw error;
      }
      toast({ title: trip ? "Resa uppdaterad ✓" : "Resa skapad ✓" });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Fel", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{trip ? "Redigera resa" : "Skapa ny resa"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basics" className="mt-2">
          <TabsList className="flex flex-wrap gap-1 h-auto w-full justify-start bg-muted p-1 rounded-lg">
            <TabsTrigger value="basics" className="gap-1 text-xs"><Info className="h-3 w-3" />Grundinfo</TabsTrigger>
            {form.booking_checklist.hotel?.included !== false && (
              <TabsTrigger value="hotel" className="gap-1 text-xs relative">
                <Hotel className="h-3 w-3" />Hotell
                {form.booking_checklist.hotel?.done && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />}
              </TabsTrigger>
            )}
            {form.booking_checklist.flights?.included !== false && (
              <TabsTrigger value="flights" className="gap-1 text-xs relative">
                <Plane className="h-3 w-3" />Flyg
                {form.booking_checklist.flights?.done && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />}
              </TabsTrigger>
            )}
            {form.booking_checklist.transfers?.included !== false && (
              <TabsTrigger value="transfers" className="gap-1 text-xs relative">
                <Car className="h-3 w-3" />Transfer
                {form.booking_checklist.transfers?.done && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />}
              </TabsTrigger>
            )}
            {form.booking_checklist.tickets?.included !== false && (
              <TabsTrigger value="tickets" className="gap-1 text-xs relative">
                <Ticket className="h-3 w-3" />Biljetter
                {form.booking_checklist.tickets?.done && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />}
              </TabsTrigger>
            )}
            {form.booking_checklist.restaurants?.included && (
              <TabsTrigger value="restaurants" className="gap-1 text-xs relative">
                <span className="text-xs">🍽</span>Restauranger
                {form.booking_checklist.restaurants?.done && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />}
              </TabsTrigger>
            )}
            {form.booking_checklist.schedule?.included && (
              <TabsTrigger value="schedule" className="gap-1 text-xs relative">
                <span className="text-xs">📅</span>Schema
                {form.booking_checklist.schedule?.done && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />}
              </TabsTrigger>
            )}
            {form.booking_checklist.payment?.included !== false && (
              <TabsTrigger value="pricing" className="gap-1 text-xs relative">
                <DollarSign className="h-3 w-3" />Betalning
                {form.booking_checklist.payment?.done && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />}
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Grundinfo ── */}
          <TabsContent value="basics" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Resenär *</Label>
                <CustomerPicker
                  value={form.guest_user_id}
                  onChange={id => set({ guest_user_id: id })}
                />
                {form.guest_user_id && (
                  <p className="text-[10px] text-muted-foreground font-mono">ID: {form.guest_user_id}</p>
                )}
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Resans titel *</Label>
                <Input value={form.title} onChange={e => set({ title: e.target.value })} placeholder="t.ex. Champions League Final – Paris 2026" />
              </div>
              <div className="space-y-1">
                <Label>Destination</Label>
                <Input value={form.destination} onChange={e => set({ destination: e.target.value })} placeholder="t.ex. Paris, Frankrike" />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set({ status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Kommande</SelectItem>
                    <SelectItem value="ongoing">Pågående</SelectItem>
                    <SelectItem value="completed">Avslutad</SelectItem>
                    <SelectItem value="cancelled">Inställd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Startdatum</Label>
                <Input type="date" value={form.start_date} onChange={e => set({ start_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Slutdatum</Label>
                <Input type="date" value={form.end_date} onChange={e => set({ end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Interna anteckningar</Label>
              <Textarea rows={2} value={form.notes} onChange={e => set({ notes: e.target.value })} placeholder="Visas ej för resenären" />
            </div>

            {/* Section toggles */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Resans innehåll – välj vad som ingår</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "hotel", label: "Hotell", icon: <Hotel className="h-4 w-4" /> },
                  { key: "flights", label: "Flyg", icon: <Plane className="h-4 w-4" /> },
                  { key: "transfers", label: "Transfer", icon: <Car className="h-4 w-4" /> },
                  { key: "tickets", label: "Biljetter", icon: <Ticket className="h-4 w-4" /> },
                  { key: "restaurants", label: "Restauranger", icon: <span>🍽</span> },
                  { key: "schedule", label: "Schema", icon: <span>📅</span> },
                  { key: "payment", label: "Betalning", icon: <DollarSign className="h-4 w-4" /> },
                ].map(({ key, label, icon }) => {
                  const item = form.booking_checklist[key];
                  const isIncluded = item?.included !== false;
                  return (
                    <div key={key} className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg border transition-colors",
                      isIncluded ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border"
                    )}>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{icon}</span>
                        <span className={cn("font-medium", !isIncluded && "text-muted-foreground")}>{label}</span>
                      </div>
                      <Switch
                        checked={isIncluded}
                        onCheckedChange={v => updateChecklist(key, { included: v })}
                        className="scale-75"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-section checklist */}
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Checklista – markera vad som är klart</h4>
              <div className="space-y-1.5">
                {[
                  { key: "hotel", label: "Hotell", icon: Hotel },
                  { key: "flights", label: "Flyg", icon: Plane },
                  { key: "transfers", label: "Transfer", icon: Car },
                  { key: "tickets", label: "Biljetter", icon: Ticket },
                  { key: "restaurants", label: "Restauranger" },
                  { key: "schedule", label: "Schema" },
                  { key: "payment", label: "Betalning", icon: DollarSign },
                ].filter(({ key }) => form.booking_checklist[key]?.included !== false && (
                  key !== "restaurants" && key !== "schedule"
                    ? true
                    : form.booking_checklist[key]?.included
                )).map(({ key, label, icon: Icon }) => {
                  const item = form.booking_checklist[key];
                  const done = item?.done ?? false;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateChecklist(key, { done: !done })}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors",
                        done ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border hover:bg-muted/50"
                      )}
                    >
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <span className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>{label}</span>
                      {done && <span className="text-xs text-primary font-medium ml-auto">Klart ✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── Hotell ── */}
          <TabsContent value="hotel" className="pt-4">
            <HotelSection hotel={form.hotel} onChange={setHotel} />
          </TabsContent>

          {/* ── Flyg ── */}
          <TabsContent value="flights" className="pt-4">
            <FlightSection flights={form.flights} onChange={flights => set({ flights })} />
          </TabsContent>

          {/* ── Transfer ── */}
          <TabsContent value="transfers" className="pt-4">
            <TransferSection transfers={form.transfers} onChange={transfers => set({ transfers })} />
          </TabsContent>

          {/* ── Biljetter ── */}
          <TabsContent value="tickets" className="pt-4">
            <TicketSection tickets={form.tickets} onChange={tickets => set({ tickets })} />
          </TabsContent>

          {/* ── Restauranger ── */}
          <TabsContent value="restaurants" className="pt-4">
            <RestaurantSection restaurants={form.restaurants} onChange={restaurants => set({ restaurants })} />
          </TabsContent>

          {/* ── Schema ── */}
          <TabsContent value="schedule" className="pt-4">
            <ScheduleSection schedule={form.schedule} onChange={schedule => set({ schedule })} />
          </TabsContent>

          {/* ── Betalning ── */}
          <TabsContent value="pricing" className="pt-4">
            <PricingSection form={form} onChange={set} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {trip ? "Spara ändringar" : "Skapa resa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TripFormDialog;
