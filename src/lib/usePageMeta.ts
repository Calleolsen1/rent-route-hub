import { useEffect } from "react";

type Meta = {
  /** Page title — also used as og:title fallback */
  title: string;
  /** Plain description — also used as og:description fallback */
  description?: string;
  /** Full URL of the page (for og:url + canonical). Falls back to current window URL. */
  url?: string;
  /** Image URL for social previews (og:image). Falls back to site default. */
  image?: string;
  /** og:type — default "website", use "article" for editorial */
  type?: "website" | "article";
};

const DEFAULT_OG_IMAGE = "https://kaisengroup.se/kaisen-logo-email.png";

/**
 * Sets document.title plus the SEO + Open Graph meta tags. Restores the
 * site-wide defaults from index.html on unmount.
 *
 * Pure DOM manipulation, no library dependency. Google + Facebook + Twitter
 * crawlers run JS, so this works for indexing and social previews from a
 * pure Vite SPA. If we ever migrate to SSR, swap for react-helmet-async.
 */
export function usePageMeta(meta: Meta) {
  useEffect(() => {
    const url = meta.url ?? (typeof window !== "undefined" ? window.location.href : "");
    const image = meta.image ?? DEFAULT_OG_IMAGE;
    const description = meta.description ?? "";
    const type = meta.type ?? "website";

    const prevTitle = document.title;
    document.title = meta.title;

    // Restore values for each touched meta tag on unmount
    const restorers: Array<() => void> = [() => { document.title = prevTitle; }];

    const setMeta = (
      kind: "name" | "property",
      key: string,
      value: string,
    ) => {
      const selector = `meta[${kind}="${key}"]`;
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      const prev = el?.getAttribute("content") ?? null;
      const created = !el;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(kind, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
      restorers.push(() => {
        if (created) el?.remove();
        else if (el && prev != null) el.setAttribute("content", prev);
      });
    };

    const setCanonical = (href: string) => {
      let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      const prev = el?.getAttribute("href") ?? null;
      const created = !el;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", "canonical");
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
      restorers.push(() => {
        if (created) el?.remove();
        else if (el && prev != null) el.setAttribute("href", prev);
      });
    };

    if (description) setMeta("name", "description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:title", meta.title);
    if (description) setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", meta.title);
    if (description) setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    if (url) setCanonical(url);

    return () => {
      // Run restorers in reverse so the meta-create/remove pairing is clean
      for (let i = restorers.length - 1; i >= 0; i--) restorers[i]();
    };
  }, [meta.title, meta.description, meta.url, meta.image, meta.type]);
}
