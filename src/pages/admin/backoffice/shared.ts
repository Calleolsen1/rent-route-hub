export type BookingStatus =
  | "draft"
  | "unanswered"
  | "confirmed"
  | "paid"
  | "completed"
  | "cancelled";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  draft: "Utkast",
  unanswered: "Obesvarad",
  confirmed: "Bekräftad",
  paid: "Betald",
  completed: "Genomförd",
  cancelled: "Avbokad",
};

/** Statusar som kan väljas i menyerna. */
export const BOOKING_STATUS_OPTIONS: BookingStatus[] = [
  "draft",
  "unanswered",
  "confirmed",
  "completed",
];

export type ItemType = "hotel" | "flight" | "ticket" | "transfer" | "other";

export const ITEM_LABEL: Record<ItemType, string> = {
  hotel: "Hotell",
  flight: "Flyg",
  ticket: "Biljetter",
  transfer: "Transfer",
  other: "Övrigt",
};

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partly_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Utkast",
  sent: "Skickad",
  partly_paid: "Delbetald",
  paid: "Betald",
  overdue: "Förfallen",
  cancelled: "Makulerad",
};

export const formatSek = (value: number | null | undefined) =>
  new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
