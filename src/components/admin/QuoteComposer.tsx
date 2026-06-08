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
import { Trash2, Plus, Loader2 } from "lucide-react";

type Line = {
  key: string;
  description: string;
  qty: number;
  unit_price_sek: number;
};

type InquirySummary = {
  id: string;
  name: string;
  email: string;
  destination?: string | null;
  group_size?: number | null;
  budget_sek?: number | null;
};

const ymd = (d: Date) => d.toISOString().slice(0, 10);

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return ymd(d);
}

function newLine(): Line {
  return {
    key: crypto.randomUUID(),
    description: "",
    qty: 1,
    unit_price_sek: 0,
  };
}

export default function QuoteComposer({
  inquiry,
  open,
  onOpenChange,
  onSent,
}: {
  inquiry: InquirySummary;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSent: () => void;
}) {
  const defaultTitle = inquiry.destination
    ? `Skräddarsydd resa till ${inquiry.destination}`
    : `Skräddarsydd resa för ${inquiry.name}`;

  const [title, setTitle] = useState(defaultTitle);
  const [intro, setIntro] = useState(
    `Hej ${inquiry.name.split(" ")[0]},\n\nNedan följer vårt förslag baserat på din förfrågan. Hör av dig om något ska justeras.`,
  );
  const [expiresAt, setExpiresAt] = useState<string>(defaultExpiry());
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [submitting, setSubmitting] = useState(false);

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.unit_price_sek) || 0) * (Number(l.qty) || 0),
    0,
  );

  const addLine = () => setLines((ls) => [...ls, newLine()]);
  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) =>
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error("Titel krävs");
      return;
    }
    const validLines = lines.filter((l) => l.description.trim() && l.unit_price_sek > 0 && l.qty > 0);
    if (validLines.length === 0) {
      toast.error("Lägg till minst en rad med pris");
      return;
    }
    if (!expiresAt) {
      toast.error("Sätt giltighetsdatum");
      return;
    }

    setSubmitting(true);
    try {
      // Create quote
      const { data: quote, error: qErr } = await (supabase as any)
        .from("quotes")
        .insert({
          inquiry_id: inquiry.id,
          customer_email: inquiry.email,
          customer_name: inquiry.name,
          title: title.trim(),
          intro_message: intro.trim() || null,
          total_sek: total,
          currency: "SEK",
          status: "draft",
          expires_at: new Date(expiresAt + "T23:59:59").toISOString(),
        })
        .select("id")
        .single();
      if (qErr || !quote) throw new Error(qErr?.message ?? "Kunde inte spara offert");

      // Items
      const rows = validLines.map((l, i) => ({
        quote_id: quote.id,
        description: l.description.trim(),
        qty: l.qty,
        unit_price_sek: l.unit_price_sek,
        sort_order: i,
      }));
      const { error: iErr } = await (supabase as any).from("quote_items").insert(rows);
      if (iErr) throw new Error(iErr.message);

      // Send email (also flips status sent → 'sent' and links inquiry → 'quoted')
      const { error: sErr, data: sData } = await supabase.functions.invoke("send-quote-email", {
        body: { quote_id: quote.id },
      });
      if (sErr || (sData as any)?.error) {
        throw new Error(sErr?.message ?? (sData as any)?.error ?? "Kunde inte skicka mejl");
      }

      toast.success("Offerten är skickad");
      onOpenChange(false);
      onSent();
    } catch (e: any) {
      toast.error(e.message ?? "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Skapa offert</DialogTitle>
          <DialogDescription>
            Skickas till {inquiry.email}. Kunden får en länk för att granska och betala via Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="quote-title" className="text-xs uppercase tracking-wider">
              Titel
            </Label>
            <Input
              id="quote-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="quote-intro" className="text-xs uppercase tracking-wider">
              Inledande meddelande
            </Label>
            <Textarea
              id="quote-intro"
              rows={4}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="quote-expiry" className="text-xs uppercase tracking-wider">
              Gäller till och med
            </Label>
            <Input
              id="quote-expiry"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 max-w-[200px]"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider">Rader</Label>
            <div className="mt-2 space-y-2">
              {lines.map((l) => (
                <div key={l.key} className="grid grid-cols-[1fr_70px_120px_36px] gap-2 items-start">
                  <Input
                    placeholder="Beskrivning (t.ex. Hotell + transfer 4 nätter)"
                    value={l.description}
                    onChange={(e) => updateLine(l.key, { description: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={1}
                    value={l.qty}
                    onChange={(e) => updateLine(l.key, { qty: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="Pris SEK"
                    value={l.unit_price_sek || ""}
                    onChange={(e) => updateLine(l.key, { unit_price_sek: Math.max(0, Number(e.target.value) || 0) })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(l.key)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-3 w-3 mr-1" /> Lägg till rad
              </Button>
            </div>
          </div>

          <div className="border-t pt-3 flex items-center justify-between">
            <span className="text-sm font-medium">Totalt</span>
            <span className="font-display text-2xl">
              {new Intl.NumberFormat("sv-SE").format(total)} SEK
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={submitting}>
            {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
            Skicka offert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
