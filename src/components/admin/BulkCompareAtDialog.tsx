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
import { Loader2, AlertTriangle } from "lucide-react";

/**
 * Apply a synthetic compare-at percentage to every event in a tournament or
 * sport. Calls the SECURITY DEFINER RPC set_group_compare_at_pct, which
 * flattens the value onto events.compare_at_pct so reads stay simple.
 *
 * Trade-off vs storing the group-level value separately: new events added
 * later won't auto-inherit; admin can re-open the dialog and re-apply.
 */
type Target =
  | { sport: string; tournament?: never }
  | { tournament: string; sport?: never };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: Target | null;
  groupLabel: string;
  onApplied: () => void;
};

export function BulkCompareAtDialog({
  open,
  onOpenChange,
  target,
  groupLabel,
  onApplied,
}: Props) {
  const [pct, setPct] = useState("20");
  const [submitting, setSubmitting] = useState(false);

  const apply = async () => {
    if (!target) return;
    const pctNum = Number(pct);
    if (!Number.isFinite(pctNum) || pctNum < 0 || pctNum > 500) {
      toast.error("Procentsats måste vara 0-500");
      return;
    }
    if (
      !confirm(
        `Detta skriver över compare_at_pct på alla event i ${groupLabel} (befintliga per-event-värden ersätts). Per-kategori-värden lämnas orörda. Fortsätta?`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await (supabase as any).rpc("set_group_compare_at_pct", {
        p_pct: pctNum,
        p_sport: target.sport ?? null,
        p_tournament_name: target.tournament ?? null,
      });
      if (error) throw error;
      toast.success(`Uppdaterade ${data ?? "-"} event`);
      onApplied();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte uppdatera");
    } finally {
      setSubmitting(false);
    }
  };

  const clear = async () => {
    if (!target) return;
    if (
      !confirm(
        `Detta rensar compare_at_pct på alla event i ${groupLabel}. Per-event SEK-värden och per-kategori-värden lämnas orörda. Fortsätta?`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await (supabase as any).rpc("set_group_compare_at_pct", {
        p_pct: 0,
        p_sport: target.sport ?? null,
        p_tournament_name: target.tournament ?? null,
      });
      if (error) throw error;
      // pct=0 disables the synthetic compare-at - same as cleared for display purposes.
      toast.success(`Rensade ${data ?? "-"} event`);
      onApplied();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Kunde inte rensa");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sätt jämförelsepris för hela gruppen</DialogTitle>
          <DialogDescription>
            Procenten appliceras på alla event i <strong>{groupLabel}</strong>.
            Per-kategori-värden vinner alltid över denna. Per-event SEK-värden
            kan finnas kvar och vinner också (SEK slår alltid %).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs uppercase tracking-wider">Procent över aktuellt pris</Label>
            <div className="relative mt-1 max-w-[200px]">
              <Input
                type="number"
                min={0}
                max={500}
                step="1"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              T.ex. 20 visar 3 000 kr som <span className="line-through">3 600 kr</span> 3 000 kr −17%.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Prisinformationslagen:</strong> överstrukna priser måste vara verkliga tidigare priser inom 30 dagar. Att sätta ett syntetiskt jämförelsepris utan historisk grund kan leda till sanktionsavgift från Konsumentverket. Använd försiktigt.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={clear} disabled={submitting}>
            Rensa gruppen
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={apply} disabled={submitting || !target}>
            {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            Tillämpa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
