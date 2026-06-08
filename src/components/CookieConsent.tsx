import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/**
 * Lightweight cookie consent banner.
 *
 * We currently only use cookies that are strictly necessary (Supabase auth
 * session, Stripe session during checkout), so even "endast nödvändiga"
 * doesn't disable anything today. The structure is in place for when we add
 * analytics or marketing cookies — gate those behind `getCookieConsent() === "all"`.
 *
 * Stored in localStorage so it survives reloads but not cross-device. Reset
 * via the "Cookie-inställningar" link in the footer.
 */
const STORAGE_KEY = "kaisen_cookie_consent_v1";

export type ConsentChoice = "all" | "essential";

export function getCookieConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "all" || stored === "essential") return stored;
  return null;
}

export function clearCookieConsent() {
  window.localStorage.removeItem(STORAGE_KEY);
  // Dispatch event so the banner re-renders without a page reload
  window.dispatchEvent(new CustomEvent("kaisen-consent-changed"));
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => setVisible(getCookieConsent() === null);
    check();
    window.addEventListener("kaisen-consent-changed", check);
    return () => window.removeEventListener("kaisen-consent-changed", check);
  }, []);

  if (!visible) return null;

  const choose = (c: ConsentChoice) => {
    window.localStorage.setItem(STORAGE_KEY, c);
    window.dispatchEvent(new CustomEvent("kaisen-consent-changed"));
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie-inställningar"
      className="fixed bottom-4 inset-x-4 md:left-auto md:right-6 md:max-w-md z-50 rounded-xl border border-border bg-card shadow-2xl"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="font-display text-lg">Vi använder cookies</h2>
          <button
            onClick={() => choose("essential")}
            aria-label="Stäng — endast nödvändiga cookies"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground mb-4">
          Vi använder nödvändiga cookies för att webbplatsen ska fungera (inloggning, kundvagn, betalning). Du kan välja att tillåta valfria cookies för att hjälpa oss förbättra sajten. Läs mer i vår{" "}
          <Link to="/integritetspolicy" className="underline">integritetspolicy</Link>.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => choose("essential")}
          >
            Endast nödvändiga
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => choose("all")}
          >
            Acceptera alla
          </Button>
        </div>
      </div>
    </div>
  );
}
