import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/students",
        "/settings",
        "/admin",
        "/api",
        "/share",
        "/seed",
        "/login",
        "/register",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
