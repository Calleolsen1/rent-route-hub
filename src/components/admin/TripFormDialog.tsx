import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, Trash2, Plane, Car, Hotel, Ticket, Info,
  Upload, FileText, X, DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  price_total: string;
  price_currency: string;
  payment_method: string;
  payment_due_date: string;
  payment_status: string;
  invoice_notes: string;
  price_breakdown: PriceRow[];
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
  created_at: string;
  profiles?: { first_name: string | null; last_name: string | null; email: string } | null;
};

const newId = () => crypto.randomUUID();

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

const initForm = (trip: Trip | null): TripFormData => {
  if (!trip) return {
    guest_user_id: "", title: "", destination: "", start_date: "", end_date: "",
    status: "upcoming", notes: "",
    hotel: emptyHotel(),
    flights: [], transfers: [], tickets: [],
    price_total: "", price_currency: "SEK",
    payment_method: "invoice", payment_due_date: "", payment_status: "unpaid",
    invoice_notes: "", price_breakdown: [],
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
    price_total: trip.price_total?.toString() || "",
    price_currency: trip.price_currency || "SEK",
    payment_method: trip.payment_method || "invoice",
    payment_due_date: trip.payment_due_date || "",
    payment_status: trip.payment_status || "unpaid",
    invoice_notes: trip.invoice_notes || "",
    price_breakdown: Array.isArray(trip.price_breakdown)
      ? trip.price_breakdown.map((r: any) => ({ ...r, id: r.id || newId() }))
      : [],
  };
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
        {form.price_breakdown.map((r, idx) => (
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
      schedule: [],
      tickets: form.tickets,
      price_total: effectiveTotal || null,
      price_currency: form.price_currency,
      payment_method: form.payment_method,
      payment_due_date: form.payment_due_date || null,
      payment_status: form.payment_status,
      invoice_notes: form.invoice_notes || null,
      price_breakdown: form.price_breakdown,
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
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="basics" className="gap-1 text-xs"><Info className="h-3 w-3" />Grundinfo</TabsTrigger>
            <TabsTrigger value="flights" className="gap-1 text-xs"><Plane className="h-3 w-3" />Flyg</TabsTrigger>
            <TabsTrigger value="transfers" className="gap-1 text-xs"><Car className="h-3 w-3" />Transfer</TabsTrigger>
            <TabsTrigger value="tickets" className="gap-1 text-xs"><Ticket className="h-3 w-3" />Biljetter</TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1 text-xs"><DollarSign className="h-3 w-3" />Betalning</TabsTrigger>
          </TabsList>

          {/* ── Grundinfo ── */}
          <TabsContent value="basics" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Resenärens User-ID *</Label>
                <Input value={form.guest_user_id} onChange={e => set({ guest_user_id: e.target.value })} placeholder="UUID från resenärslistan" />
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

            {/* Hotell */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2"><Hotel className="h-4 w-4 text-muted-foreground" /><h4 className="font-medium text-sm">Hotell</h4></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Hotellnamn</Label><Input value={form.hotel.name} onChange={e => setHotel({ name: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Stjärnor</Label>
                  <Select value={form.hotel.stars || ""} onValueChange={v => setHotel({ stars: v })}>
                    <SelectTrigger><SelectValue placeholder="–" /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(s => <SelectItem key={s} value={s.toString()}>{s} ★</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1"><Label className="text-xs">Adress</Label><Input value={form.hotel.address} onChange={e => setHotel({ address: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Incheckning</Label><Input type="date" value={form.hotel.checkin} onChange={e => setHotel({ checkin: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Utcheckning</Label><Input type="date" value={form.hotel.checkout} onChange={e => setHotel({ checkout: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Bokningsreferens</Label><Input value={form.hotel.confirmation} onChange={e => setHotel({ confirmation: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Hotellnot</Label><Input value={form.hotel.notes} onChange={e => setHotel({ notes: e.target.value })} /></div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Interna anteckningar</Label>
              <Textarea rows={2} value={form.notes} onChange={e => set({ notes: e.target.value })} placeholder="Visas ej för resenären" />
            </div>
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
