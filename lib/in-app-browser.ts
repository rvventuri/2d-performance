/**
 * Heurística para WebViews / navegadores embutidos de apps sociais.
 * O Google OAuth costuma falhar nesses contextos; não há API confiável — só UA.
 */
const EMBEDDED_BROWSER_MARKERS = [
  "linkedinapp",
  "linkedin/",
  "instagram",
  "fbav/",
  "fban/",
  "fb_iab",
  "fbiOS",
  "messenger",
  " line/",
  "snapchat",
  "tiktok",
  "bytedancewebview",
  "reddit/",
] as const;

export function detectLikelyEmbeddedBrowser(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return EMBEDDED_BROWSER_MARKERS.some((m) => ua.includes(m));
}
