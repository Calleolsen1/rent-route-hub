import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Percent } from "lucide-react";

/**
 * Bulk-edit markup_pct (and optionally markup_fixed_sek) for every category
 * belonging to a set of events. Used from the Admin Tickets event-group
 * header to apply a markup to e.g. "all Bundesliga matches" in one shot.
 */
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Event IDs whose ticket_categories will be updated */
  eventIds: string[];
  /** Display label, e.g. "Bundesliga (5 matcher)" */
  groupLabel: string;
  onApplied: () => void;
};

export function BulkMarkupDialog({
  open,
  onOpenChange,
  eventIds,
  groupLabel,
  onApplied,
}: Props) {
  const [pct, setPct] = useState("15");
  const [fixed, setFixed] = useState("0");
  const [includeFixed, setIncludeFixed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apply = async () => {
    const pctNum = Number(pct);
    if (!Number.isFinite(pctNum) || pctNum < 0 || pctNum > 100) {
      toast.error("Procentsats måste vara 0-100");
      return;
    }
    const fixedNum = Number(fixed);
    if (includeFixed && (!Number.isFinite(fixedNum) || fixedNum < 0)) {
      toast.error("Fast påslag kan inte vara negativt");
      return;
    }
    if (
      !confirm(
        `Detta uppdaterar påslag på alla biljettkategorier i ${groupLabel}. Befintliga värden överskrivs. Är du säker?`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const update: Record<string, number> = { markup_pct: pctNum };
      if (includeFixed) update.markup_fixed_sek = fixedNum;
      const { error, count } = await (supabase as any)
        .from("ticket_categories")
        .update(update)
        .in("event_id", eventIds)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      toast.success(`Uppdaterade ${count ?? "-"} kategorier`);
      onApplied();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte uppdatera");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sätt påslag för hela gruppen</DialogTitle>
          <DialogDescription>
            Påverkar alla biljettkategorier i <strong>{groupLabel}</strong>. Bra
            för att höja/sänka marginal på en hel liga eller serie i ett svep.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs uppercase tracking-wider">Procentpåslag</Label>
            <div className="relative mt-1">
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeFixed}
              onChange={(e) => setIncludeFixed(e.target.checked)}
            />
            Sätt även fast påslag (SEK)
          </label>

          {includeFixed && (
            <div>
              <Label className="text-xs uppercase tracking-wider">Fast påslag (SEK)</Label>
              <Input
                type="number"
                min={0}
                step="1"
                value={fixed}
                onChange={(e) => setFixed(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={apply} disabled={submitting}>
            {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            Tillämpa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
