insert into public.nav_menu_entries (sport_id, slug, name, group_label, city, venue, date_text, short_date, tagline, description, features_json, sort_order, is_active, show_in_menu)
select ns.id, x.slug, x.name, null, x.city, x.venue, x.date_text, x.short_date, x.tagline, x.description, '[]'::jsonb, x.sort_order, true, true
from public.nav_sports ns
join (values
  ('storbritannien', 'Storbritanniens Grand Prix', 'Silverstone, England', 'Silverstone Circuit', '4 juli 2027', '4 juli 2027', 'Silverstone', 'Silverstone — F1:s ursprungliga hem — en snabb och flytande bana där historien möter hög fart och en av världens mest passionerade publiker.', 105),
  ('osterrike', 'Österrikes Grand Prix', 'Spielberg, Österrike', 'Red Bull Ring', '11 juli 2027', '11 juli 2027', 'Spielberg', 'Red Bull Ring ligger bland de österrikiska alperna — en kort och snabb bana med dramatiska backar och stämning i världsklass.', 110),
  ('belgien', 'Belgiens Grand Prix', 'Spa, Belgien', 'Circuit de Spa-Francorchamps', '25 juli 2027', '25 juli 2027', 'Spa', 'Spa-Francorchamps är en av F1:s älskade klassiker — de berömda kurvorna Eau Rouge och Raidillon, långa fullgas-passager och belgisk racehistoria.', 115)
) as x(slug, name, city, venue, date_text, short_date, tagline, description, sort_order) on true
where ns.slug = 'f1'
on conflict (sport_id, slug) do update set
  name = excluded.name,
  city = excluded.city,
  venue = excluded.venue,
  date_text = excluded.date_text,
  short_date = excluded.short_date,
  tagline = excluded.tagline,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  show_in_menu = true;
