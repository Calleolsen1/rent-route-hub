## Goal

Bring the public marketing pages in line with the new Home page styling. Keep each page's existing structure and content — only update tokens, colors, typography, spacing, and small component styles.

## Pages in scope

- `About.tsx`
- `Contact.tsx`
- `Services.tsx` + all 6 sub-services in `src/pages/services/` (Sportresor, Konferens, VIPService, WeekendGetaway, Affarsresor, Traningslager)
- `GroupTravel.tsx`
- `BecomeHost.tsx`
- `FAQ.tsx`
- `HelpCenter.tsx`
- `Support.tsx`

Out of scope: portal pages (admin/guest/host/mitt-kaisen), auth pages, search/listing/checkout flow.

## Style rules to apply (matches Home)

1. **Backgrounds**
   - Remove all hard `bg-cream` blanket sections that span entire pages. Use `bg-background` (white) as the default, and break up long pages with **alternating `bg-cream` (light gray) bands** for separation — same pattern as Home's Om oss / Referenser.
   - No beige, no warm off-white — `--cream` is already the light gray token.

2. **Typography**
   - Replace `font-display` (serif) headings with `font-sans font-semibold` to match Home's Intrepid-style sans hierarchy.
   - Page hero H1: `text-3xl md:text-5xl font-sans font-semibold`.
   - Section H2: `text-2xl md:text-4xl font-sans font-semibold`.
   - Card H3: `text-lg md:text-xl font-sans font-semibold`.
   - Body: `text-base text-foreground/80 leading-relaxed`.
   - Keep the small `italic font-light` accent flourish (like Home's "samtal") only on hero or key CTA headings where it already exists.

3. **Hero sections**
   - Tighten over-tall hero banners (most pages use full-screen-ish heroes). Cap at `py-16 md:py-24` with a navy or image background, white text, no serif.
   - Underline accent: short `h-[3px] w-16 bg-primary rounded-full` under H2s, like Home's "Upplevelser som formar minnen".

4. **Section padding**
   - Default to `py-10 md:py-14` (matches Home's new tightened bands).
   - Remove `kaisen-section` (py-20 md:py-28) usage on these pages — too tall.

5. **Cards & images**
   - Service/feature cards: `bg-card rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]`, `aspect-[4/3]` images, gradient overlay `from-black/55 via-black/10 to-transparent`, white title bottom-left.
   - Replace any beige/cream card backgrounds with `bg-card` or `bg-background`.

6. **CTAs**
   - Primary button: `rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-7 py-3 text-sm font-semibold`.
   - Outline button: `rounded-full border border-border text-foreground hover:bg-foreground hover:text-background px-5 py-2.5`.
   - On dark/navy backgrounds: white button with navy text (matches "Börja planera nu").

7. **Contact CTA block** (reused on About, Services, sub-services, GroupTravel, BecomeHost)
   - Match Home's bottom CTA: rounded-3xl navy card with blurred gold orbs, white headline with gold italic accent, white pill button.

## Page-by-page notes

- **About** — Drop the two `bg-cream` full-page sections; alternate background/cream once. Convert all serif headings to sans. Stats row stays but switch from serif numerals to sans bold.
- **Contact** — Replace `kaisen-section bg-cream` with `py-10 md:py-14 bg-background`. Form card on white with subtle border. Sidebar contact info: switch icons to gold accents, sans headings.
- **Services** + 6 sub-services — Unify hero pattern (navy band, sans H1, short description). Replace the cream "intro quote" band with white + larger sans pull-quote. Service grids use the Home card pattern.
- **GroupTravel / BecomeHost** — Same hero + alternating-band treatment. Reuse the Home contact CTA block at page bottom.
- **FAQ** — Sticky category filter loses `bg-cream`, becomes `bg-background border-b`. Question text: `font-sans font-medium`. Bottom "Hittar du inte svaret?" band: switch to `bg-cream` for separation.
- **HelpCenter / Support** — Same token/typography swap, tighten section padding, white card grid on light gray band.

## What stays untouched

- All copy and routing.
- Page-level data structures (faq lists, service arrays, contact info).
- Footer and Header (already updated).
- Portal, auth, and booking flow pages.

## Order of execution

1. About, Contact, Services (highest-traffic).
2. Six sub-service pages.
3. GroupTravel, BecomeHost.
4. FAQ, HelpCenter, Support.

I will batch edits per file and not change layout structure — only swap classes/tokens.
