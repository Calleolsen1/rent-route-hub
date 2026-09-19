import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export type InquiryType =
  | "group"
  | "conference"
  | "training_camp"
  | "vip"
  | "contact";

type Props = {
  type: InquiryType;
  /** Label shown above the form, e.g. "Få ett skräddarsytt förslag". */
  eyebrow?: string;
  /** Headline, e.g. "Berätta om er resa". */
  heading?: string;
  /** Optional small paragraph under the headline. */
  intro?: string;
  /** Optional preset value placed in the sport_or_topic field, hidden from user. */
  presetTopic?: string;
  /** Optional preset value for the destination field. */
  defaultDestination?: string;
  /** Show the Group Size field. Default: true for group/conference/training_camp. */
  showGroupSize?: boolean;
  /** Show destination field. Default: true for group/training_camp. */
  showDestination?: boolean;
  /** Show preferred-dates fields. Default: true except for contact. */
  showDates?: boolean;
  /** Show budget field. Default: true for group/conference/vip. */
  showBudget?: boolean;
  /**
   * Show the Hotell / Biljett / Flyg picker. The site sells packages on
   * request rather than single items through a checkout, so the first thing
   * ops needs to know is which parts of the trip the customer wants.
   */
  showTripParts?: boolean;
  /** Trip parts ticked on open, e.g. ["biljett"] from an event page. */
  defaultTripParts?: readonly string[];
};

/** The three things a Kaisen trip is assembled from. */
const TRIP_PARTS = [
  { id: "hotell", label: "Hotell" },
  { id: "biljett", label: "Biljett" },
  { id: "flyg", label: "Flyg" },
] as const;

type TripPart = (typeof TRIP_PARTS)[number]["id"];

const FormSchema = z.object({
  name: z.string().trim().min(2, "Ange ditt namn").max(120),
  email: z.string().trim().email("Ogiltig e-postadress").max(255),
  phone: z.string().trim().min(4, "Ange telefonnummer").max(40),
  company: z.string().trim().max(160).optional(),
  group_size: z.string().optional(),
  preferred_dates_start: z.string().optional(),
  preferred_dates_end: z.string().optional(),
  destination: z.string().trim().max(160).optional(),
  budget_sek: z.string().optional(),
  message: z.string().trim().min(5, "Skriv ett kort meddelande").max(4000),
});

const defaultFor = (type: InquiryType, key: keyof Props) => {
  const map: Record<InquiryType, Partial<Record<keyof Props, boolean>>> = {
    group: { showGroupSize: true, showDestination: true, showDates: true, showBudget: true },
    conference: { showGroupSize: true, showDates: true, showBudget: true },
    training_camp: { showGroupSize: true, showDestination: true, showDates: true, showBudget: false },
    vip: { showBudget: true, showDates: true },
    contact: {},
  };
  return map[type][key] ?? false;
};

