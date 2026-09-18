/**
 * Global helpers for number inputs (prices, quantities).
 * - On focus: select all content so typing overwrites it (no need to backspace "05000").
 * - On input: strip leading zeros so "05000" becomes "5000" ("0" alone is kept).
 */
export function installNumberInputHelpers() {
  if (typeof document === "undefined") return;

  const isNumberInput = (el: EventTarget | null): el is HTMLInputElement =>
    el instanceof HTMLInputElement && el.type === "number";

  document.addEventListener("focusin", (e) => {
    if (isNumberInput(e.target)) {
      // Defer so the browser has finished its own focus handling first.
      window.setTimeout(() => e.target.select(), 0);
    }
  });

  document.addEventListener("input", (e) => {
    if (!isNumberInput(e.target)) return;
    const input = e.target;
    const value = input.value;
    // Strip leading zeros when followed by another digit; keep "0" and "0.5".
    const cleaned = value.replace(/^0+(?=[0-9])/, "");
    if (cleaned !== value) {
      input.value = cleaned;
    }
  });
}
