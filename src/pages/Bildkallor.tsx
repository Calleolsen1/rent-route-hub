import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { STADIUM_PHOTOS } from "@/data/stadiumPhotos";
import { usePageMeta } from "@/lib/usePageMeta";

const LICENSE_URLS: Record<string, string> = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
  "CC BY-SA 2.5": "https://creativecommons.org/licenses/by-sa/2.5/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 3.0 de": "https://creativecommons.org/licenses/by-sa/3.0/de/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
};

/** Photo credits required by the Creative Commons licences of the stadium photos. */
export default function Bildkallor() {
  usePageMeta({ title: "Bildkällor | Kaisen Travel Group", description: "Bildkällor och licenser för fotografier på webbplatsen." });
  const credited = Object.values(STADIUM_PHOTOS).filter((p) => p.credit);
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-navy-deep text-white">
        <div className="sb-container py-10 md:py-14">
          <h1 className="font-display text-4xl md:text-5xl">Bildkällor</h1>
        </div>
      </section>
      <section className="sb-section">
        <div className="sb-container max-w-3xl">
          <p className="text-[15px] text-foreground/80 mb-8">
            Arenabilderna nedan kommer från Wikimedia Commons och används enligt respektive Creative Commons-licens.
            Övriga bilder är egna eller från Unsplash.
          </p>
          <ul className="divide-y divide-border border-y border-border">
            {credited.map((p) => (
              <li key={p.url} className="py-3 text-sm flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-medium text-foreground">{p.venue}</span>
                <span className="text-muted-foreground">
                  Foto:{" "}
                  <a href={p.credit!.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                    {p.credit!.author || "okänd"}
                  </a>
                  {" · "}
                  {LICENSE_URLS[p.credit!.license] ? (
                    <a href={LICENSE_URLS[p.credit!.license]} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                      {p.credit!.license}
                    </a>
                  ) : (
                    p.credit!.license
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Footer />
    </div>
  );
}
