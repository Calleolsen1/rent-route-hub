import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { LinkPicker } from "@/components/admin/LinkPicker";

type Trip = {
  id: string;
  image_url: string | null;
  title: string;
  tag: string | null;
  date_label: string | null;
  days_label: string | null;
  price_from_sek: number | null;
  href: string;
  cta_label: string;
  is_new: boolean;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  valid_until: string | null;
};

export default function AdminHomeTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("home_trips")
      .select("*")
      .order("sort_order", { ascending: true });
    setTrips((data as Trip[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, p: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));
    const { error } = await (supabase as any).from("home_trips").update(p).eq("id", id);
    if (error) toast.error(error.message ?? "Kunde inte spara");
  };

  const setLocal = (id: string, p: Partial<Trip>) =>
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const addTrip = async () => {
    const nextOrder = trips.length === 0 ? 0 : Math.max(...trips.map((t) => t.sort_order)) + 1;
    const { data, error } = await (supabase as any)
      .from("home_trips")
      .insert({ title: "Ny resa", is_active: false, sort_order: nextOrder })
      .select("*")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Kunde inte skapa resa");
      return;
    }
    setTrips((prev) => [...prev, data as Trip]);
    toast.success("Resa skapad - aktivera när den är klar");
  };

  const removeTrip = async (id: string) => {
    if (!confirm("Ta bort resan från startsidan?")) return;
    const { error } = await (supabase as any).from("home_trips").delete().eq("id", id);
    if (error) {
      toast.error(error.message ?? "Kunde inte ta bort");
      return;
    }
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = trips.findIndex((t) => t.id === id);
    const otherIdx = idx + dir;
    if (idx < 0 || otherIdx < 0 || otherIdx >= trips.length) return;
    const a = trips[idx];
    const b = trips[otherIdx];
    const next = [...trips];
    next[idx] = { ...a, sort_order: b.sort_order };
    next[otherIdx] = { ...b, sort_order: a.sort_order };
    next.sort((x, y) => x.sort_order - y.sort_order);
    setTrips(next);
    await Promise.all([
      (supabase as any).from("home_trips").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("home_trips").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
  };

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display mb-2">Resor på startsidan</h1>
          <p className="text-muted-foreground text-sm">
            Korten under "Aktuella resor". Markera "Ny" och "Populär" för att styra flikarna. Sätt
            "Visa till" så försvinner resan automatiskt när datumet passerat.
          </p>
        </div>
        <Button onClick={addTrip} className="flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Ny resa
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laddar...</p>
      ) : trips.length === 0 ? (
        <p className="text-sm text-muted-foreground">Inga resor ännu. Klicka "Ny resa".</p>
      ) : (
        <div className="space-y-4">
          {trips.map((trip, i) => (
            <div key={trip.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Switch
                      checked={trip.is_active}
                      onCheckedChange={(v) => patch(trip.id, { is_active: v })}
                    />
                    {trip.is_active ? "Aktiv" : "Inaktiv"}
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Switch
                      checked={trip.is_new}
                      onCheckedChange={(v) => patch(trip.id, { is_new: v })}
                    />
                    Ny
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Switch
                      checked={trip.is_popular}
                      onCheckedChange={(v) => patch(trip.id, { is_popular: v })}
                    />
                    Populär
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => move(trip.id, -1)} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => move(trip.id, 1)}
                    disabled={i === trips.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeTrip(trip.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ImageUploader
                value={trip.image_url ?? ""}
                prefix="home-trips"
                onUploaded={(url) => patch(trip.id, { image_url: url })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Titel</Label>
                  <Input
                    value={trip.title}
                    placeholder="Träningsläger Valencia"
                    onChange={(e) => setLocal(trip.id, { title: e.target.value })}
                    onBlur={(e) => patch(trip.id, { title: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Etikett</Label>
                  <Input
                    value={trip.tag ?? ""}
                    placeholder="Träningsläger"
                    onChange={(e) => setLocal(trip.id, { tag: e.target.value })}
                    onBlur={(e) => patch(trip.id, { tag: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Datumtext</Label>
                  <Input
                    value={trip.date_label ?? ""}
                    placeholder="Maj 2027"
                    onChange={(e) => setLocal(trip.id, { date_label: e.target.value })}
                    onBlur={(e) => patch(trip.id, { date_label: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Längd</Label>
                  <Input
                    value={trip.days_label ?? ""}
                    placeholder="5 dagar"
                    onChange={(e) => setLocal(trip.id, { days_label: e.target.value })}
                    onBlur={(e) => patch(trip.id, { days_label: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Pris från (kr)</Label>
                  <Input
                    type="number"
                    value={trip.price_from_sek ?? ""}
                    placeholder="8200"
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) =>
                      setLocal(trip.id, {
                        price_from_sek: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    onBlur={(e) =>
                      patch(trip.id, {
                        price_from_sek: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Visa till (valfritt)</Label>
                  <Input
                    type="date"
                    value={trip.valid_until ?? ""}
                    onChange={(e) => setLocal(trip.id, { valid_until: e.target.value || null })}
                    onBlur={(e) => patch(trip.id, { valid_until: e.target.value || null })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs uppercase tracking-wider">Länk</Label>
                  <LinkPicker
                    value={trip.href}
                    onChange={(v) => patch(trip.id, { href: v || "/contact" })}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Knapptext</Label>
                  <Input
                    value={trip.cta_label}
                    placeholder="Gör förfrågan"
                    onChange={(e) => setLocal(trip.id, { cta_label: e.target.value })}
                    onBlur={(e) => patch(trip.id, { cta_label: e.target.value || "Gör förfrågan" })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
