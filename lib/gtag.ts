export function gaMeasurementId(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined;
}

/** GA4 page view on client-side navigations (App Router). */
export function gaPageview(pagePath: string): void {
  if (typeof window === "undefined") return;
  const id = gaMeasurementId();
  if (!id) return;
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;
  gtag("config", id, { page_path: pagePath });
}

export function sendGtagEvent(
  action: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") return;
  if (!gaMeasurementId()) return;
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;
  gtag("event", action, params);
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
