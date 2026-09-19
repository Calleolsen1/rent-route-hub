import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Loader2, Plus, Search, ArrowRight, Mail, Trash2, Undo2 } from "lucide-react";
import {
  BOOKING_STATUS_OPTIONS,
  formatSek,
  STATUS_LABEL,
  type BookingStatus,
} from "./shared";

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

type DeletedRow = {
  id: string;
  booking_number: string | null;
  title: string;
  destination: string | null;
  depart_date: string | null;
  deleted_at: string | null;
  company_name: string | null;
  contact_name: string | null;
};

type WebOrderRow = {
  id: string;
  status: string;
  total_sek: number;
  customer_email: string;
  customer_name: string | null;
  created_at: string;
  items: { event_name: string; qty: number }[];
};

export default function BackofficeBookings() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [webOrders, setWebOrders] = useState<WebOrderRow[]>([]);
  const [customers, setCustomers] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletedRows, setDeletedRows] = useState<DeletedRow[]>([]);
  const [confirmPermanent, setConfirmPermanent] = useState<DeletedRow | null>(null);
  const [newCustomer, setNewCustomer] = useState(false);
  const [custDraft, setCustDraft] = useState({
    contact_name: "",
    company_name: "",
    email: "",
    phone: "",
  });
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
    // Sätt automatiskt resor vars datum passerat till "Genomförd"
    await supabase.rpc("complete_past_bookings");
    const [{ data, error }, { data: cust }] = await Promise.all([
      supabase.from("booking_margin_view").select("*").order("depart_date", { ascending: true }),
      supabase.from("customers").select("id, company_name, contact_name").order("contact_name"),
    ]);
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    const { data: orderData } = await supabase
      .from("orders")
      .select("id, status, total_sek, customer_email, customer_name, created_at, order_items(qty, events(tournament_name))")
      .order("created_at", { ascending: false })
      .limit(50);
    setWebOrders(
      (orderData ?? []).map((o: any) => ({
        id: o.id,
        status: o.status,
        total_sek: o.total_sek,
        customer_email: o.customer_email,
        customer_name: o.customer_name,
        created_at: o.created_at,
        items: (o.order_items ?? []).map((it: any) => ({
          event_name: it.events?.tournament_name ?? "Biljettkö",
          qty: it.qty,
        })),
      })),
    );
    setCustomers(
      (cust ?? []).map((c: any) => ({
        id: c.id,
        label: c.company_name ? `${c.company_name} (${c.contact_name})` : c.contact_name,
      })),
    );
    const { data: del } = await supabase
      .from("bookings")
      .select("id, booking_number, title, destination, depart_date, deleted_at, customers(company_name, contact_name)")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    setDeletedRows(
      (del ?? []).map((b: any) => ({
        id: b.id,
        booking_number: b.booking_number,
        title: b.title,
        destination: b.destination,
        depart_date: b.depart_date,
        deleted_at: b.deleted_at,
        company_name: b.customers?.company_name ?? null,
        contact_name: b.customers?.contact_name ?? null,
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
      // Periodfilter: resan visas om den överlappar valt datumintervall
      let matchDates = true;
      if (fromDate || toDate) {
        const start = r.depart_date;
        const end = r.return_date || r.depart_date;
        if (fromDate && end && end < fromDate) matchDates = false;
        if (toDate && start && start > toDate) matchDates = false;
      }
      return matchStatus && matchQuery && matchDates;
    });
  }, [rows, query, statusFilter, fromDate, toDate]);

  const hasDateFilter = !!fromDate || !!toDate;

  const today = new Date().toISOString().slice(0, 10);

  const { upcoming, past } = useMemo(() => {
    const isPast = (r: Row) => {
      const end = r.return_date || r.depart_date;
      return (!!end && end < today) || r.status === "completed" || r.status === "cancelled";
    };
    const up = filtered
      .filter((r) => !isPast(r))
      .sort((a, b) => (a.depart_date ?? "9999").localeCompare(b.depart_date ?? "9999"));
    const pa = filtered
      .filter(isPast)
      .sort((a, b) => (b.depart_date ?? "").localeCompare(a.depart_date ?? ""));
    return { upcoming: up, past: pa };
  }, [filtered, today]);

  const filteredWebOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return webOrders;
    return webOrders.filter((o) =>
      [o.customer_name, o.customer_email, ...o.items.map((i) => i.event_name)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [webOrders, query]);

  // Mjuk radering: resan markeras som raderad och kan återställas
  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from("bookings")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", confirmDelete.booking_id);
    setDeleting(false);
    setConfirmDelete(null);
    if (error) return toast.error(error.message);
    toast.success("Resan är raderad - återställ den under Raderade resor");
    load();
  };

  const restore = async (r: DeletedRow) => {
    const { error } = await supabase
      .from("bookings")
      .update({ deleted_at: null })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`"${r.title}" är återställd`);
    load();
  };

  const doPermanentDelete = async () => {
    if (!confirmPermanent) return;
    setDeleting(true);
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", confirmPermanent.id);
    setDeleting(false);
    setConfirmPermanent(null);
    if (error) return toast.error(error.message);
    toast.success("Resan är permanent raderad");
    load();
  };

  const sendConfirmation = async (bookingId: string) => {
    setSending(bookingId);
    const { error } = await supabase.functions.invoke("send-booking-confirmation", {
      body: { booking_id: bookingId },
    });
    setSending(null);
    if (error) return toast.error(error.message);
    toast.success("Bokningsbekräftelsen är skickad");
  };

  const create = async () => {
    if (!draft.title.trim()) return toast.error("Ange en titel");
    let customerId = draft.customer_id;

    if (newCustomer) {
      if (!custDraft.contact_name.trim() || !custDraft.email.trim()) {
        return toast.error("Ange kontaktperson och e-post för den nya kunden");
      }
      setSaving(true);
      const { data: cust, error: custError } = await supabase
        .from("customers")
        .insert({
          contact_name: custDraft.contact_name,
          company_name: custDraft.company_name || null,
          email: custDraft.email,
          phone: custDraft.phone || null,
        })
        .select("id")
        .single();
      if (custError || !cust) {
        setSaving(false);
        return toast.error(custError?.message ?? "Kunde inte skapa kunden");
      }
      customerId = cust.id;
    } else if (!customerId) {
      return toast.error("Välj kund");
    }

    setSaving(true);
    const { data: created, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: customerId,
        title: draft.title,
        destination: draft.destination || null,
        depart_date: draft.depart_date || null,
        return_date: draft.return_date || null,
        travellers_count: Number(draft.travellers_count) || 0,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error || !created) return toast.error(error?.message ?? "Kunde inte skapa bokningen");
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
    setNewCustomer(false);
    setCustDraft({ contact_name: "", company_name: "", email: "", phone: "" });
    // Öppna den nya bokningen direkt
    navigate(`/admin/backoffice/bokningar/${created.id}`);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground">Bokningar</h1>
          <p className="text-sm text-muted-foreground">
            Resor med hotell, flyg, biljetter och transfer - samt marginal per resa.
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
              {BOOKING_STATUS_OPTIONS.map((k) => (
                <SelectItem key={k} value={k}>
                  {STATUS_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={viewFilter} onValueChange={setViewFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla resor</SelectItem>
              <SelectItem value="upcoming">Kommande</SelectItem>
              <SelectItem value="past">Genomförda</SelectItem>
              <SelectItem value="deleted">Raderade</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-40"
            title="Visa resor från och med detta datum"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-40"
            title="Visa resor fram till detta datum"
          />
          {(fromDate || toDate || viewFilter !== "all" || statusFilter !== "all" || query) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setViewFilter("all");
                setStatusFilter("all");
                setQuery("");
              }}
            >
              Rensa filter
            </Button>
          )}
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
      ) : viewFilter === "deleted" ? (
        deletedRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Inga raderade resor.
          </p>
        ) : (
          <section>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="font-display text-lg text-foreground">Raderade resor</h2>
              <span className="text-xs text-muted-foreground">{deletedRows.length} st</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nr</th>
                    <th className="px-4 py-3">Resa</th>
                    <th className="px-4 py-3">Kund</th>
                    <th className="px-4 py-3">Avresa</th>
                    <th className="px-4 py-3">Raderad</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {deletedRows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground">{r.booking_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{r.destination}</div>
                      </td>
                      <td className="px-4 py-3">{r.company_name || r.contact_name}</td>
                      <td className="px-4 py-3">{r.depart_date ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.deleted_at?.slice(0, 10) ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Återställ resa"
                          onClick={() => restore(r)}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Radera permanent"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmPermanent(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {hasDateFilter || viewFilter !== "all" || statusFilter !== "all" || query
            ? "Inga bokningar matchar filtret."
            : "Inga bokningar ännu."}
        </p>
      ) : (
        <div className="space-y-8">
          {(
            viewFilter === "past"
              ? [{ label: "Genomförda resor", items: past }]
              : viewFilter === "upcoming"
                ? [{ label: "Kommande resor", items: upcoming }]
                : [
                    { label: "Kommande resor", items: upcoming },
                    { label: "Genomförda resor", items: past },
                  ]
          ).map(
            (group) =>
              group.items.length > 0 && (
                <section key={group.label}>
                  <div className="mb-2 flex items-baseline gap-2">
                    <h2 className="font-display text-lg text-foreground">{group.label}</h2>
                    <span className="text-xs text-muted-foreground">
                      {group.items.length} st
                    </span>
                  </div>
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
              {group.items.map((r) => (
                <tr key={r.booking_id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{r.booking_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.destination}</div>
                  </td>
                  <td className="px-4 py-3">{r.company_name || r.contact_name}</td>
                  <td className="px-4 py-3">{r.depart_date ?? "-"}</td>
                  <td className="px-4 py-3">{r.travellers_count}</td>
                  <td className="px-4 py-3 text-right">{formatSek(r.sale_total_sek)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatSek(r.cost_total_sek)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatSek(r.margin_sek)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Skicka bokningsbekräftelse"
                      onClick={() => sendConfirmation(r.booking_id)}
                      disabled={sending === r.booking_id}
                    >
                      {sending === r.booking_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Radera resa"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(r)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                </section>
              ),
          )}
          {viewFilter === "all" && !hasDateFilter && filteredWebOrders.length > 0 && (
            <section>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="font-display text-lg text-foreground">Biljettkö via webben</h2>
                <span className="text-xs text-muted-foreground">{filteredWebOrders.length} st</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Datum</th>
                      <th className="px-4 py-3">Köp</th>
                      <th className="px-4 py-3">Kund</th>
                      <th className="px-4 py-3 text-right">Belopp</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWebOrders.map((o) => (
                      <tr key={o.id} className="border-t border-border">
                        <td className="px-4 py-3 text-muted-foreground">
                          {o.created_at.slice(0, 10)}
                        </td>
                        <td className="px-4 py-3">
                          {o.items.map((i, idx) => (
                            <div key={idx}>
                              <span className="font-medium">{i.event_name}</span>
                              <span className="text-xs text-muted-foreground"> × {i.qty}</span>
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          <div>{o.customer_name || o.customer_email}</div>
                          {o.customer_name && (
                            <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatSek(o.total_sek)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{o.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/admin/orders`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny bokning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Kund</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setNewCustomer((v) => !v)}
              >
                {newCustomer ? "Välj befintlig kund" : "+ Ny kund"}
              </Button>
            </div>
            {newCustomer ? (
              <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
                <Input
                  placeholder="Kontaktperson *"
                  value={custDraft.contact_name}
                  onChange={(e) => setCustDraft({ ...custDraft, contact_name: e.target.value })}
                />
                <Input
                  placeholder="Företag/lag"
                  value={custDraft.company_name}
                  onChange={(e) => setCustDraft({ ...custDraft, company_name: e.target.value })}
                />
                <Input
                  placeholder="E-post *"
                  value={custDraft.email}
                  onChange={(e) => setCustDraft({ ...custDraft, email: e.target.value })}
                />
                <Input
                  placeholder="Telefon"
                  value={custDraft.phone}
                  onChange={(e) => setCustDraft({ ...custDraft, phone: e.target.value })}
                />
              </div>
            ) : (
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
            )}
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

      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Radera resa?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{confirmDelete?.title}" flyttas till Raderade resor tillsammans med alla
            rader (hotell, flyg, biljetter, transfer) och resenärslistan. Den syns inte
            längre i listor eller rapporter, men du kan återställa den när som helst
            under vyn "Raderade".
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={doDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Radera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmPermanent} onOpenChange={(v) => !v && setConfirmPermanent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Radera permanent?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{confirmPermanent?.title}" raderas permanent tillsammans med alla rader
            (hotell, flyg, biljetter, transfer) och resenärslistan. Skickade fakturor
            och dokument finns kvar på kundkortet. Detta går inte att ångra.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPermanent(null)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={doPermanentDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Radera permanent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
