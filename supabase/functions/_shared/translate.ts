// Swedish text for supplier ticket categories, via Claude.
//
// Travel Connection writes category descriptions in English ("Long side
// LATERAL UPPER", "no away colours"). The public site is Swedish-only, so
// each category is translated ONCE when first seen and stored in
// tc_ticket_category_info (description_sv); page views read the stored text
// and never call the model. An admin can overwrite the Swedish text by hand.
//
// Needs the ANTHROPIC_API_KEY function secret. Without it, or if a call
// fails, the English text is used and the next lookup tries again —
// translation is never allowed to take prices off the page.

import Anthropic from "npm:@anthropic-ai/sdk@0.128.0";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@0.128.0/helpers/zod";
import { z } from "npm:zod@4.6.5";

const Translation = z.object({
  name: z.string(),
  lines: z.array(z.string()),
});

const SYSTEM = `You translate ticket-category descriptions for a Swedish sports-travel agency's website into natural, customer-friendly Swedish.

Keep every fact exactly: stand, tier, block and row names, times, what is included, restrictions. Do not add, drop or soften anything — a rule like "away team support prohibited" must stay a clear rule. Keep proper nouns (stadium stands, lounges, bars, block codes like AM1) untranslated. Write prices and times as given.

Return one Swedish line per input line, in the same order. For the name: "CAT 2" style names become "Kategori 2"; translate other names naturally.`;

let client: Anthropic | null = null;

/** Swedish name + lines, or null when translation isn't available right now. */
export async function translateCategory(
  name: string,
  lines: string[],
): Promise<{ name: string; lines: string[] } | null> {
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return null;
  if (!lines.length && !name) return null;
  client ??= new Anthropic();

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
    const out = response.parsed_output;
    // A dropped or merged line would silently lose a rule; keep English then.
    if (out.lines.length !== lines.length) {
      console.warn("[translate] line count changed", lines.length, "->", out.lines.length);
      return null;
    }
    return { name: out.name.trim() || name, lines: out.lines.map((l) => l.trim()) };
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.warn(`[translate] API error ${e.status}:`, e.message);
    } else {
      console.warn("[translate] failed:", (e as Error).message);
    }
    return null;
  }
}
