-- One ticket list from two suppliers (Travel Connection + P1 Travel).
--
-- The suppliers name the same seats differently ("East Premium Seat Package,
-- halfway line" vs "Travel Club Premium 002-003"), so duplicates can't be
-- found by name. Instead KAISEN keeps its own categories per stadium
-- (seat_categories) and each supplier category is linked to one of them
-- (supplier_category_links). The page shows one row per seat category and
-- sells it through whichever supplier has the better offer.
--
-- Supplier category ids are stable per stadium, so a link made once holds
-- for every match there. Unlinked supplier categories still show on the page
-- as their own rows (cleaned up), and land in admin to be linked.
--
-- venue_key is OUR stadium name (events.venue_name, or race_name for F1), so
-- both suppliers resolve to the same key.

CREATE TABLE IF NOT EXISTS public.seat_categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_key    text NOT NULL,
  name         text NOT NULL,
  description  text[] NOT NULL DEFAULT '{}',
  tier         text NOT NULL DEFAULT 'match' CHECK (tier IN ('match', 'hospitality')),
  color        text,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seat_categories_venue_idx ON public.seat_categories(venue_key);

CREATE TABLE IF NOT EXISTS public.supplier_category_links (
  supplier              text NOT NULL CHECK (supplier IN ('travelconnection', 'p1')),
  supplier_category_id  text NOT NULL,
  venue_key             text NOT NULL,
  seat_category_id      uuid REFERENCES public.seat_categories(id) ON DELETE SET NULL,
  hidden                boolean NOT NULL DEFAULT false,
  -- Last seen on the page, for the admin list (written by event-tickets).
  supplier_name         text,
  supplier_description  text[],
  supplier_color        text,
  tier_guess            text,
  sample_price_sek      integer,
  sample_event_id       uuid REFERENCES public.events(id) ON DELETE SET NULL,
  first_seen_at         timestamptz NOT NULL DEFAULT now(),
  last_seen_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (supplier, supplier_category_id, venue_key)
);
CREATE INDEX IF NOT EXISTS supplier_category_links_venue_idx ON public.supplier_category_links(venue_key);

-- P1 category content (name/description/image), cached and translated to
-- Swedish once, like tc_ticket_category_info for Travel Connection.
CREATE TABLE IF NOT EXISTS public.p1_category_info (
  p1_category_id   text PRIMARY KEY,
  name             text,
  description      text[],
  image_url        text,
  raw              jsonb,
  name_sv          text,
  description_sv   text[],
  translated_from  text[],
  sv_source        text CHECK (sv_source IN ('ai', 'manual')),
  fetched_at       timestamptz NOT NULL DEFAULT now(),
  translated_at    timestamptz
);

ALTER TABLE public.seat_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p1_category_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage seat_categories" ON public.seat_categories;
CREATE POLICY "Admins manage seat_categories" ON public.seat_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage supplier_category_links" ON public.supplier_category_links;
CREATE POLICY "Admins manage supplier_category_links" ON public.supplier_category_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage p1_category_info" ON public.p1_category_info;
CREATE POLICY "Admins manage p1_category_info" ON public.p1_category_info
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seat_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_category_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.p1_category_info TO authenticated;
GRANT ALL ON public.seat_categories, public.supplier_category_links, public.p1_category_info TO service_role;
