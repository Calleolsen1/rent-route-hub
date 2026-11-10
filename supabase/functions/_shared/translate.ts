// Swedish text for supplier ticket categories, via Claude.
//
// Travel Connection writes category descriptions in English ("Long side
// LATERAL UPPER", "no away colours"). The public site is Swedish-only, so
// each category is translated ONCE, in the background after a page view
// first sees it, and stored in tc_ticket_category_info (description_sv);
// page views read the stored text and never wait for the model. An admin can
// overwrite the Swedish text by hand.
//
// Needs the ANTHROPIC_API_KEY function secret. Without it, or if a call
// fails, the English text is shown and the category is retried after a
// back-off (see tc_pricing.ts) — never on every view.

// The SDK is loaded on first use, not at import: this module sits in the
// ticket-lookup path, and translation only ever runs in the background, so
// every cold start would otherwise pay for loading it.
type AnthropicModule = typeof import("https://esm.sh/@anthropic-ai/sdk@0.128.0");
let sdk: Promise<AnthropicModule["default"]> | null = null;
const loadSdk = () => (sdk ??= import("https://esm.sh/@anthropic-ai/sdk@0.128.0").then((m) => m.default));

const SYSTEM = `You translate ticket-category descriptions for a Swedish sports-travel agency's website into natural, customer-friendly Swedish.

Keep every fact exactly: stand, tier, block and row names, times, what is included, restrictions. Do not add, drop or soften anything — a rule like "away team support prohibited" must stay a clear rule. Keep proper nouns (stadium stands, lounges, bars, block codes like AM1) untranslated. Write prices and times as given.

Ticket terms: "General Admission" stays "General Admission" (at football it is an ordinary seated ticket, at F1 an unseated area - never call it standing or "ståplats"). "Padded seats" are "vadderade säten". "Hospitality" stays "hospitality".

Return one Swedish line per input line, in the same order. For the name: "CAT 2" style names become "Kategori 2"; translate other names naturally.`;

/**
 * Bumped when the translation instructions change: stored translations made
 * from an older version are redone once (translated_from carries the mark).
 */
export const TRANSLATION_VERSION = "@sv2";
/** What translated_from must equal for a translation of `lines` to be current. */
export const translationSource = (lines: string[] | null | undefined) => [TRANSLATION_VERSION, ...(lines ?? [])];

// Plain JSON schema (no zod): one fewer library to load from the CDN.
const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    lines: { type: "array", items: { type: "string" } },
  },
  required: ["name", "lines"],
  additionalProperties: false,
};

// deno-lint-ignore no-explicit-any
let client: any = null;

/**
 * Swedish name + lines. Throws with a readable reason when it can't
 * (no key, SDK load, API error, refusal, changed line count) - used by the
 * admin config check to show why translations aren't happening.
 */
export async function translateCategoryStrict(name: string, lines: string[]): Promise<{ name: string; lines: string[] }> {
  if (!Deno.env.get("ANTHROPIC_API_KEY")) throw new Error("ANTHROPIC_API_KEY saknas");
  const Anthropic = await loadSdk();
  client ??= new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // A short, literal translation: little to reason about.
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify({ name, lines }) }],
  });
  if (response.stop_reason !== "end_turn") throw new Error(`stop_reason ${response.stop_reason}`);
  // deno-lint-ignore no-explicit-any
  const text = (response.content as any[]).find((b) => b.type === "text")?.text ?? "";
  const out = JSON.parse(text) as { name: string; lines: string[] };
  // A dropped or merged line would silently lose a rule; keep English then.
  if (!Array.isArray(out.lines) || out.lines.length !== lines.length) {
    throw new Error(`line count changed ${lines.length} -> ${out.lines?.length}`);
  }
  return { name: (out.name ?? "").trim() || name, lines: out.lines.map((l) => String(l).trim()) };
}

/** Swedish name + lines, or null when translation isn't available right now (reason logged). */
export async function translateCategory(
  name: string,
  lines: string[],
): Promise<{ name: string; lines: string[] } | null> {
  if (!lines.length && !name) return null;
  try {
    return await translateCategoryStrict(name, lines);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    console.warn(`[translate] ${typeof err?.status === "number" ? `API error ${err.status}: ` : ""}${err?.message ?? String(e)}`);
    return null;
  }
}
