import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import { installNumberInputHelpers } from "./lib/numberInput";
import "./index.css";

// Frontend error monitoring. Defensive: only initializes when VITE_SENTRY_DSN
// is set. No-op (and zero runtime cost beyond a single null check) when unset,
// so dev + pre-Sentry-signup environments still work normally.
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Conservative defaults — bump tracesSampleRate to 0.1+ for performance
    // monitoring once traffic warrants the volume.
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [],
  });
}

installNumberInputHelpers();

createRoot(document.getElementById("root")!).render(<App />);
