import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget - invisible-friendly captcha.
 *
 * Defensive: when no `VITE_TURNSTILE_SITE_KEY` env is configured, this
 * component renders nothing and the parent form should submit without a
 * token. The matching backend code (submit-inquiry) likewise skips
 * verification when `TURNSTILE_SECRET_KEY` env is unset. Pair both keys
 * to turn on captcha.
 */
type Props = {
  onToken: (token: string | null) => void;
  className?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileWidget({ onToken, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  // Load the Turnstile script once per page
  useEffect(() => {
    if (!siteKey) return;
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => setScriptLoaded(true);
    document.head.appendChild(s);
  }, [siteKey]);

  // Render the widget into our container once script is ready
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !siteKey || !window.turnstile) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
      theme: "auto",
    });
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={containerRef} className={className} />;
}
