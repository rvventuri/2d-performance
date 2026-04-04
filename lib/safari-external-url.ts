/**
 * Esquema não documentado oficialmente; em vários WebViews do iOS abre o Safari com a URL HTTPS.
 * Pode falhar em versões futuras ou em apps que bloqueiam esquemas customizados.
 */
export function buildSafariHttpsOpenUrl(httpsPageUrl: string): string {
  const url = new URL(httpsPageUrl);
  return `x-safari-https://${url.host}${url.pathname}${url.search}${url.hash}`;
}
