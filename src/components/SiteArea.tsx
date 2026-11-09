import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Marks <html data-area="public|app"> so the public-site design (fonts,
 * headline style, palette tweaks in index.css) applies only to public
 * pages. Admin and Mitt KAISEN keep their original look.
 */
const SiteArea = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const isApp = pathname.startsWith("/admin") || pathname.startsWith("/mitt-kaisen");
    document.documentElement.dataset.area = isApp ? "app" : "public";
  }, [pathname]);
  return null;
};

export default SiteArea;
