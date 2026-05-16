import "server-only";

import { createClient } from "next-sanity";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "@/lib/sanity/env";

export const sanityWriteClient =
  sanityProjectId && sanityDataset && process.env.SANITY_API_TOKEN
    ? createClient({
        projectId: sanityProjectId,
        dataset: sanityDataset,
        apiVersion: sanityApiVersion,
        token: process.env.SANITY_API_TOKEN,
        useCdn: false,
      })
    : null;

export function requireSanityWriteClient() {
  if (!sanityWriteClient) {
    throw new Error("Sanity write client is not configured.");
  }

  return sanityWriteClient;
}
