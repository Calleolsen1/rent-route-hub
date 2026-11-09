/**
 * Real photography replacing the AI-generated stock that shipped with the
 * Lovable scaffold. All Unsplash (free for commercial use, no credit
 * required). Keyed by the old asset file name so call sites stay readable.
 */
const u = (id: string, w = 1600) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

export const PHOTO: Record<string, string> = {
  "sport-f1": u("photo-1696178946353-b2c37dc7df7c"),
  "sport-fotboll": u("photo-1629217855633-79a6925d6c47"),
  "vip-transfer": u("photo-1764089859662-7b4773dff85b"),
  "vip-jet": u("photo-1659618867869-4bcb83ce76ba"),
  "vip-concierge": u("photo-1724230758718-406bab979e67"),
  "konferens-hero": u("photo-1785512329906-3e903e48f0df"),
  "konferens-event": u("photo-1724866976376-4b217d29a462"),
  "konferens-dinner": u("photo-1527529482837-4698179dc6ce"),
  "group-corporate": u("photo-1768508950434-fc76c9f3ed9f"),
  "group-adventure": u("photo-1770563182582-9b1e28c9896a"),
  "contact-hero": u("photo-1764377716239-ee0b1d0df2bb"),
  "camps-hero": u("photo-1598881034666-6d3443d4b1bc"),
  "affarsresor-hero": u("photo-1532968899863-5b52ef155913"),
  "about-hero": u("photo-1783407897082-5c3585998a23"),
  "city-paris": u("photo-1686317508857-3b91999d6ec8", 1200),
  "city-copenhagen": u("photo-1761408631616-28be60406669", 1200),
  "city-venice": u("photo-1558271736-cd043ef2e855", 1200),
  "city-prague": u("photo-1661609302705-25eb5024e8a6", 1200),
  "city-amsterdam": u("photo-1605704320412-5c3255bf47a9", 1200),
  "city-barcelona": u("photo-1583422409516-2895a77efded", 1200),
  "offer-f1-monza": u("photo-1696178946353-b2c37dc7df7c", 1200),
  /** Replaces the AI "Europe skyline at night" (group travel card + home slide). */
  "kaisen-group": u("photo-1600623471616-8c1966c91ff6"),
};
