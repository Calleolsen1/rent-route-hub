import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

/**
 * Admin dialog to create a manually-managed event (source='manual') - for
 * inventory not in xs2event: training camps, VIP packages, weekend trips.
 *
 * After creation the new event appears in /admin/tickets with the standard
 * cover-image + categories + markup workflow. Categories must still be added
 * via "Lägg till kategori" per event.
 */
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const todayPlusDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // Format for datetime-local input: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
};

export function ManualEventDialog({ open, onOpenChange, onCreated }: Props) {
  const [sport, setSport] = useState<"soccer" | "formula1">("soccer");
  const [tournamentName, setTournamentName] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [raceName, setRaceName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [startsAt, setStartsAt] = useState(todayPlusDays(30));
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSport("soccer");
    setTournamentName("");
    setHomeTeam("");
    setAwayTeam("");
    setRaceName("");
    setVenueName("");
    setCity("");
    setCountry("");
    setStartsAt(todayPlusDays(30));
    setEndsAt("");
    setDescription("");
  };

  const submit = async () => {
    if (!tournamentName.trim()) {
      toast.error("Turnerings-/seriename krävs");
      return;
    }
    if (sport === "soccer" && (!homeTeam.trim() || !awayTeam.trim())) {
      toast.error("Båda lagen måste anges för fotbollsevent");
      return;
    }
    if (sport === "formula1" && !raceName.trim()) {
      toast.error("Race-namn krävs för F1");
      return;
    }
    if (!startsAt) {
      toast.error("Startdatum krävs");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("events").insert({
        source: "manual",
        sport,
        tournament_name: tournamentName.trim(),
        home_team: sport === "soccer" ? homeTeam.trim() : null,
        away_team: sport === "soccer" ? awayTeam.trim() : null,
        race_name: sport === "formula1" ? raceName.trim() : null,
        venue_name: venueName.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        description: description.trim() || null,
        status: "upcoming",
      });
      if (error) throw error;
      toast.success("Eventet är skapat. Lägg till biljettkategorier nedan.");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte skapa event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skapa manuellt event</DialogTitle>
          <DialogDescription>
            För inventory utanför xs2event - träningsläger, VIP-paket, weekendresor.
            Kategorier och biljettpriser lägger du till efter att eventet är skapat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Sport</Label>
              <Select value={sport} onValueChange={(v) => setSport(v as "soccer" | "formula1")}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soccer">Fotboll</SelectItem>
                  <SelectItem value="formula1">Formel 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Turnering / Serie</Label>
              <Input
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder={sport === "soccer" ? "Premier League" : "Formula 1"}
                className="mt-1"
              />
            </div>
          </div>

          {sport === "soccer" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider">Hemmalag</Label>
                <Input
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="Liverpool FC"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Bortalag</Label>
                <Input
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="Manchester City"
                  className="mt-1"
                />
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs uppercase tracking-wider">Race-namn</Label>
              <Input
                value={raceName}
                onChange={(e) => setRaceName(e.target.value)}
                placeholder="Spanish Grand Prix"
                className="mt-1"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Arena / Bana</Label>
              <Input
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder={sport === "soccer" ? "Anfield" : "Circuit de Monaco"}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs uppercase tracking-wider">Stad</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Liverpool"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Land (ISO)</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="GB"
                  className="mt-1"
                  maxLength={3}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Startdatum / tid</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Slutdatum (valfri)</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider">Beskrivning (valfri)</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort text som visas på EventDetail-sidan"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            Skapa event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