export default function InquiryForm({
  type,
  eyebrow = "Skicka förfrågan",
  heading = "Berätta om er resa",
  intro,
  presetTopic,
  defaultDestination,
  showGroupSize,
  showDestination,
  showDates,
  showBudget,
  showTripParts = false,
  defaultTripParts,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [tripParts, setTripParts] = useState<TripPart[]>(
    () => TRIP_PARTS.filter((p) => defaultTripParts?.includes(p.id)).map((p) => p.id),
  );

  const toggleTripPart = (id: TripPart) =>
    setTripParts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const fieldShowGroupSize = showGroupSize ?? defaultFor(type, "showGroupSize");
  const fieldShowDestination = showDestination ?? defaultFor(type, "showDestination");
  const fieldShowDates = showDates ?? defaultFor(type, "showDates");
  const fieldShowBudget = showBudget ?? defaultFor(type, "showBudget");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const fd = new FormData(e.currentTarget);
    const raw = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      company: String(fd.get("company") ?? ""),
      group_size: String(fd.get("group_size") ?? ""),
      preferred_dates_start: String(fd.get("preferred_dates_start") ?? ""),
      preferred_dates_end: String(fd.get("preferred_dates_end") ?? ""),
      destination: String(fd.get("destination") ?? ""),
      budget_sek: String(fd.get("budget_sek") ?? ""),
      message: String(fd.get("message") ?? ""),
    };

    if (showTripParts && tripParts.length === 0) {
      setErrors({ trip_parts: "Välj minst en del - hotell, biljett eller flyg" });
      return;
    }

    const parsed = FormSchema.safeParse(raw);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const out: Record<string, string> = {};
      Object.entries(flat).forEach(([k, v]) => {
        if (v && v[0]) out[k] = v[0];
      });
      setErrors(out);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company: parsed.data.company || undefined,
        group_size: parsed.data.group_size
          ? Number(parsed.data.group_size)
          : undefined,
        preferred_dates_start: parsed.data.preferred_dates_start || undefined,
        preferred_dates_end: parsed.data.preferred_dates_end || undefined,
        destination: parsed.data.destination || undefined,
        budget_sek: parsed.data.budget_sek
          ? Number(parsed.data.budget_sek)
          : undefined,
        // Fold the trip parts into sport_or_topic so they land in the
        // notification email next to the event, without a schema change on
        // submit-inquiry.
        sport_or_topic: [
          presetTopic,
          tripParts.length
            ? `Önskar: ${tripParts
                .map((id) => TRIP_PARTS.find((p) => p.id === id)?.label ?? id)
                .join(" + ")}`
            : null,
        ].filter(Boolean).join(" · ") || undefined,
        message: parsed.data.message,
        source_page:
          typeof window !== "undefined" ? window.location.pathname : undefined,
        turnstile_token: turnstileToken ?? undefined,
      };

      const { data, error } = await supabase.functions.invoke("submit-inquiry", {
        body: payload,
      });

      if (error || !data?.ok) {
        throw new Error(error?.message || "Något gick fel");
      }
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setServerError(
        "Vi kunde inte ta emot din förfrågan just nu. Försök igen eller mejla info@kaisengroup.se."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Render Turnstile widget into the form; defaults to invisible when the
  // env var isn't set (component returns null).
  if (submitted) {
    return (
      <div className="bg-white border border-border p-10 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-display text-2xl mb-3">Tack - vi har tagit emot din förfrågan</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          En bekräftelse är på väg till din e-post. Vi återkommer normalt inom 24
          timmar på vardagar.
        </p>
      </div>
    );
  }

  const inputCls = "rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border p-6 md:p-10 space-y-5">
      <div className="mb-2">
        {eyebrow && (
          <p className="text-[11px] tracking-[0.3em] text-primary uppercase mb-3 font-sans font-semibold">
            {eyebrow}
          </p>
        )}
        <h3 className="font-display text-3xl">{heading}</h3>
        {intro && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{intro}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-xs uppercase tracking-wider">Namn *</Label>
          <Input id="name" name="name" required maxLength={120} className={inputCls} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="email" className="text-xs uppercase tracking-wider">E-post *</Label>
          <Input id="email" name="email" type="email" required maxLength={255} className={inputCls} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="phone" className="text-xs uppercase tracking-wider">Telefon *</Label>
          <Input id="phone" name="phone" type="tel" required maxLength={40} className={inputCls} />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
        <div>
          <Label htmlFor="company" className="text-xs uppercase tracking-wider">Företag (valfritt)</Label>
          <Input id="company" name="company" maxLength={160} className={inputCls} />
        </div>

        {fieldShowGroupSize && (
          <div>
            <Label htmlFor="group_size" className="text-xs uppercase tracking-wider">Antal personer</Label>
            <Input id="group_size" name="group_size" type="number" min={1} max={10000} className={inputCls} />
          </div>
        )}
        {fieldShowDestination && (
          <div>
            <Label htmlFor="destination" className="text-xs uppercase tracking-wider">Destination</Label>
            <Input id="destination" name="destination" maxLength={160} defaultValue={defaultDestination} key={defaultDestination} className={inputCls} />
          </div>
        )}
        {fieldShowDates && (
          <>
            <div>
              <Label htmlFor="preferred_dates_start" className="text-xs uppercase tracking-wider">Önskat datum (från)</Label>
              <Input id="preferred_dates_start" name="preferred_dates_start" type="date" className={inputCls} />
            </div>
            <div>
              <Label htmlFor="preferred_dates_end" className="text-xs uppercase tracking-wider">Önskat datum (till)</Label>
              <Input id="preferred_dates_end" name="preferred_dates_end" type="date" className={inputCls} />
            </div>
          </>
        )}
        {fieldShowBudget && (
          <div className="md:col-span-2">
            <Label htmlFor="budget_sek" className="text-xs uppercase tracking-wider">Ungefärlig budget (SEK)</Label>
            <Input id="budget_sek" name="budget_sek" type="number" min={0} step={1000} className={inputCls} />
          </div>
        )}
      </div>

      {showTripParts && (
        <div>
          <Label className="text-xs uppercase tracking-wider">Vad vill ni ha offert på? *</Label>
          <p className="text-[11px] text-muted-foreground mt-1 mb-2">
            Välj en, två eller alla tre - vi sätter ihop paketet och återkommer med pris.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TRIP_PARTS.map((part) => {
              const active = tripParts.includes(part.id);
              return (
                <button
                  key={part.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTripPart(part.id)}
                  className={`rounded-lg border px-3 py-3 text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-foreground font-medium"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {part.label}
                </button>
              );
            })}
          </div>
          {errors.trip_parts && (
            <p className="text-xs text-destructive mt-2">{errors.trip_parts}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="message" className="text-xs uppercase tracking-wider">Meddelande *</Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          maxLength={4000}
          className={`${inputCls} resize-none`}
          placeholder="Berätta gärna mer om er resa, era önskemål och vad ni vill uppleva."
        />
        {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
      </div>

      <TurnstileWidget onToken={setTurnstileToken} />

      {serverError && (
        <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 px-4 py-3">
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="rounded-none px-8 tracking-wider text-xs bg-primary hover:bg-primary/90 h-11"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Skickar...
          </>
        ) : (
          "Skicka förfrågan"
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Genom att skicka formuläret godkänner du att vi kontaktar dig angående din förfrågan.
      </p>
    </form>
  );
}
