import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Eye,
  Send,
  Plus,
  FileText,
  Trash2,
  Pencil,
  Save,
} from "lucide-react";
import {
  formatSek,
  ITEM_LABEL,
  STATUS_LABEL,
  type BookingStatus,
  type ItemType,
} from "./shared";

type Booking = {
  id: string;
  booking_number: string | null;
  customer_id: string;
  title: string;
  destination: string | null;
  depart_date: string | null;
  return_date: string | null;
  travellers_count: number;
  status: BookingStatus;
  notes: string | null;
  internal_notes: string | null;
};

type Item = {
  id: string;
  booking_id: string;
  item_type: ItemType;
  description: string;
  supplier: string | null;
  qty: number;
  cost_sek: number;
  sale_sek: number;
  hotel_id: string | null;
  check_in: string | null;
  check_out: string | null;
  room_type: string | null;
  rooms: number | null;
  airline: string | null;
  flight_number: string | null;
  from_airport: string | null;
  to_airport: string | null;
  depart_at: string | null;
  is_round_trip: boolean | null;
  return_flight_number: string | null;
  return_depart_at: string | null;
  booking_reference: string | null;
  event_name: string | null;
  ticket_category: string | null;
  transfer_from: string | null;
  transfer_to: string | null;
  transfer_at: string | null;
  vehicle: string | null;
  notes: string | null;
};

type Traveller = {
  id: string;
  booking_id: string;
  full_name: string;
  date_of_birth: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
};

type DocRow = {
  id: string;
  doc_type: string;
  recipient_email: string;
  subject: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
  html: string | null;
  invoice_id: string | null;
  quote_id: string | null;
};

const DOC_LABEL: Record<string, string> = {
  confirmation: "Bokningsbekräftelse",
  quote: "Offert",
  invoice: "Faktura",
};

const emptyItem = (booking_id: string): Partial<Item> => ({
  booking_id,
  item_type: "hotel",
  description: "",
  qty: 1,
  cost_sek: 0,
  sale_sek: 0,
});

