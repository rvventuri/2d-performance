/**
 * Abre uma URL HTTPS no Chrome para iOS (se instalado).
 * @see https://developer.chrome.com/docs/ios/opening-links
 */
export function buildIOSChromeHttpsUrl(httpsPageUrl: string): string {
  const url = new URL(httpsPageUrl);
  return `googlechromes://${url.host}${url.pathname}${url.search}${url.hash}`;
}
