export type AuthPagePath = "/login" | "/register";

/**
 * URL absoluta para CTAs da landing (mesmo valor no SSR e no cliente).
 * Com `NEXT_PUBLIC_APP_URL` na Vercel + `target="_blank"`, alguns apps (Instagram, etc.)
 * abrem o link fora do WebView — não é garantido, mas é o máximo possível na web.
 */
export function getMarketingCtaHref(path: AuthPagePath): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  const base = (raw?.trim() ?? "").replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

/**
 * Base pública do app. Em produção, defina `NEXT_PUBLIC_APP_URL` (ex.: https://2d-performance.vercel.app)
 * para que links “abrir no Chrome/Safari” apontem ao domínio certo mesmo dentro de WebView.
 */
export function getPublicAppBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  const env = (raw?.trim() ?? "").replace(/\/$/, "");
  if (env) return env;
  return window.location.origin;
}

export function getPublicAuthPageUrl(path: AuthPagePath): string {
  const base = getPublicAppBaseUrl();
  if (!base) return "";
  return `${base}${path}`;
}
