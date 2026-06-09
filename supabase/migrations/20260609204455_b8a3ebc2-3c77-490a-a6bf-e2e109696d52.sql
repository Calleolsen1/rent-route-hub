ALTER TABLE public.nav_menu_entries
  ADD COLUMN IF NOT EXISTS show_in_menu boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_nav_menu_entries_show_in_menu
  ON public.nav_menu_entries (sport_id, show_in_menu)
  WHERE is_active = true;