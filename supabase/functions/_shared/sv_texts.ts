// Swedish for supplier texts that have no Swedish of their own: XS2
// category names/descriptions and P1 ticket names. Translated ONCE per
// text by Claude (translate.ts), in the background after a page view first
// sees it, and stored in supplier_texts_sv. Page views only read stored
// Swedish and never wait for the model; until it exists the caller shows
// its fallback. An admin edit (sv_source = 'manual') is never overwritten.
//
// A row is current while translated_from equals the source it was made
// from, so a supplier changing its English text re-translates once.

import { translateCategory, translationSource } from "./translate.ts";
import { background } from "./background.ts";

// deno-lint-ignore no-explicit-any
type Db = any;

export interface SvItem {
  key: string;
  name: string;
  lines: string[];
}

export interface SvText {
  name: string;
  lines: string[];
}

interface Row {
  supplier: string;
  key: string;
  name_sv: string | null;
  lines_sv: string[] | null;
  translated_from: string[] | null;
  sv_source: "ai" | "manual" | null;
}

const RETRY_MS = 6 * 3_600_000;
const tried = new Map<string, number>();
const source = (i: SvItem) => translationSource([i.name, ...i.lines]);
const same = (a: string[] | null, b: string[]) => JSON.stringify(a ?? []) === JSON.stringify(b);

/** Stored Swedish per key (only current translations), translating the rest in the background. */
export async function svTexts(db: Db, supplier: string, items: SvItem[]): Promise<{ sv: Map<string, SvText>; translating: boolean }> {
  const sv = new Map<string, SvText>();
  const unique = [...new Map(items.filter((i) => i.name || i.lines.length).map((i) => [i.key, i])).values()];
  if (!unique.length) return { sv, translating: false };

  const rows = new Map<string, Row>();
  for (let i = 0; i < unique.length; i += 200) {
    const { data } = await db
      .from("supplier_texts_sv")
      .select("supplier, key, name_sv, lines_sv, translated_from, sv_source")
      .eq("supplier", supplier)
      .in("key", unique.slice(i, i + 200).map((x) => x.key));
    for (const r of (data ?? []) as Row[]) rows.set(r.key, r);
  }

  const todo: SvItem[] = [];
  for (const item of unique) {
    const r = rows.get(item.key);
    const current = r && (r.sv_source === "manual" || same(r.translated_from, source(item)));
    if (current && r.name_sv != null) {
      // A manual row keeps its lines only while the line count still fits.
      const lines = r.lines_sv && r.lines_sv.length === item.lines.length ? r.lines_sv : item.lines;
      sv.set(item.key, { name: r.name_sv, lines });
    }
    if (!current && Date.now() - (tried.get(`${supplier}:${item.key}`) ?? 0) > RETRY_MS) todo.push(item);
  }

  if (todo.length) {
    background(`sv ${supplier}`, (async () => {
      // A few at a time: a new stadium can bring dozens of categories.
      for (let i = 0; i < todo.length; i += 4) {
        await Promise.all(todo.slice(i, i + 4).map(async (item) => {
          tried.set(`${supplier}:${item.key}`, Date.now());
          const out = await translateCategory(item.name, item.lines);
          if (!out) return;
          const { error } = await db.from("supplier_texts_sv").upsert({
            supplier,
            key: item.key,
            name_en: item.name,
            lines_en: item.lines,
            name_sv: out.name,
            lines_sv: out.lines,
            translated_from: source(item),
            sv_source: "ai",
            translated_at: new Date().toISOString(),
          }, { onConflict: "supplier,key" });
          if (error) console.warn("[sv_texts] upsert:", error.message);
        }));
      }
    })());
  }
  return { sv, translating: todo.length > 0 };
}
