DROP POLICY IF EXISTS "Public can view active experiences" ON public.home_experiences;
CREATE POLICY "Public can view active experiences" ON public.home_experiences FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "nav_menu_entries public read" ON public.nav_menu_entries;
CREATE POLICY "nav_menu_entries public read" ON public.nav_menu_entries FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "nav_top_menu_items public read" ON public.nav_top_menu_items;
CREATE POLICY "nav_top_menu_items public read" ON public.nav_top_menu_items FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "nav_sports public read" ON public.nav_sports;
CREATE POLICY "nav_sports public read" ON public.nav_sports FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_signups;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_signups FOR INSERT TO anon, authenticated
WITH CHECK (length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND (source IS NULL OR length(source) <= 200) AND (user_agent IS NULL OR length(user_agent) <= 1000));
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;
CREATE POLICY "Anyone can submit inquiries" ON public.inquiries FOR INSERT TO anon, authenticated
WITH CHECK (status = 'new' AND assigned_admin_id IS NULL AND admin_notes IS NULL
  AND length(name) BETWEEN 1 AND 200 AND length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(phone) <= 50 AND length(message) <= 5000);
DROP POLICY IF EXISTS "Authenticated users can upload dispute attachments" ON storage.objects;