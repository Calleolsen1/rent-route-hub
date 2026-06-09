-- "Visa i meny" toggle on each entry.
--
-- Decouples "is this page live and reachable?" (is_active) from "does it
-- appear in the navbar dropdown?" (show_in_menu). Lets admin keep large
-- catalogs of team / race landing pages without bloating the dropdown.
--
-- Active + show_in_menu  → shows everywhere
-- Active + hide_from_menu → URL works, dropdown skips
-- Inactive               → nothing renders

ALTER TABLE public.nav_menu_entries
  ADD COLUMN IF NOT EXISTS show_in_menu boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_nav_menu_entries_show_in_menu
  ON public.nav_menu_entries (sport_id, show_in_menu)
  WHERE is_active = true;
