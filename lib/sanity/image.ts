import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "./client";

const builder = sanityClient ? createImageUrlBuilder(sanityClient) : null;

export function urlFor(source: SanityImageSource) {
  if (!builder) {
    return null;
  }

  return builder.image(source).auto("format").fit("max");
}
