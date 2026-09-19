export const formatSek = (amount: number | string | null | undefined) => {
  const n = typeof amount === "string" ? Number(amount) : amount ?? 0;
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(n);
};

export const TZ = "Europe/Stockholm";

export const formatEventDate = (iso: string) =>
  new Date(iso).toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });

export const formatEventDateTime = (iso: string) =>
  new Date(iso).toLocaleString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });

/** Kort datum t.ex. "19 sep" (alltid svensk tid). */
export const svDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", timeZone: TZ });

/** Datum med år t.ex. "19 sep 2026" (alltid svensk tid). */
export const svDateFull = (iso: string) =>
  new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });

/** Klockslag t.ex. "19:30" (alltid svensk tid). */
export const svTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

/** ÅÅÅÅ-MM-DD för ett datum i svensk tid. */
export const svYmd = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof iso === "string" ? new Date(iso) : iso
  );

/** Minuter mellan UTC och svensk tid vid ett givet ögonblick. */
const stockholmOffsetMinutes = (date: Date) => {
  const parts: Record<string, string> = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)) {
    parts[type] = value;
  }
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    parts.hour === "24" ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - date.getTime()) / 60000;
};

/** Tolkar "YYYY-MM-DDTHH:mm" som svensk tid och ger ISO-sträng i UTC. */
export const stockholmLocalToIso = (local: string) => {
  const epoch = Date.parse(`${local}:00Z`);
  const off = stockholmOffsetMinutes(new Date(epoch));
  return new Date(epoch - off * 60000).toISOString();
};

/** Nuvarande svensk lokal tid som "YYYY-MM-DDTHH:mm" (för datetime-local-fält). */
export const stockholmNowLocal = () => {
  const now = new Date();
  const off = stockholmOffsetMinutes(now);
  return new Date(now.getTime() + off * 60000).toISOString().slice(0, 16);
};

/** Svensk lokal tid N dagar framåt, som "YYYY-MM-DDTHH:mm". */
export const stockholmTodayPlusDays = (days: number) => {
  const d = new Date(`${stockholmNowLocal()}:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 16);
};
