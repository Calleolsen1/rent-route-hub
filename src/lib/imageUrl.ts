/**
 * Responsive images for photos in Supabase Storage. Uploads are often
 * full-size camera files (home slides are 3800px, ~800 KB); the storage
 * render endpoint resizes on the fly, so phones get ~130 KB instead.
 * Anything that isn't a public Supabase object URL is returned untouched.
 */
const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export function isResizable(url: string | null | undefined): url is string {
  return !!url && url.includes(OBJECT_PATH);
}

export function resizedImage(url: string, width: number, quality = 72): string {
  if (!isResizable(url)) return url;
  const base = url.replace(OBJECT_PATH, RENDER_PATH).split("?")[0];
  return `${base}?width=${width}&quality=${quality}`;
}

/** srcSet for a photo that can be resized; undefined otherwise. */
export function responsiveSrcSet(url: string | null | undefined, widths = [640, 960, 1400, 2000]): string | undefined {
  if (!isResizable(url)) return undefined;
  return widths.map((w) => `${resizedImage(url, w)} ${w}w`).join(", ");
}
