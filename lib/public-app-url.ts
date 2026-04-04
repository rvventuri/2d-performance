export type AuthPagePath = "/login" | "/register";

/**
 * Base pública do app. Em produção, defina `NEXT_PUBLIC_APP_URL` (ex.: https://2d-performance.vercel.app)
 * para que links “abrir no Chrome/Safari” apontem ao domínio certo mesmo dentro de WebView.
 */
export function getPublicAppBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  return window.location.origin;
}

export function getPublicAuthPageUrl(path: AuthPagePath): string {
  const base = getPublicAppBaseUrl();
  if (!base) return "";
  return `${base}${path}`;
}
