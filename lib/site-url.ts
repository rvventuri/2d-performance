/** URL pública do site (SEO, JSON-LD, sitemap). Fallback alinhado ao deploy Vercel típico. */
export const SITE_URL_FALLBACK = "https://2d-performance.vercel.app";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || SITE_URL_FALLBACK;
}
