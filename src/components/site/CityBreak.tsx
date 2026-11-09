import type { CityBreak as CityBreakData } from "@/data/cityBreaks";

/** Big photo + text band (reference: "Make it a city break"). */
export default function CityBreak({ data, alt }: { data: CityBreakData; alt?: boolean }) {
  return (
    <section className={alt ? "sb-section-alt" : "sb-section"}>
      <div className="sb-container grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-navy-deep">
          <img src={data.image} alt={data.title} loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div>
          <h2 className="font-display text-3xl md:text-[44px] mb-4">{data.title}</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-foreground/80">
            {data.text.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
