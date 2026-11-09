import fotbollImage from "@/assets/sport-fotboll.jpg";
import { noBreakHyphen } from "@/lib/noBreakHyphen";

// Real photography (Unsplash, free for commercial use, no credit required).
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=900&q=75&auto=format&fit=crop`;
const hotelImage = unsplash("photo-1618773928121-c32242e63f39");
const flightImage = unsplash("photo-1593182440709-4b7b56482c55");
const transferImage = unsplash("photo-1772466669620-310c35f9deb2");

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
        <h2 className="font-display text-3xl md:text-[36px] lg:text-[44px] mb-5 md:mb-10">{noBreakHyphen(title)}</h2>
        <ul className={`grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-5 ${features.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
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
                <h3 className="mt-2.5 sm:mt-4 font-display text-lg sm:text-[22px] text-foreground">{lead}</h3>
                {rest && <p className="mt-0.5 sm:mt-1 text-[13px] sm:text-sm text-foreground/75 leading-snug sm:leading-relaxed">{rest}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
