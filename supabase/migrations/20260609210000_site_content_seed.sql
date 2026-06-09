-- Editable text blocks for Contact / GroupTravel / Träningsläger pages.
--
-- Extends the existing About-page pattern (about_story key). Each page reads
-- via useSiteContent(keys) with hardcoded fallbacks so the page renders
-- correctly even if these rows don't exist yet. PageTextsManager
-- (/admin/content → Sidtexter) automatically picks them up because it
-- loads every site_content row.
--
-- Adding a new key in the future:
--   1. INSERT into site_content with key + value + description
--   2. Read it via useSiteContent on whichever page needs it
--   3. PageTextsManager will surface it for admin editing on next load
--
-- Idempotent via ON CONFLICT.

INSERT INTO public.site_content (key, value, description) VALUES
  -- ============================ CONTACT ============================
  ('contact_hero_eyebrow', '"Kom i kontakt"'::jsonb, 'Kontakt-sidan: liten text ovanför titeln i hero'),
  ('contact_hero_title', '"Planera Er Resa"'::jsonb, 'Kontakt-sidan: hero-titel'),
  ('contact_section_eyebrow', '"Tala med oss"'::jsonb, 'Kontakt-sidan: liten text ovanför sektions-titeln'),
  ('contact_section_title', '"Vi startar med ett Samtal"'::jsonb, 'Kontakt-sidan: sektions-titel ("Vi startar med ett Samtal")'),
  ('contact_intro', '"Föredrar du att ringa eller mejla direkt? Ingen mall — bara ett riktigt samtal. En dedikerad rådgivare återkommer normalt inom 24 timmar på vardagar."'::jsonb, 'Kontakt-sidan: introduktionstext ovanför kontaktuppgifterna'),
  ('contact_phone', '"+46 8 123 45 67"'::jsonb, 'Kontakt-sidan: telefonnummer'),
  ('contact_email', '"info@kaisengroup.se"'::jsonb, 'Kontakt-sidan: e-postadress'),
  ('contact_address', '"Stockholm, Sverige"'::jsonb, 'Kontakt-sidan: adress'),
  ('contact_hours', '"Mån–Fre 09–18"'::jsonb, 'Kontakt-sidan: öppettider'),

  -- ============================ GROUP TRAVEL ============================
  ('group_hero_eyebrow', '"Gruppresor"'::jsonb, 'Gruppresor-sidan: liten text ovanför titeln i hero'),
  ('group_hero_title', '"Bättre tillsammans — Alltid"'::jsonb, 'Gruppresor-sidan: hero-titel'),
  ('group_hero_tagline', '"Sport, äventyr eller fest — vi planerar, ni upplever."'::jsonb, 'Gruppresor-sidan: undertitel i hero'),
  ('group_activities',
   '["Privat transport & flygplatstransfer", "Guidade aktiviteter & utflykter", "Bokade middagar & gemensamma måltider", "Biljetter till event & matcher", "Team building-upplägg", "Support dygnet runt under resan"]'::jsonb,
   'Gruppresor-sidan: lista över vad som ingår'),

  -- ============================ TRÄNINGSLÄGER ============================
  ('training_hero_eyebrow', '"Tjänster — Träningsläger"'::jsonb, 'Träningsläger-sidan: liten text ovanför titeln i hero'),
  ('training_hero_title', '"En värld där idrott och resor möts"'::jsonb, 'Träningsläger-sidan: hero-titel'),
  ('training_hero_tagline', '"Träningsläger för fotboll, simning och friidrott — för föreningar, lag och grupper som vill ta träningen till nästa nivå."'::jsonb, 'Träningsläger-sidan: undertitel i hero'),
  ('training_features',
   '["Transport och flygplatstransfer för hela laget", "Boende anpassat för lag och ledare", "Träningstider och planer enligt era önskemål", "Mat och kost anpassad för idrottare", "Möjlighet till träningsmatcher och möten", "Lokal kontakt och support på plats"]'::jsonb,
   'Träningsläger-sidan: lista över vad som ingår')
ON CONFLICT (key) DO NOTHING;
