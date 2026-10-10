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

// The SDK and zod are loaded on first use, not at import: this module sits
// in the ticket-lookup path, and translation only ever runs in the
// background, so every cold start would otherwise pay for loading them.
type AnthropicModule = typeof import("https://esm.sh/@anthropic-ai/sdk@0.128.0");
let sdk: Promise<{
  Anthropic: AnthropicModule["default"];
  zodOutputFormat: typeof import("https://esm.sh/@anthropic-ai/sdk@0.128.0/helpers/zod")["zodOutputFormat"];
  z: typeof import("https://esm.sh/zod@4.6.5")["z"];
}> | null = null;

function loadSdk() {
  sdk ??= Promise.all([
    import("https://esm.sh/@anthropic-ai/sdk@0.128.0"),
    import("https://esm.sh/@anthropic-ai/sdk@0.128.0/helpers/zod"),
    import("https://esm.sh/zod@4.6.5"),
  ]).then(([a, h, zod]) => ({ Anthropic: a.default, zodOutputFormat: h.zodOutputFormat, z: zod.z }));
  return sdk;
}

const SYSTEM = `You translate ticket-category descriptions for a Swedish sports-travel agency's website into natural, customer-friendly Swedish.

Keep every fact exactly: stand, tier, block and row names, times, what is included, restrictions. Do not add, drop or soften anything — a rule like "away team support prohibited" must stay a clear rule. Keep proper nouns (stadium stands, lounges, bars, block codes like AM1) untranslated. Write prices and times as given.

Return one Swedish line per input line, in the same order. For the name: "CAT 2" style names become "Kategori 2"; translate other names naturally.`;

// deno-lint-ignore no-explicit-any
let client: any = null;

/** Swedish name + lines, or null when translation isn't available right now. */
export async function translateCategory(
  name: string,
  lines: string[],
): Promise<{ name: string; lines: string[] } | null> {
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return null;
  if (!lines.length && !name) return null;
  const { Anthropic, zodOutputFormat, z } = await loadSdk();
  client ??= new Anthropic();
  const Translation = z.object({ name: z.string(), lines: z.array(z.string()) });

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4000,
      // A short, literal translation: little to reason about.
      output_config: { effort: "low", format: zodOutputFormat(Translation) },
      system: SYSTEM,
      messages: [{
        role: "user",
        content: JSON.stringify({ name, lines }),
      }],
    });
    if (response.stop_reason !== "end_turn" || !response.parsed_output) {
      console.warn("[translate] no usable output:", response.stop_reason);
      return null;
    }
    const out = response.parsed_output as { name: string; lines: string[] };
    // A dropped or merged line would silently lose a rule; keep English then.
    if (out.lines.length !== lines.length) {
      console.warn("[translate] line count changed", lines.length, "->", out.lines.length);
      return null;
    }
    return { name: out.name.trim() || name, lines: out.lines.map((l) => l.trim()) };
  } catch (e) {
    // API errors carry a numeric status; anything else is a load/network failure.
    const err = e as { status?: number; message?: string };
    if (typeof err?.status === "number") {
      console.warn(`[translate] API error ${err.status}:`, err.message);
    } else {
      console.warn("[translate] failed:", err?.message ?? String(e));
    }
    return null;
  }
}
