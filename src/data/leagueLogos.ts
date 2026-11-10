// League and cup logos are switched off (KAISEN, Nov 2026): only club crests
// are shown. Every page reads these maps conditionally, so empty maps mean
// "no logo" everywhere. The image assets are still in src/assets
// (league-*.png, cup-*.png) if they are ever wanted back.

/** League logos keyed by league slug (slugify(group_label)). */
export const leagueLogos: Record<string, string> = {};

/** Cup logos keyed by cup slug (src/data/cups.ts). */
export const cupLogos: Record<string, string> = {};
