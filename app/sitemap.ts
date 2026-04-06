import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/** Apenas URLs públicas de marketing; login/register/share ficam fora. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
