/**
 * Built-in stadium photos per home team (canonical team name, as in
 * events.home_team / nav entries). Admin uploads under "Arenabilder"
 * (team_venue_photos) always win; these fill the gaps so every club has a
 * real photo. Wikimedia Commons files are free licences that require
 * credit - listed on /bildkallor (src/pages/Bildkallor.tsx).
 */
export type PhotoCredit = { author: string; license: string; source: string };
export type StadiumPhoto = { url: string; venue: string; credit?: PhotoCredit };

export const STADIUM_PHOTOS: Record<string, StadiumPhoto> = {
  Arsenal: { url: "https://itaefkyfuvwicvarnfke.supabase.co/storage/v1/object/public/email-assets/home-trips/6b59324d-3b7b-4a69-a3fd-c5a7de23c1b1.jpg", venue: "Emirates Stadium" },
  "Chelsea": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Inside_Stamford_Bridge_Stadium_-_Chelsea_v_Peterborough_-_geograph.org.uk_-_5253336.jpg/1280px-Inside_Stamford_Bridge_Stadium_-_Chelsea_v_Peterborough_-_geograph.org.uk_-_5253336.jpg",
    venue: "Stamford Bridge",
    credit: { author: "Richard Humphrey", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Inside_Stamford_Bridge_Stadium_-_Chelsea_v_Peterborough_-_geograph.org.uk_-_5253336.jpg" },
  },
  "Liverpool": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/The_Kop_at_Anfield_Stadium%2C_Liverpool_-_geograph.org.uk_-_5885064.jpg/1280px-The_Kop_at_Anfield_Stadium%2C_Liverpool_-_geograph.org.uk_-_5885064.jpg",
    venue: "Anfield",
    credit: { author: "Mike Pennington", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:The_Kop_at_Anfield_Stadium,_Liverpool_-_geograph.org.uk_-_5885064.jpg" },
  },
  "Manchester City": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Etihad_Stadium%2C_Manchester_City_Football_Club_%28Ank_Kumar%2C_Infosys%29_16.jpg/1280px-Etihad_Stadium%2C_Manchester_City_Football_Club_%28Ank_Kumar%2C_Infosys%29_16.jpg",
    venue: "Etihad Stadium",
    credit: { author: "Ank kumar", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Etihad_Stadium,_Manchester_City_Football_Club_(Ank_Kumar,_Infosys)_16.jpg" },
  },
  "Manchester United": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Manchester_%2C_Trafford_-_Old_Trafford_Stadium_-_geograph.org.uk_-_3724146.jpg/1280px-Manchester_%2C_Trafford_-_Old_Trafford_Stadium_-_geograph.org.uk_-_3724146.jpg",
    venue: "Old Trafford",
    credit: { author: "Lewis Clarke", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Manchester_,_Trafford_-_Old_Trafford_Stadium_-_geograph.org.uk_-_3724146.jpg" },
  },
  "Tottenham Hotspur": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Tottenham_Hotspur_Stadium_-_to_dare_is_to_do.jpg/1280px-Tottenham_Hotspur_Stadium_-_to_dare_is_to_do.jpg",
    venue: "Tottenham Hotspur Stadium",
    credit: { author: "Chris Monahan", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Tottenham_Hotspur_Stadium_-_to_dare_is_to_do.jpg" },
  },
  "Crystal Palace": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Selhurst_Park_Holmesdale_Stand.jpg/1280px-Selhurst_Park_Holmesdale_Stand.jpg",
    venue: "Selhurst Park",
    credit: { author: "Rockybiggs", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Selhurst_Park_Holmesdale_Stand.jpg" },
  },
  "Everton": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Hilldickinsonstadium.jpg/1280px-Hilldickinsonstadium.jpg",
    venue: "Hill Dickinson Stadium",
    credit: { author: "Everton FC", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Hilldickinsonstadium.jpg" },
  },
  "Fulham": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Inside_Craven_Cottage_-_geograph.org.uk_-_4804025.jpg/1280px-Inside_Craven_Cottage_-_geograph.org.uk_-_4804025.jpg",
    venue: "Craven Cottage",
    credit: { author: "Neil Theasby", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Inside_Craven_Cottage_-_geograph.org.uk_-_4804025.jpg" },
  },
  "Leeds United": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Elland_Road_Stadium_panoramic_view_from_its_southeastearn_corner.jpg/1280px-Elland_Road_Stadium_panoramic_view_from_its_southeastearn_corner.jpg",
    venue: "Elland Road",
    credit: { author: "Lufc83", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Elland_Road_Stadium_panoramic_view_from_its_southeastearn_corner.jpg" },
  },
  "Aston Villa": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Birmingham_aston_villa_park_stadium.jpg/1280px-Birmingham_aston_villa_park_stadium.jpg",
    venue: "Villa Park",
    credit: { author: "Arne Müseler", license: "CC BY-SA 3.0 de", source: "https://commons.wikimedia.org/wiki/File:Birmingham_aston_villa_park_stadium.jpg" },
  },
  "Brentford": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Line-up_at_the_Brentford_v_Nottingham_Forest_football_match_on_21_December_2024_at_Brentford_Community_Stadium.jpg/1280px-Line-up_at_the_Brentford_v_Nottingham_Forest_football_match_on_21_December_2024_at_Brentford_Community_Stadium.jpg",
    venue: "Gtech Community Stadium",
    credit: { author: "Jim Linwood", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Line-up_at_the_Brentford_v_Nottingham_Forest_football_match_on_21_December_2024_at_Brentford_Community_Stadium.jpg" },
  },
  "Celtic": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Celtic_Park_during_an_Old_Firm_derby_between_Celtic_FC_and_Rangers_FC.jpg/1280px-Celtic_Park_during_an_Old_Firm_derby_between_Celtic_FC_and_Rangers_FC.jpg",
    venue: "Celtic Park",
    credit: { author: "Vincenzo.togni", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Celtic_Park_during_an_Old_Firm_derby_between_Celtic_FC_and_Rangers_FC.jpg" },
  },
  "Glasgow Rangers": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Ibrox_Inside.jpg/1280px-Ibrox_Inside.jpg",
    venue: "Ibrox Stadium",
    credit: { author: "Archibald99", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Ibrox_Inside.jpg" },
  },
  "Bayern München": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Allianz_arena_at_night_Richard_Bartz.jpg/1280px-Allianz_arena_at_night_Richard_Bartz.jpg",
    venue: "Allianz Arena",
    credit: { author: "Richard Bartz, Munich aka Makro Freak", license: "CC BY-SA 2.5", source: "https://commons.wikimedia.org/wiki/File:Allianz_arena_at_night_Richard_Bartz.jpg" },
  },
  "Borussia Dortmund": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Signal_iduna_park_stadium_dortmund_2.jpg/1280px-Signal_iduna_park_stadium_dortmund_2.jpg",
    venue: "Signal Iduna Park",
    credit: { author: "Arne Müseler / www.arne-mueseler.com", license: "CC BY-SA 3.0 de", source: "https://commons.wikimedia.org/wiki/File:Signal_iduna_park_stadium_dortmund_2.jpg" },
  },
  "Bayer Leverkusen": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/BayArena_Leverkusen_in_12-2018.jpg/1280px-BayArena_Leverkusen_in_12-2018.jpg",
    venue: "BayArena",
    credit: { author: "Nick-4711", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:BayArena_Leverkusen_in_12-2018.jpg" },
  },
  "Borussia Mönchengladbach": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/2012-02-24_Gladbach01_%286937874959%29.jpg/1280px-2012-02-24_Gladbach01_%286937874959%29.jpg",
    venue: "Borussia-Park",
    credit: { author: "Markus Unger from Vienna, Austria", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:2012-02-24_Gladbach01_(6937874959).jpg" },
  },
  "Atlético Madrid": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Estadio_Wanda_Metropolitano_%282018%29.jpg/1280px-Estadio_Wanda_Metropolitano_%282018%29.jpg",
    venue: "Metropolitano",
    credit: { author: "Roberto", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Estadio_Wanda_Metropolitano_(2018).jpg" },
  },
  "FC Barcelona": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/2014._Camp_Nou._M%C3%A9s_que_un_club._Barcelona_B40.jpg/1280px-2014._Camp_Nou._M%C3%A9s_que_un_club._Barcelona_B40.jpg",
    venue: "Spotify Camp Nou",
    credit: { author: "Luis Miguel Bugallo Sánchez (Lmbuga)", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:2014._Camp_Nou._M%C3%A9s_que_un_club._Barcelona_B40.jpg" },
  },
  "Real Madrid": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Estadio_Santiago_Bernab%C3%A9u_Madrid.jpg/1280px-Estadio_Santiago_Bernab%C3%A9u_Madrid.jpg",
    venue: "Santiago Bernabéu",
    credit: { author: "Zoser", license: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Estadio_Santiago_Bernab%C3%A9u_Madrid.jpg" },
  },
  "Athletic Bilbao": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/San_Mames_Barria_eta_Bilboko_ikuspegia.jpg/1280px-San_Mames_Barria_eta_Bilboko_ikuspegia.jpg",
    venue: "San Mamés",
    credit: { author: "Mikel Arrazola", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:San_Mames_Barria_eta_Bilboko_ikuspegia.jpg" },
  },
  "Sevilla": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Estadio_Ram%C3%B3n_S%C3%A1nchez_Pizju%C3%A1n_Gol_Norte_tifo-2007-04-05.jpg/1280px-Estadio_Ram%C3%B3n_S%C3%A1nchez_Pizju%C3%A1n_Gol_Norte_tifo-2007-04-05.jpg",
    venue: "Ramón Sánchez-Pizjuán",
    credit: { author: "inkiboo (Flickr)", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Estadio_Ram%C3%B3n_S%C3%A1nchez_Pizju%C3%A1n_Gol_Norte_tifo-2007-04-05.jpg" },
  },
  "Valencia": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Mestalla_Stadium_Valencia_vs_Villarreal_2026.7.jpg/1280px-Mestalla_Stadium_Valencia_vs_Villarreal_2026.7.jpg",
    venue: "Mestalla",
    credit: { author: "Byxelized", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Mestalla_Stadium_Valencia_vs_Villarreal_2026.7.jpg" },
  },
  "Real Sociedad": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Anoeta_estadioa_25%2C_Donostia%2C_Gipuzkoa%2C_Euskal_Herria.jpg/1280px-Anoeta_estadioa_25%2C_Donostia%2C_Gipuzkoa%2C_Euskal_Herria.jpg",
    venue: "Reale Arena",
    credit: { author: "Bhgh543bgf", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Anoeta_estadioa_25,_Donostia,_Gipuzkoa,_Euskal_Herria.jpg" },
  },
  "Milan": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/San_Siro_Stadium_26.jpg/1280px-San_Siro_Stadium_26.jpg",
    venue: "San Siro",
    credit: { author: "Zakarie Faibis", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:San_Siro_Stadium_26.jpg" },
  },
  "Inter": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/San_Siro_Stadium_14.jpg/1280px-San_Siro_Stadium_14.jpg",
    venue: "San Siro",
    credit: { author: "Zakarie Faibis", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:San_Siro_Stadium_14.jpg" },
  },
  "Juventus": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Juventus_v_Real_Madrid%2C_Champions_League%2C_Stadium%2C_Turin%2C_2013.jpg/1280px-Juventus_v_Real_Madrid%2C_Champions_League%2C_Stadium%2C_Turin%2C_2013.jpg",
    venue: "Allianz Stadium",
    credit: { author: "forzaq8 from kuwait, kuwait", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Juventus_v_Real_Madrid,_Champions_League,_Stadium,_Turin,_2013.jpg" },
  },
  "Roma": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Stadio_Olimpico_%28Rome%29.png/1280px-Stadio_Olimpico_%28Rome%29.png",
    venue: "Stadio Olimpico",
    credit: { author: "Nicholas Gemini", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Stadio_Olimpico_(Rome).png" },
  },
};
