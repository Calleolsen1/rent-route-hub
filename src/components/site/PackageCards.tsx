import hotelImage from "@/assets/vip-concierge.jpg";
import flightImage from "@/assets/vip-jet.jpg";
import transferImage from "@/assets/vip-transfer.jpg";
import fotbollImage from "@/assets/sport-fotboll.jpg";

type Props = {
  eyebrow: string;
  title: string;
  /** Lines like "Hotell - centralt i olika kategorier ..." */
  features: string[];
  /** Stadium/circuit photo for the tickets card; falls back to the crowd shot. */
  venuePhoto?: string | null;
  /** Grey band instead of white. */
  alt?: boolean;
};

/** Photo per package part, keyed by the line's first word. */
function photoFor(lead: string, venuePhoto?: string | null) {
  const k = lead.toLowerCase();
  if (k.startsWith("hotell")) return hotelImage;
  if (k.startsWith("flyg")) return flightImage;
  if (k.startsWith("transfer")) return transferImage;
  return venuePhoto || fotbollImage; // Matchbiljetter / Biljetter / anything else
}

/**
 * "What does my package include?" - photo cards like the reference site.
 * The first word of each line is the card title; the rest is the text.
 */
export default function PackageCards({ eyebrow, title, features, venuePhoto, alt }: Props) {
  return (
    <section className={alt ? "sb-section-alt" : "sb-section"}>
      <div className="sb-container">
        <p className="eyebrow text-primary uppercase mb-1">{eyebrow}</p>
        <h2 className="font-display text-3xl md:text-[44px] mb-8 md:mb-10">{title}</h2>
        <ul className={`grid gap-5 sm:grid-cols-2 ${features.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {features.map((f, i) => {
            const space = f.indexOf(" ");
            const lead = space > 0 ? f.slice(0, space) : f;
            // The " - " joining title and text is a separator, not text.
            const rest = space > 0 ? f.slice(space).replace(/^\s*[-–]\s*/, "") : "";
            return (
              <li key={i}>
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-navy-deep">
                  <img src={photoFor(lead, venuePhoto)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-4 font-display text-[22px] text-foreground">{lead}</h3>
                {rest && <p className="mt-1 text-sm text-foreground/75 leading-relaxed">{rest}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
