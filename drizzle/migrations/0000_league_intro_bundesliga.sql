insert into public.site_content (key, value, description)
values (
  'league_intro_bundesliga',
  to_jsonb('Upplev Bundesliga LIVE – från den elektriska stämningen på Dortmunds berömda Südtribüne till Bayern Münchens fotboll i världsklass. Vi hjälper dig att skapa den perfekta fotbollsresan med matchbiljetter, flyg och hotell. Boka hela paketet eller välj de delar du behöver – vi tar hand om detaljerna.'::text),
  'Introtext under rubriken på Bundesliga-sidan'
)
on conflict (key) do update set value = excluded.value, description = excluded.description;