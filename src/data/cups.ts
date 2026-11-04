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
      "Officiella biljetter och kompletta resor till Europa League. Vi tar fram paket med matchbiljetter, centralt hotell, flyg och transfer - från gruppspel till final.",
  },
  {
    slug: "fa-cup",
    name: "FA Cup",
    tournaments: ["FA Cup"],
    description:
      "Officiella biljetter och kompletta resor till FA Cup - Englands äldsta och mest traditionsrika cupturnering. Vi tar fram paket med matchbiljetter, hotell, flyg och transfer.",
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
