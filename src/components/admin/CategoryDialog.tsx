import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
 * Add a ticket category to a manual (non-supplier) event. After save, the existing
 * AdminTickets UI displays it with markup-edit + Stripe-price-sync buttons.
 *
 * The Stripe lookup_key field is optional at creation; admin can click
 * "Skapa Stripe-pris" on the category row to generate one later.
 */
type Props = {
  eventId: string;
  eventLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function CategoryDialog({
  eventId,
  eventLabel,
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPriceSek, setUnitPriceSek] = useState("");
  const [qtyAvailable, setQtyAvailable] = useState("10");
  const [partySize, setPartySize] = useState("1");
  const [markupPct, setMarkupPct] = useState("0");
  const [stripeLookupKey, setStripeLookupKey] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setUnitPriceSek("");
    setQtyAvailable("10");
    setPartySize("1");
    setMarkupPct("0");
    setStripeLookupKey("");
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Kategorinamn krävs");
      return;
    }
    const price = Number(unitPriceSek);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Pris måste vara ett positivt tal");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("ticket_categories").insert({
        event_id: eventId,
        name: name.trim(),
        description: description.trim() || null,
        unit_price_sek: price,
        currency: "SEK",
        qty_available: Math.max(0, Number(qtyAvailable) || 0),
        party_size_together: Math.max(1, Number(partySize) || 1),
        markup_pct: Math.max(0, Number(markupPct) || 0),
        markup_fixed_sek: 0,
        stripe_price_id: stripeLookupKey.trim() || null,
      });
      if (error) throw error;
      toast.success("Kategori tillagd");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte spara kategori");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lägg till kategori</DialogTitle>
          <DialogDescription>
            För {eventLabel}. Stripe lookup_key kan lämnas tom och skapas
            senare via "Skapa Stripe-pris"-knappen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs uppercase tracking-wider">Namn</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VIP Lounge"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider">Beskrivning (valfri)</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Pris (SEK)</Label>
              <Input
                type="number"
                min={0}
                step="1"
                value={unitPriceSek}
                onChange={(e) => setUnitPriceSek(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Antal biljetter</Label>
              <Input
                type="number"
                min={0}
                step="1"
                value={qtyAvailable}
                onChange={(e) => setQtyAvailable(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Sittning ihop</Label>
              <Input
                type="number"
                min={1}
                step="1"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Påslag %</Label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={markupPct}
                onChange={(e) => setMarkupPct(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider">Stripe lookup_key (valfri)</Label>
            <Input
              value={stripeLookupKey}
              onChange={(e) => setStripeLookupKey(e.target.value)}
              placeholder="ex. tc_my_event_vip"
              className="mt-1 font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            Spara kategori
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
