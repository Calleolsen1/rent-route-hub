// Central source of truth for football cups ("Cuper") shown as their own
// group under Fotboll - in the menu and on the football page. Each cup gets
// a page at /services/sportresor/:sport/cup/:slug listing its matches.
// `tournaments` are matched case-insensitively against events.tournament_name
// (a cup may be known under several supplier names, e.g. Carabao/EFL Cup).

export type CupInfo = {
  slug: string;
  name: string;
  tournaments: string[];
  description: string;
};

export const CUPS: CupInfo[] = [
  {
    slug: "champions-league",
    name: "Champions League",
    tournaments: ["Champions League"],
    description:
      "Champions League LIVE – Europas bästa klubbfotboll!\n\nUpplev världens främsta klubblag mötas på Europas största fotbollsscener. Champions League är klubbfotboll när den är som bäst – med stjärnspelare, klassiska arenor och matcher på absolut högsta nivå. Sätt ihop din egen fotbollsresa med officiella matchbiljetter, hotell, flyg och transfers – välj det som passar dig och skapa en fotbollsupplevelse utöver det vanliga!",
  },
  {
    slug: "europa-league",
    name: "Europa League",
    tournaments: ["Europa League"],
    description:
      "Europa League LIVE – upplev Europas fotbollsstäder!\n\nUpplev spännande matcher mellan Europas välkända klubblag på klassiska arenor runt om i Europa. Europa League bjuder på passionerad fotboll, stora profiler och matcher där mycket står på spel. Sätt ihop din egen fotbollsresa med officiella matchbiljetter, hotell, flyg och transfers – välj det som passar dig och skapa din egen fotbollsupplevelse!",
  },
  {
    slug: "fa-cup",
    name: "FA Cup",
    tournaments: ["FA Cup"],
    description:
      "FA-cupen LIVE – klassisk engelsk fotboll och cupdramatik!\n\nUpplev en av världens mest anrika fotbollsturneringar där Premier League-klubbar möter utmanare från hela det engelska seriesystemet. FA-cupen bjuder på klassiska arenor, passionerade supportrar och matcher där allt kan hända. Sätt ihop din egen fotbollsresa med officiella matchbiljetter, hotell, flyg och transfers – välj det som passar dig och skapa din egen fotbollsupplevelse!",
  },
  {
    slug: "carabao-cup",
    name: "Carabao Cup",
    tournaments: ["Carabao Cup", "EFL Cup"],
    description:
      "Officiella biljetter och kompletta resor till Carabao Cup - Englands ligacup. Vi tar fram paket med matchbiljetter, hotell, flyg och transfer.",
  },
];

export const CUP_SLUGS = new Set(CUPS.map((c) => c.slug));

export const getCup = (slug?: string) => (slug ? CUPS.find((c) => c.slug === slug) : undefined);

export const cupHref = (sportSlug: string, cupSlug: string) =>
  `/services/sportresor/${sportSlug}/cup/${cupSlug}`;

/** Grupprubriken i menyn och på fotbollssidan. */
export const CUP_GROUP_LABEL = "Cuper";
