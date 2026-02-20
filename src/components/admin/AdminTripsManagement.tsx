import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Plane, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

type Trip = {
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
  flights: any[];
  transfers: any[];
  schedule: any[];
  tickets: any[];
  created_at: string;
  profiles?: { first_name: string | null; last_name: string | null; email: string } | null;
};

const EMPTY_TRIP = {
  guest_user_id: "",
  title: "",
  destination: "",
  start_date: "",
  end_date: "",
  status: "upcoming",
  notes: "",
  hotel_name: "",
  hotel_address: "",
  hotel_checkin: "",
  hotel_checkout: "",
  hotel_confirmation: "",
  hotel_notes: "",
  hotel_stars: "" as any,
  flights_raw: "[]",
  transfers_raw: "[]",
  schedule_raw: "[]",
  tickets_raw: "[]",
};

const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  upcoming: "Kommande",
  ongoing: "Pågående",
  completed: "Avslutad",
  cancelled: "Inställd",
};

const TripFormDialog = ({
  open,
  onOpenChange,
  trip,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trip: Trip | null;
  onSaved: () => void;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(
    trip
      ? {
          guest_user_id: trip.guest_user_id,
          title: trip.title,
          destination: trip.destination || "",
          start_date: trip.start_date || "",
          end_date: trip.end_date || "",
          status: trip.status,
          notes: trip.notes || "",
          hotel_name: trip.hotel_name || "",
          hotel_address: trip.hotel_address || "",
          hotel_checkin: trip.hotel_checkin || "",
          hotel_checkout: trip.hotel_checkout || "",
          hotel_confirmation: trip.hotel_confirmation || "",
          hotel_notes: trip.hotel_notes || "",
          hotel_stars: trip.hotel_stars?.toString() || "",
          flights_raw: JSON.stringify(trip.flights || [], null, 2),
          transfers_raw: JSON.stringify(trip.transfers || [], null, 2),
          schedule_raw: JSON.stringify(trip.schedule || [], null, 2),
          tickets_raw: JSON.stringify(trip.tickets || [], null, 2),
        }
      : { ...EMPTY_TRIP }
  );

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.guest_user_id || !form.title) {
      toast({ title: "Fyll i resenärens ID och resans titel", variant: "destructive" });
      return;
    }
    let flights, transfers, schedule, tickets;
    try {
      flights = JSON.parse(form.flights_raw || "[]");
      transfers = JSON.parse(form.transfers_raw || "[]");
      schedule = JSON.parse(form.schedule_raw || "[]");
      tickets = JSON.parse(form.tickets_raw || "[]");
    } catch {
      toast({ title: "Ogiltig JSON i ett fält", variant: "destructive" });
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
      hotel_name: form.hotel_name || null,
      hotel_address: form.hotel_address || null,
      hotel_checkin: form.hotel_checkin || null,
      hotel_checkout: form.hotel_checkout || null,
      hotel_confirmation: form.hotel_confirmation || null,
      hotel_notes: form.hotel_notes || null,
      hotel_stars: form.hotel_stars ? parseInt(form.hotel_stars) : null,
      flights,
      transfers,
      schedule,
      tickets,
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
      toast({ title: trip ? "Resa uppdaterad" : "Resa skapad" });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trip ? "Redigera resa" : "Ny resa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Grundinfo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <Label>Resenärens User-ID *</Label>
              <Input value={form.guest_user_id} onChange={e => set("guest_user_id", e.target.value)} placeholder="UUID" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Titel *</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="t.ex. Paris Weekend 2025" />
            </div>
            <div className="space-y-1">
              <Label>Destination</Label>
              <Input value={form.destination} onChange={e => set("destination", e.target.value)} placeholder="t.ex. Paris, Frankrike" />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
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
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Slutdatum</Label>
              <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
            </div>
          </div>

          {/* Hotell */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Hotell</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Namn</Label>
                <Input value={form.hotel_name} onChange={e => set("hotel_name", e.target.value)} placeholder="Hotellnamn" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stjärnor (1-5)</Label>
                <Input type="number" min={1} max={5} value={form.hotel_stars} onChange={e => set("hotel_stars", e.target.value)} />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Adress</Label>
                <Input value={form.hotel_address} onChange={e => set("hotel_address", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Incheckning</Label>
                <Input type="date" value={form.hotel_checkin} onChange={e => set("hotel_checkin", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Utcheckning</Label>
                <Input type="date" value={form.hotel_checkout} onChange={e => set("hotel_checkout", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bokningsreferens</Label>
                <Input value={form.hotel_confirmation} onChange={e => set("hotel_confirmation", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hotellanteckningar</Label>
                <Input value={form.hotel_notes} onChange={e => set("hotel_notes", e.target.value)} />
              </div>
            </div>
          </div>

          {/* JSON-fält */}
          {[
            { key: "flights_raw", label: "Flyg (JSON-array)", placeholder: '[{"from":"ARN","to":"CDG","flight_number":"SK1234","departure":"2025-06-01 10:00","arrival":"2025-06-01 12:30","airline":"SAS"}]' },
            { key: "transfers_raw", label: "Transfer (JSON-array)", placeholder: '[{"from":"Flygplats","to":"Hotel","datetime":"2025-06-01 13:00","vehicle":"Limousin"}]' },
            { key: "schedule_raw", label: "Schema (JSON-array)", placeholder: '[{"date":"2025-06-01","time":"19:00","title":"Middag","description":"Restaurang Jules Verne"}]' },
            { key: "tickets_raw", label: "Biljetter (JSON-array)", placeholder: '[{"name":"Eiffel Tower","date":"2025-06-02","url":"https://..."}]' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Textarea
                rows={3}
                value={(form as any)[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="font-mono text-xs"
              />
            </div>
          ))}

          <div className="space-y-1">
            <Label className="text-xs">Anteckningar</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
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

const AdminTripsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["admin-trips", search],
    queryFn: async () => {
      let q = supabase
        .from("trips")
        .select("*")
        .order("start_date", { ascending: false });
      if (search) q = q.ilike("title", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      // Fetch profiles separately
      const trips = data as Trip[];
      if (trips.length > 0) {
        const userIds = [...new Set(trips.map(t => t.guest_user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);
        if (profiles) {
          const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
          trips.forEach(t => { (t as any).profiles = profileMap[t.guest_user_id] || null; });
        }
      }
      return trips;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök resa..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Ny resa
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : trips && trips.length > 0 ? (
        <div className="space-y-3">
          {trips.map(t => (
            <Card key={t.id} className="border border-border/60">
              <CardContent className="flex items-center justify-between gap-4 py-4 px-5 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plane className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{t.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] || "bg-muted text-muted-foreground"}`}>
                        {statusLabels[t.status] || t.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.profiles ? `${t.profiles.first_name || ""} ${t.profiles.last_name || ""} · ${t.profiles.email}` : t.guest_user_id}
                      {t.destination && ` · ${t.destination}`}
                      {t.start_date && ` · ${format(new Date(t.start_date), "d MMM yyyy", { locale: sv })}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">Inga resor hittades</div>
      )}

      <TripFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trip={editing}
        onSaved={onSaved}
      />
    </div>
  );
};

export default AdminTripsManagement;