export default function BackofficeBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [hotels, setHotels] = useState<{ id: string; name: string; city: string | null }[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [itemOpen, setItemOpen] = useState(false);
  const [itemDraft, setItemDraft] = useState<Partial<Item>>({});
  const [newHotel, setNewHotel] = useState(false);
  const [hotelDraft, setHotelDraft] = useState({ name: "", city: "", address_line1: "" });
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteTitle, setQuoteTitle] = useState("");
  const [quoteIntro, setQuoteIntro] = useState("");
  const [quoteExpiry, setQuoteExpiry] = useState("");
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quotePreview, setQuotePreview] = useState<string | null>(null);
  const [confirmPreview, setConfirmPreview] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docView, setDocView] = useState<DocRow | null>(null);
  const [travOpen, setTravOpen] = useState(false);
  const [travDraft, setTravDraft] = useState<Partial<Traveller>>({});

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    await supabase.rpc("complete_past_bookings");
    const { data: b, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
    if (error || !b) {
      toast.error(error?.message ?? "Bokningen hittades inte");
      setLoading(false);
      return;
    }
    setBooking(b as Booking);
    const [{ data: c }, { data: it }, { data: tr }, { data: h }, { data: inv }, { data: dc }] =
      await Promise.all([
      supabase.from("customers").select("*").eq("id", (b as Booking).customer_id).maybeSingle(),
      supabase.from("booking_items").select("*").eq("booking_id", id).order("sort_order"),
      supabase.from("booking_travellers").select("*").eq("booking_id", id).order("full_name"),
      supabase.from("hotels").select("id, name, city").order("name"),
      supabase.from("invoices").select("*").eq("booking_id", id).order("created_at"),
      supabase
        .from("booking_documents")
        .select("id, doc_type, recipient_email, subject, status, error_message, sent_at, html, invoice_id, quote_id")
        .eq("booking_id", id)
        .order("sent_at", { ascending: false }),
    ]);
    setCustomer(c);
    setItems((it ?? []) as Item[]);
    setTravellers((tr ?? []) as Traveller[]);
    setHotels((h ?? []) as any);
    setInvoices(inv ?? []);
    setDocs((dc ?? []) as DocRow[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saleTotal = items.reduce((s, i) => s + Number(i.sale_sek) * i.qty, 0);
  const costTotal = items.reduce((s, i) => s + Number(i.cost_sek) * i.qty, 0);

  const saveBooking = async (patch: Partial<Booking>) => {
    if (!booking) return;
    setBooking({ ...booking, ...patch });
    const { error } = await supabase.from("bookings").update(patch).eq("id", booking.id);
    if (error) toast.error(error.message);
  };

  const buildDescription = (d: Partial<Item>): string => {
    if (d.description?.trim()) return d.description.trim();
    switch (d.item_type) {
      case "hotel": {
        const h = hotels.find((x) => x.id === d.hotel_id);
        return h?.name ?? d.room_type ?? "Hotell";
      }
      case "flight": {
        const route =
          d.from_airport && d.to_airport
            ? `${d.from_airport}${d.is_round_trip ? "⇄" : "–"}${d.to_airport}`
            : null;
        const base =
          [d.airline, d.flight_number, route].filter(Boolean).join(" ") || "Flyg";
        return d.is_round_trip ? `${base} (tur och retur)` : base;
      }
      case "ticket":
        return [d.event_name, d.ticket_category].filter(Boolean).join(", ") || "Biljett";
      case "transfer":
        return [d.transfer_from, d.transfer_to].filter(Boolean).join(" – ") || "Transfer";
      default:
        return "Rad";
    }
  };

  const saveItem = async () => {
    const { id: itemId, ...rest } = itemDraft as Item;
    const payload = { ...rest, booking_id: booking!.id, description: buildDescription(itemDraft) };
    const { error } = itemId
      ? await supabase.from("booking_items").update(payload).eq("id", itemId)
      : await supabase.from("booking_items").insert(payload);
    if (error) return toast.error(error.message);
    setItemOpen(false);
    load();
  };

  const saveHotel = async () => {
    if (!hotelDraft.name.trim()) return toast.error("Hotellets namn krävs");
    const { data, error } = await supabase
      .from("hotels")
      .insert({
        name: hotelDraft.name,
        city: hotelDraft.city || null,
        address_line1: hotelDraft.address_line1 || null,
      })
      .select("id, name, city")
      .single();
    if (error || !data) return toast.error(error?.message ?? "Kunde inte spara hotellet");
    setHotels((p) => [...p, data as any].sort((a, b) => a.name.localeCompare(b.name)));
    setItemDraft((d) => ({
      ...d,
      hotel_id: data.id,
      description: d.description || data.name,
    }));
    setHotelDraft({ name: "", city: "", address_line1: "" });
    setNewHotel(false);
    toast.success("Hotellet är tillagt i registret");
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase.from("booking_items").delete().eq("id", itemId);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((i) => i.id !== itemId));
  };

  const saveTraveller = async () => {
    if (!travDraft.full_name?.trim()) return toast.error("Namn krävs");
    const { id: tid, ...rest } = travDraft as Traveller;
    const payload = { ...rest, booking_id: booking!.id };
    const { error } = tid
      ? await supabase.from("booking_travellers").update(payload).eq("id", tid)
      : await supabase.from("booking_travellers").insert(payload);
    if (error) return toast.error(error.message);
    setTravOpen(false);
    load();
  };

  const removeTraveller = async (tid: string) => {
    const { error } = await supabase.from("booking_travellers").delete().eq("id", tid);
    if (error) return toast.error(error.message);
    setTravellers((p) => p.filter((t) => t.id !== tid));
  };

  const fnError = async (error: any, data: any, fallback: string) => {
    let msg = (data as any)?.error ?? error?.message ?? fallback;
    try {
      const body = await error?.context?.json?.();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    return msg;
  };

  // Older log rows were written before we started saving the email body — in
  // that case we rebuild the document with the same preview endpoints.
  const openDoc = async (d: DocRow) => {
    if (d.html) return setDocView(d);
    setBusy(true);
    try {
      let fn = "";
      let body: Record<string, unknown> = {};
      if (d.doc_type === "confirmation") {
        fn = "send-booking-confirmation";
        body = { booking_id: booking!.id, preview: true };
      } else if (d.doc_type === "invoice" && d.invoice_id) {
        fn = "send-booking-invoice";
        body = { invoice_id: d.invoice_id, preview: true };
      } else if (d.doc_type === "quote" && d.quote_id) {
        fn = "send-quote-email";
        body = { quote_id: d.quote_id, preview: true };
      } else {
        throw new Error("Dokumentet kan inte visas");
      }
      const { data, error } = await supabase.functions.invoke(fn, { body });
      if (error || (data as any)?.error) {
        throw new Error(await fnError(error, data, "Kunde inte visa dokumentet"));
      }
      setDocView({ ...d, html: (data as any).html });
    } catch (e: any) {
      toast.error(e.message ?? "Något gick fel");
    } finally {
      setBusy(false);
    }
  };

  const previewConfirmation = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-booking-confirmation", {
        body: { booking_id: booking!.id, preview: true },
      });
      if (error || (data as any)?.error) {
        throw new Error(await fnError(error, data, "Kunde inte visa bekräftelsen"));
      }
      setConfirmPreview((data as any).html);
    } catch (e: any) {
      toast.error(e.message ?? "Något gick fel");
    } finally {
      setBusy(false);
    }
  };

  const sendConfirmation = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("send-booking-confirmation", {
      body: { booking_id: booking!.id },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      return toast.error(await fnError(error, data, "Bekräftelsen kunde inte skickas"));
    }
    setConfirmPreview(null);
    toast.success("Bekräftelsen är skickad");
    load();
  };

  const openQuote = () => {
    if (items.length === 0) return toast.error("Lägg till minst en rad först");
    const name = customer?.contact_name || customer?.company_name || "";
    setQuoteTitle(booking!.title);
    setQuoteIntro(
      `Hej ${name.split(" ")[0] || ""},\n\nNedan följer vårt förslag. Hör av dig om något ska justeras.`.trim(),
    );
    setQuoteExpiry(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    setQuoteId(null);
    setQuotePreview(null);
    setQuoteOpen(true);
  };

  // Creates the draft quote (or updates the existing draft) so it can be
  // previewed and sent.
  const saveQuoteDraft = async (): Promise<string> => {
    if (!customer?.email) throw new Error("Kunden saknar e-postadress");
    if (!quoteTitle.trim()) throw new Error("Titel krävs");
    const payload = {
      customer_email: customer.email,
      customer_name: customer.contact_name || customer.company_name || null,
      title: quoteTitle.trim(),
      intro_message: quoteIntro.trim() || null,
      total_sek: saleTotal,
      currency: "SEK",
      expires_at: new Date(quoteExpiry + "T23:59:59").toISOString(),
    };

    let id = quoteId;
    if (id) {
      const { error } = await supabase.from("quotes").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      await supabase.from("quote_items").delete().eq("quote_id", id);
    } else {
      const { data, error } = await supabase
        .from("quotes")
        .insert({ ...payload, status: "draft" })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Kunde inte spara offerten");
      id = data.id;
      setQuoteId(id);
    }

    const { error: iErr } = await supabase.from("quote_items").insert(
      items.map((i, idx) => ({
        quote_id: id!,
        description: `${ITEM_LABEL[i.item_type]}: ${i.description}`,
        qty: i.qty,
        unit_price_sek: i.sale_sek,
        sort_order: idx,
      })),
    );
    if (iErr) throw new Error(iErr.message);
    return id!;
  };

  const previewQuote = async () => {
    setBusy(true);
    try {
      const id = await saveQuoteDraft();
      const { data, error } = await supabase.functions.invoke("send-quote-email", {
        body: { quote_id: id, preview: true },
      });
      if (error || (data as any)?.error) {
        throw new Error(error?.message ?? (data as any)?.error ?? "Kunde inte visa offerten");
      }
      setQuotePreview((data as any).html);
    } catch (e: any) {
      toast.error(e.message ?? "Något gick fel");
    } finally {
      setBusy(false);
    }
  };

  const sendQuote = async () => {
    setBusy(true);
    try {
      const id = await saveQuoteDraft();
      const { error: sErr, data: sData } = await supabase.functions.invoke("send-quote-email", {
        body: { quote_id: id, booking_id: booking!.id },
      });
      if (sErr || (sData as any)?.error) {
        throw new Error(sErr?.message ?? (sData as any)?.error ?? "Kunde inte skicka mejl");
      }
      toast.success(`Offerten är skickad till ${customer.email}`);
      setQuoteOpen(false);
      setQuotePreview(null);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Något gick fel");
    } finally {
      setBusy(false);
    }
  };

  const createInvoice = async () => {
    if (items.length === 0) return toast.error("Lägg till minst en rad först");
    setBusy(true);
    const vatRate = 25;
    const subtotal = saleTotal;
    const vat = Math.round(subtotal * (vatRate / 100));
    const { data: inv, error } = await supabase
      .from("invoices")
      .insert({
        booking_id: booking!.id,
        customer_id: booking!.customer_id,
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        vat_rate: vatRate,
        subtotal_sek: subtotal,
        vat_sek: vat,
        total_sek: subtotal + vat,
        reference: booking!.booking_number,
      })
      .select()
      .single();
    if (error || !inv) {
      setBusy(false);
      return toast.error(error?.message ?? "Kunde inte skapa fakturan");
    }
    await supabase.from("invoice_items").insert(
      items.map((i, idx) => ({
        invoice_id: inv.id,
        description: `${ITEM_LABEL[i.item_type]}: ${i.description}`,
        qty: i.qty,
        unit_price_sek: i.sale_sek,
        sort_order: idx,
      })),
    );
    setBusy(false);
    toast.success("Fakturaunderlag skapat");
    navigate(`/admin/backoffice/fakturor?invoice=${inv.id}`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!booking) return <div className="p-8 text-muted-foreground">Bokningen hittades inte.</div>;

  return (
    <div className="p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/admin/backoffice/bokningar">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Alla bokningar
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl">{booking.title}</h1>
            <Badge variant="secondary">{STATUS_LABEL[booking.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {booking.booking_number} · {customer?.company_name || customer?.contact_name} ·{" "}
            {customer?.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={booking.status}
            onValueChange={(v) => saveBooking({ status: v as BookingStatus })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={previewConfirmation} disabled={busy}>
            <Mail className="mr-2 h-4 w-4" />
            Skicka bekräftelse
          </Button>
          <Button variant="outline" onClick={openQuote} disabled={busy}>
            <Send className="mr-2 h-4 w-4" />
            Skicka offert
          </Button>
          <Button onClick={createInvoice} disabled={busy}>
            <FileText className="mr-2 h-4 w-4" />
            Skapa faktura
          </Button>
        </div>
      </div>

      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Skicka offert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Skickas till {customer?.email}. Kunden får en länk där offerten kan granskas och
              betalas.
            </p>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Titel
              </label>
              <Input
                value={quoteTitle}
                onChange={(e) => setQuoteTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Meddelande
              </label>
              <Textarea
                rows={4}
                value={quoteIntro}
                onChange={(e) => setQuoteIntro(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Gäller till och med
              </label>
              <Input
                type="date"
                value={quoteExpiry}
                onChange={(e) => setQuoteExpiry(e.target.value)}
                className="mt-1 max-w-[200px]"
              />
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                Rader från bokningen
              </div>
              {items.map((i) => (
                <div key={i.id} className="flex justify-between py-1">
                  <span>
                    {ITEM_LABEL[i.item_type]}: {i.description} × {i.qty}
                  </span>
                  <span>{formatSek(i.sale_sek * i.qty)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t pt-2 font-medium">
                <span>Totalt</span>
                <span>{formatSek(saleTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuoteOpen(false)}>
              Avbryt
            </Button>
            <Button variant="outline" onClick={previewQuote} disabled={busy}>
              <Eye className="mr-2 h-4 w-4" />
              Förhandsgranska mejl
            </Button>
            <Button onClick={sendQuote} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Skicka offert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmPreview} onOpenChange={(o) => !o && setConfirmPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Så här ser bekräftelsen ut</DialogTitle>
          </DialogHeader>
          <iframe
            title="Förhandsgranskning av bekräftelse"
            srcDoc={confirmPreview ?? ""}
            className="h-[60vh] w-full rounded-md border border-border bg-white"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmPreview(null)}>
              Stäng
            </Button>
            <Button onClick={sendConfirmation} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Skicka bekräftelse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!quotePreview} onOpenChange={(o) => !o && setQuotePreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Så här ser mejlet ut</DialogTitle>
          </DialogHeader>
          <iframe
            title="Förhandsgranskning av offert"
            srcDoc={quotePreview ?? ""}
            className="h-[60vh] w-full rounded-md border border-border bg-white"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuotePreview(null)}>
              Stäng
            </Button>
            <Button onClick={sendQuote} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Skicka offert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Försäljning</p>
          <p className="text-xl font-medium">{formatSek(saleTotal)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Inköp</p>
          <p className="text-xl font-medium">{formatSek(costTotal)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Vinst</p>
          <p className="text-xl font-medium">{formatSek(saleTotal - costTotal)}</p>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Innehåll</TabsTrigger>
          <TabsTrigger value="travellers">Resenärer ({travellers.length})</TabsTrigger>
          <TabsTrigger value="details">Uppgifter</TabsTrigger>
          <TabsTrigger value="invoices">Fakturor ({invoices.length})</TabsTrigger>
          <TabsTrigger value="docs">Skickat ({docs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="mt-4">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Skickat</th>
                  <th className="px-4 py-3">Dokument</th>
                  <th className="px-4 py-3">Mottagare</th>
                  <th className="px-4 py-3">Ämne</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-t border-border">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(d.sent_at).toLocaleString("sv-SE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">{DOC_LABEL[d.doc_type] ?? d.doc_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.recipient_email}</td>
                    <td className="px-4 py-3">{d.subject ?? "—"}</td>
                    <td className="px-4 py-3">
                      {d.status === "sent" ? (
                        <Badge variant="secondary">Skickat</Badge>
                      ) : (
                        <Badge variant="destructive" title={d.error_message ?? ""}>
                          Misslyckades
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDoc(d)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Inget har skickats ännu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-4 space-y-3">
          <Button
            size="sm"
            onClick={() => {
              setItemDraft(emptyItem(booking.id));
              setItemOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Lägg till rad
          </Button>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Typ</th>
                  <th className="px-4 py-3">Beskrivning</th>
                  <th className="px-4 py-3">Leverantör</th>
                  <th className="px-4 py-3 text-right">Antal</th>
                  <th className="px-4 py-3 text-right">Inköp</th>
                  <th className="px-4 py-3 text-right">Pris</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="px-4 py-3">{ITEM_LABEL[i.item_type]}</td>
                    <td className="px-4 py-3">{i.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.supplier ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{i.qty}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatSek(i.cost_sek)}
                    </td>
                    <td className="px-4 py-3 text-right">{formatSek(i.sale_sek)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setItemDraft(i);
                          setItemOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeItem(i.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Inga rader ännu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="travellers" className="mt-4 space-y-3">
          <Button
            size="sm"
            onClick={() => {
              setTravDraft({});
              setTravOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Lägg till resenär
          </Button>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Namn</th>
                  <th className="px-4 py-3">Födelsedatum</th>
                  <th className="px-4 py-3">Pass</th>
                  <th className="px-4 py-3">Giltigt t.o.m.</th>
                  <th className="px-4 py-3">Nationalitet</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {travellers.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-3">{t.full_name}</td>
                    <td className="px-4 py-3">{t.date_of_birth ?? "—"}</td>
                    <td className="px-4 py-3">{t.passport_number ?? "—"}</td>
                    <td className="px-4 py-3">{t.passport_expiry ?? "—"}</td>
                    <td className="px-4 py-3">{t.nationality ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTravDraft(t);
                          setTravOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeTraveller(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {travellers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Inga resenärer ännu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-4 max-w-2xl space-y-3">
          <Input
            value={booking.title}
            onChange={(e) => setBooking({ ...booking, title: e.target.value })}
            placeholder="Titel"
          />
          <Input
            value={booking.destination ?? ""}
            onChange={(e) => setBooking({ ...booking, destination: e.target.value })}
            placeholder="Destination"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Avresa</label>
              <Input
                type="date"
                value={booking.depart_date ?? ""}
                onChange={(e) => setBooking({ ...booking, depart_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Hemkomst</label>
              <Input
                type="date"
                value={booking.return_date ?? ""}
                onChange={(e) => setBooking({ ...booking, return_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Antal resenärer</label>
            <Input
              type="number"
              min={0}
              value={booking.travellers_count}
              onChange={(e) =>
                setBooking({ ...booking, travellers_count: Number(e.target.value) })
              }
            />
          </div>
          <Textarea
            rows={3}
            placeholder="Text till kunden (visas i bekräftelsen)"
            value={booking.notes ?? ""}
            onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
          />
          <Textarea
            rows={3}
            placeholder="Interna anteckningar"
            value={booking.internal_notes ?? ""}
            onChange={(e) => setBooking({ ...booking, internal_notes: e.target.value })}
          />
          <Button
            onClick={() =>
              saveBooking({
                title: booking.title,
                destination: booking.destination,
                depart_date: booking.depart_date || null,
                return_date: booking.return_date || null,
                travellers_count: booking.travellers_count,
                notes: booking.notes,
                internal_notes: booking.internal_notes,
              }).then(() => toast.success("Sparat"))
            }
          >
            <Save className="mr-2 h-4 w-4" />
            Spara
          </Button>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          {invoices.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Ingen faktura skapad ännu.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>
                    {inv.invoice_number} · förfaller {inv.due_date}
                  </span>
                  <span className="flex items-center gap-3">
                    {formatSek(inv.total_sek)}
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/admin/backoffice/fakturor?invoice=${inv.id}`}>Öppna</Link>
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {/* Item dialog */}
      <Dialog open={!!docView} onOpenChange={(o) => !o && setDocView(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {docView ? DOC_LABEL[docView.doc_type] ?? docView.doc_type : ""} —{" "}
              {docView?.recipient_email}
            </DialogTitle>
          </DialogHeader>
          <iframe
            title="Skickat dokument"
            srcDoc={docView?.html ?? ""}
            className="h-[60vh] w-full rounded border border-border bg-white"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemDraft.id ? "Redigera rad" : "Ny rad"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={itemDraft.item_type ?? "hotel"}
              onValueChange={(v) => setItemDraft({ ...itemDraft, item_type: v as ItemType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ITEM_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Leverantör"
              value={itemDraft.supplier ?? ""}
              onChange={(e) => setItemDraft({ ...itemDraft, supplier: e.target.value })}
            />

            {itemDraft.item_type === "hotel" && (
              <>
                <Select
                  value={itemDraft.hotel_id ?? ""}
                  onValueChange={(v) => {
                    const h = hotels.find((x) => x.id === v);
                    setItemDraft({
                      ...itemDraft,
                      hotel_id: v,
                      description: itemDraft.description || (h ? h.name : ""),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj hotell" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                        {h.city ? ` – ${h.city}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center sm:col-span-2">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setNewHotel((v) => !v)}
                  >
                    {newHotel ? "Avbryt nytt hotell" : "+ Nytt hotell"}
                  </Button>
                </div>
                {newHotel && (
                  <div className="grid gap-2 rounded-md border border-border p-3 sm:col-span-2 sm:grid-cols-3">
                    <Input
                      placeholder="Hotellets namn *"
                      value={hotelDraft.name}
                      onChange={(e) => setHotelDraft({ ...hotelDraft, name: e.target.value })}
                    />
                    <Input
                      placeholder="Adress"
                      value={hotelDraft.address_line1}
                      onChange={(e) =>
                        setHotelDraft({ ...hotelDraft, address_line1: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Stad"
                      value={hotelDraft.city}
                      onChange={(e) => setHotelDraft({ ...hotelDraft, city: e.target.value })}
                    />
                    <div className="sm:col-span-3">
                      <Button type="button" size="sm" onClick={saveHotel}>
                        Spara hotell
                      </Button>
                    </div>
                  </div>
                )}
                <Input
                  placeholder="Rumstyp"
                  value={itemDraft.room_type ?? ""}
                  onChange={(e) => setItemDraft({ ...itemDraft, room_type: e.target.value })}
                />
                <div>
                  <label className="text-xs text-muted-foreground">Incheckning</label>
                  <Input
                    type="date"
                    value={itemDraft.check_in ?? ""}
                    onChange={(e) => setItemDraft({ ...itemDraft, check_in: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Utcheckning</label>
                  <Input
                    type="date"
                    value={itemDraft.check_out ?? ""}
                    onChange={(e) => setItemDraft({ ...itemDraft, check_out: e.target.value })}
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Antal rum"
                  value={itemDraft.rooms ?? ""}
                  onChange={(e) => setItemDraft({ ...itemDraft, rooms: Number(e.target.value) })}
                />
              </>
            )}

            {itemDraft.item_type === "flight" && (
              <>
                <div className="col-span-2 rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Utresa
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Flygbolag</label>
                      <Input
                        placeholder="T.ex. SAS"
                        value={itemDraft.airline ?? ""}
                        onChange={(e) => setItemDraft({ ...itemDraft, airline: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Flightnummer dit</label>
                      <Input
                        placeholder="T.ex. SK123"
                        value={itemDraft.flight_number ?? ""}
                        onChange={(e) =>
                          setItemDraft({ ...itemDraft, flight_number: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Från (flygplats)</label>
                      <Input
                        placeholder="T.ex. GOT"
                        value={itemDraft.from_airport ?? ""}
                        onChange={(e) =>
                          setItemDraft({ ...itemDraft, from_airport: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Till (flygplats)</label>
                      <Input
                        placeholder="T.ex. VLC"
                        value={itemDraft.to_airport ?? ""}
                        onChange={(e) => setItemDraft({ ...itemDraft, to_airport: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Avgång dit</label>
                      <Input
                        type="datetime-local"
                        value={itemDraft.depart_at?.slice(0, 16) ?? ""}
                        onChange={(e) =>
                          setItemDraft({
                            ...itemDraft,
                            depart_at: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <label className="col-span-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={!!itemDraft.is_round_trip}
                    onChange={(e) =>
                      setItemDraft({
                        ...itemDraft,
                        is_round_trip: e.target.checked,
                        ...(e.target.checked
                          ? {}
                          : { return_flight_number: null, return_depart_at: null }),
                      })
                    }
                  />
                  Tur och retur
                </label>

                {itemDraft.is_round_trip && (
                  <div className="col-span-2 rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Hemresa
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Flightnummer hem</label>
                        <Input
                          placeholder="T.ex. SK124"
                          value={itemDraft.return_flight_number ?? ""}
                          onChange={(e) =>
                            setItemDraft({ ...itemDraft, return_flight_number: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Avgång hem</label>
                        <Input
                          type="datetime-local"
                          value={itemDraft.return_depart_at?.slice(0, 16) ?? ""}
                          onChange={(e) =>
                            setItemDraft({
                              ...itemDraft,
                              return_depart_at: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : null,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Input
                  className="col-span-2"
                  placeholder="Bokningsreferens"
                  value={itemDraft.booking_reference ?? ""}
                  onChange={(e) =>
                    setItemDraft({ ...itemDraft, booking_reference: e.target.value })
                  }
                />
              </>
            )}

            {itemDraft.item_type === "ticket" && (
              <>
                <Input
                  placeholder="Match / event"
                  value={itemDraft.event_name ?? ""}
                  onChange={(e) => setItemDraft({ ...itemDraft, event_name: e.target.value })}
                />
                <Input
                  placeholder="Kategori"
                  value={itemDraft.ticket_category ?? ""}
                  onChange={(e) => setItemDraft({ ...itemDraft, ticket_category: e.target.value })}
                />
              </>
            )}

            {itemDraft.item_type === "transfer" && (
              <>
                <Input
                  placeholder="Från"
                  value={itemDraft.transfer_from ?? ""}
                  onChange={(e) => setItemDraft({ ...itemDraft, transfer_from: e.target.value })}
                />
                <Input
                  placeholder="Till"
                  value={itemDraft.transfer_to ?? ""}
                  onChange={(e) => setItemDraft({ ...itemDraft, transfer_to: e.target.value })}
                />
                <div>
                  <label className="text-xs text-muted-foreground">Tid</label>
                  <Input
                    type="datetime-local"
                    value={itemDraft.transfer_at?.slice(0, 16) ?? ""}
                    onChange={(e) =>
                      setItemDraft({
                        ...itemDraft,
                        transfer_at: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                  />
                </div>
                <Input
                  placeholder="Fordon"
                  value={itemDraft.vehicle ?? ""}
                  onChange={(e) => setItemDraft({ ...itemDraft, vehicle: e.target.value })}
                />
              </>
            )}

            <div>
              <label className="text-xs text-muted-foreground">Antal</label>
              <Input
                type="number"
                min={1}
                value={itemDraft.qty ?? 1}
                onChange={(e) => setItemDraft({ ...itemDraft, qty: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Inköpspris (kr)</label>
                <Input
                  type="number"
                  value={itemDraft.cost_sek ?? 0}
                  onChange={(e) => setItemDraft({ ...itemDraft, cost_sek: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Försäljningspris (kr)</label>
                <Input
                  type="number"
                  value={itemDraft.sale_sek ?? 0}
                  onChange={(e) => setItemDraft({ ...itemDraft, sale_sek: Number(e.target.value) })}
                />
              </div>
            </div>
            <Textarea
              className="sm:col-span-2"
              rows={2}
              placeholder="Anteckningar"
              value={itemDraft.notes ?? ""}
              onChange={(e) => setItemDraft({ ...itemDraft, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={saveItem}>Spara</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Traveller dialog */}
      <Dialog open={travOpen} onOpenChange={setTravOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{travDraft.id ? "Redigera resenär" : "Ny resenär"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              placeholder="Fullständigt namn *"
              value={travDraft.full_name ?? ""}
              onChange={(e) => setTravDraft({ ...travDraft, full_name: e.target.value })}
            />
            <div>
              <label className="text-xs text-muted-foreground">Födelsedatum</label>
              <Input
                type="date"
                value={travDraft.date_of_birth ?? ""}
                onChange={(e) => setTravDraft({ ...travDraft, date_of_birth: e.target.value })}
              />
            </div>
            <Input
              placeholder="Nationalitet"
              value={travDraft.nationality ?? ""}
              onChange={(e) => setTravDraft({ ...travDraft, nationality: e.target.value })}
            />
            <Input
              placeholder="Passnummer"
              value={travDraft.passport_number ?? ""}
              onChange={(e) => setTravDraft({ ...travDraft, passport_number: e.target.value })}
            />
            <div>
              <label className="text-xs text-muted-foreground">Pass giltigt t.o.m.</label>
              <Input
                type="date"
                value={travDraft.passport_expiry ?? ""}
                onChange={(e) => setTravDraft({ ...travDraft, passport_expiry: e.target.value })}
              />
            </div>
            <Input
              placeholder="E-post"
              value={travDraft.email ?? ""}
              onChange={(e) => setTravDraft({ ...travDraft, email: e.target.value })}
            />
            <Input
              placeholder="Telefon"
              value={travDraft.phone ?? ""}
              onChange={(e) => setTravDraft({ ...travDraft, phone: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTravOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={saveTraveller}>Spara</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
