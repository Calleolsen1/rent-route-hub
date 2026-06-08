## Restore the hero search bar

The Intrepid-style search bar above the hero was removed in a recent change. I'll add it back exactly as it was, sitting between the navbar and the hero carousel on the Home page.

### What it looks like
A single rounded pill, full-width (max 4xl, centered), containing:
- MapPin icon + text input — placeholder "Sök destination, lag, race eller resetyp..."
- Vertical divider + date range trigger (Calendar icon, "När?")
- Primary "Sök" button with search icon

### Behavior
- Submitting navigates to `/search?q=<query>` (or `/search` if empty), matching the previous implementation.
- Note: there is no `/search` route yet, so the destination page will 404 until built. I can scaffold a basic search results page in a follow-up if you want — let me know.

### Files
- `src/pages/Home.tsx` — re-add `heroQuery` state, `handleHeroSearch`, and the `<section>` containing the form, placed directly under `<Navbar />` and above the hero carousel.

No other files change.