import type { ImageLoaderProps } from "next/image";

// Custom next/image loader that resizes through Sanity's own CDN instead of Next's
// optimizer. Product images already live on cdn.sanity.io, so routing transforms
// there means the browser fetches resized images directly from Sanity and the
// request never hits Netlify's `/_next/image` function — the single biggest source
// of function/Image-CDN load on the free tier.
//
// Mirrors urlFor()'s transform (`.auto("format").fit("max")`) so output matches the
// rest of the app. Anything that isn't a Sanity URL — the /public logos, which are
// relative paths — is returned untouched and served statically.
export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.includes("cdn.sanity.io")) {
    return src;
  }

  const params = new URLSearchParams();
  params.set("auto", "format");
  params.set("fit", "max");
  params.set("w", String(width));
  params.set("q", String(quality ?? 75));

  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}${params.toString()}`;
}
