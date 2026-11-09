/**
 * "Gör det till en citybreak" sections, keyed by lowercased city name as it
 * appears first in a team/race entry's city field ("London, England" -> "london").
 * A city without an entry simply shows no section. Photos: Unsplash
 * (free for commercial use, no credit required).
 */
export type CityBreak = {
  title: string;
  /** Paragraphs separated by blank lines. */
  text: string;
  image: string;
};

export const CITY_BREAKS: Record<string, CityBreak> = {
  "london": {
    title: "Gör det till en citybreak i London",
    text: "Passa på att upptäcka London när du ändå är på plats. Promenera längs Themsen förbi Tower Bridge och Big Ben, shoppa på Oxford Street eller i Covent Garden och avsluta dagen på en klassisk engelsk pub.\n\nLondon bjuder på museer i världsklass – många med fri entré – musikaler i West End och restauranger från hela världen. Kombinera matchen med några dagar i staden och gör resan till en weekend du sent kommer att glömma.",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80&auto=format&fit=crop",
  },
  "liverpool": {
    title: "Gör det till en citybreak i Liverpool",
    text: "Liverpool är en stad som lever för fotboll och musik. Strosa längs Albert Dock vid floden Mersey, besök The Beatles Story och känn historien i Cavern Quarter där allt började.\n\nPå kvällen väntar livliga pubar på Mathew Street och restaurangerna kring Baltic Triangle. En kompakt och varm stad där du hinner se mycket på en weekend – och där matchdagen är en del av själva stadspulsen.",
    image: "https://images.unsplash.com/photo-1748125696655-5b25da4364a9?w=1600&q=80&auto=format&fit=crop",
  },
  "manchester": {
    title: "Gör det till en citybreak i Manchester",
    text: "Manchester bjuder på mer än fotboll. Utforska de kreativa kvarteren i Northern Quarter med caféer, vintagebutiker och street art, eller ta en promenad längs kanalerna i Castlefield.\n\nStaden är känd för sin musikscen och sitt nattliv, och shoppingen i centrum är något utöver det vanliga. Kombinera matchen med en weekend i en av Englands mest levande städer.",
    image: "https://images.unsplash.com/photo-1515586838455-8f8f940d6853?w=1600&q=80&auto=format&fit=crop",
  },
  "birmingham": {
    title: "Gör det till en citybreak i Birmingham",
    text: "Birmingham är Englands näst största stad och överraskar många besökare. Upptäck kanalerna kring Brindleyplace, den moderna arkitekturen kring Library of Birmingham och shoppingen i Bullring.\n\nStaden har en stor restaurangscen och ett livligt nattliv. Kombinera matchen med några dagar i Midlands – en prisvärd och mångsidig weekenddestination.",
    image: "https://images.unsplash.com/photo-1643789452257-7a8717f6e2be?w=1600&q=80&auto=format&fit=crop",
  },
  "leeds": {
    title: "Gör det till en citybreak i Leeds",
    text: "Leeds är en ung och livlig stad i hjärtat av Yorkshire. Shoppa i de vackra viktorianska arkaderna, ta en paus i Kirkgate Market och utforska barerna och restaurangerna kring Call Lane.\n\nMed närhet till Yorkshires gröna landskap och en stark matkultur är Leeds en perfekt plats för en weekend kring matchen.",
    image: "https://images.unsplash.com/photo-1634848159202-54929391fc0c?w=1600&q=80&auto=format&fit=crop",
  },
  "glasgow": {
    title: "Gör det till en citybreak i Glasgow",
    text: "Glasgow är Skottlands största stad – full av vacker arkitektur, gallerier och musik. Promenera genom West End och universitetsområdet, besök Kelvingrove Art Gallery and Museum och shoppa längs Buchanan Street.\n\nPå kvällen lever staden upp med pubar, livemusik och whiskybarer. Kombinera matchen med en weekend och upplev den skotska gästfriheten på riktigt.",
    image: "https://images.unsplash.com/photo-1621519604512-85ea63c15ca2?w=1600&q=80&auto=format&fit=crop",
  },
  "münchen": {
    title: "Gör det till en citybreak i München",
    text: "München kombinerar bayersk tradition med storstadspuls. Upplev Marienplatz och rådhusets klockspel, promenera i Englischer Garten och njut av en kväll i någon av stadens klassiska ölhallar.\n\nStaden bjuder på slott, museer och shopping längs Maximilianstrasse. Kombinera matchen med några dagar i en av Tysklands mest charmiga storstäder.",
    image: "https://images.unsplash.com/photo-1649609765902-254a227dc960?w=1600&q=80&auto=format&fit=crop",
  },
  "dortmund": {
    title: "Gör det till en citybreak i Dortmund",
    text: "Dortmund är en stad där fotbollen står i centrum. Besök Deutsches Fußballmuseum, utforska de gamla industrimiljöerna som blivit kultur- och nöjesområden och njut av stadens ölkultur.\n\nRuhrområdet ligger nära och erbjuder mycket att upptäcka. Kombinera matchen med en weekend i en stad som andas fotboll.",
    image: "https://images.unsplash.com/photo-1718893141076-49d82fdb2e51?w=1600&q=80&auto=format&fit=crop",
  },
  "leverkusen": {
    title: "Gör det till en citybreak i Köln",
    text: "Leverkusen ligger bara en kort tågresa från Köln – en av Tysklands mest livliga städer. Besök den mäktiga domkyrkan, promenera längs Rhen och upptäck gamla stan med sina bryggerier och kvarterskrogar.\n\nKöln är känt för sin avslappnade stämning, sina museer och sitt nattliv. En perfekt bas för en weekend kring matchen.",
    image: "https://images.unsplash.com/photo-1607778775701-dc20311cfb0f?w=1600&q=80&auto=format&fit=crop",
  },
  "mönchengladbach": {
    title: "Gör det till en citybreak i Düsseldorf",
    text: "Mönchengladbach ligger nära Düsseldorf – en elegant stad vid Rhen. Shoppa längs den berömda Königsallee, promenera på strandpromenaden och upplev Altstadt med sina många barer och bryggerier.\n\nDüsseldorf bjuder på konst, design och modern arkitektur i hamnområdet Medienhafen. Kombinera matchen med en weekend i en av Tysklands mest stilfulla städer.",
    image: "https://images.unsplash.com/photo-1691765471876-e9ec65d52293?w=1600&q=80&auto=format&fit=crop",
  },
  "madrid": {
    title: "Gör det till en citybreak i Madrid",
    text: "Madrid är en stad som aldrig sover. Promenera längs Gran Vía, upplev Plaza Mayor och Puerta del Sol och ta en paus i den gröna oasen Retiroparken.\n\nStaden bjuder på konst i världsklass på Prado och Reina Sofía, tapas i La Latina och ett nattliv som pågår långt in på natten. Kombinera matchen med en weekend i Spaniens huvudstad.",
    image: "https://images.unsplash.com/photo-1725112675082-5fc786ea4269?w=1600&q=80&auto=format&fit=crop",
  },
  "barcelona": {
    title: "Gör det till en citybreak i Barcelona",
    text: "Barcelona har allt – strand, kultur och storstadspuls. Upplev Gaudís Sagrada Família och Park Güell, strosa längs La Rambla och gå vilse i de smala gränderna i Gotiska kvarteren.\n\nAvsluta dagen med tapas i El Born eller en drink vid havet i Barceloneta. Kombinera matchen med några dagar i en av Europas mest populära städer.",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80&auto=format&fit=crop",
  },
  "bilbao": {
    title: "Gör det till en citybreak i Bilbao",
    text: "Bilbao är Baskienlands pulserande hjärta. Upplev Guggenheimmuseets spektakulära arkitektur, promenera längs floden Nervión och utforska gamla stan, Casco Viejo.\n\nStaden är känd för sina pintxos – små baskiska smårätter – och en matkultur i världsklass. Kombinera matchen med en weekend full av mat, kultur och atmosfär.",
    image: "https://images.unsplash.com/photo-1636556602097-2435ad5198ef?w=1600&q=80&auto=format&fit=crop",
  },
  "sevilla": {
    title: "Gör det till en citybreak i Sevilla",
    text: "Sevilla är Andalusiens vackra huvudstad. Upplev Plaza de España, den mäktiga katedralen med Giralda-tornet och det kungliga palatset Real Alcázar.\n\nGå vilse i de smala gränderna i Santa Cruz, njut av tapas och flamenco och den varma andalusiska stämningen. Kombinera matchen med en weekend i en av Spaniens mest charmiga städer.",
    image: "https://images.unsplash.com/photo-1729334933474-0899118f9697?w=1600&q=80&auto=format&fit=crop",
  },
  "valencia": {
    title: "Gör det till en citybreak i Valencia",
    text: "Valencia förenar strand, historia och modern arkitektur. Upplev den futuristiska Ciudad de las Artes y las Ciencias, promenera genom den gröna Turiaparken och utforska gamla stan.\n\nStaden är paellans hemstad och bjuder på härliga stränder bara en kort resa från centrum. Kombinera matchen med några dagar vid Medelhavet.",
    image: "https://images.unsplash.com/photo-1751834740962-9c41fe457858?w=1600&q=80&auto=format&fit=crop",
  },
  "san sebastián": {
    title: "Gör det till en citybreak i San Sebastián",
    text: "San Sebastián är en av Spaniens vackraste städer, belägen vid den berömda La Concha-bukten. Promenera längs strandpromenaden, ta dig upp till Monte Igueldo för utsikten och utforska gamla stan.\n\nStaden är känd för sin gastronomi – här finns några av världens mest hyllade restauranger och oändligt med pintxosbarer. Kombinera matchen med en weekend för alla sinnen.",
    image: "https://images.unsplash.com/photo-1682312990271-8c4238452042?w=1600&q=80&auto=format&fit=crop",
  },
  "milano": {
    title: "Gör det till en citybreak i Milano",
    text: "Milano är Italiens mode- och designhuvudstad. Upplev den magnifika domkyrkan Duomo, shoppa i Galleria Vittorio Emanuele II och se Leonardo da Vincis Nattvarden.\n\nPå kvällen väntar aperitivo längs kanalerna i Navigli. Kombinera matchen med en weekend i en stad där stil, mat och fotboll går hand i hand.",
    image: "https://images.unsplash.com/photo-1610016302534-6f67f1c968d8?w=1600&q=80&auto=format&fit=crop",
  },
  "turin": {
    title: "Gör det till en citybreak i Turin",
    text: "Turin är en elegant stad vid foten av Alperna. Promenera under de långa arkaderna, besök det egyptiska museet och ta hissen upp i Mole Antonelliana för en vidunderlig utsikt.\n\nStaden är känd för sin chokladtradition, sitt kaffe och den italienska aperitivon. Kombinera matchen med en weekend i en av Italiens mest underskattade städer.",
    image: "https://images.unsplash.com/photo-1610651219730-6b580d616e72?w=1600&q=80&auto=format&fit=crop",
  },
  "rom": {
    title: "Gör det till en citybreak i Rom",
    text: "Rom är en levande historiebok. Upplev Colosseum och Forum Romanum, kasta ett mynt i Fontana di Trevi och besök Vatikanen och Peterskyrkan.\n\nAvsluta dagarna med pasta och vin på en trattoria i Trastevere. Kombinera matchen med en weekend i den eviga staden – en resa du sent kommer att glömma.",
    image: "https://images.unsplash.com/photo-1555992828-35627f3b373f?w=1600&q=80&auto=format&fit=crop",
  },
};

export function cityBreakFor(city?: string | null): CityBreak | undefined {
  if (!city) return undefined;
  return CITY_BREAKS[city.split(",")[0].trim().toLowerCase()];
}
