/**
 * Intent URL para abrir uma página HTTPS no Chrome no Android.
 * @see https://developer.chrome.com/docs/multiscreen/android-intents
 */
export function buildChromeHttpsIntentUrl(httpsPageUrl: string): string {
  const url = new URL(httpsPageUrl);
  const pathQueryHash = `${url.pathname}${url.search}${url.hash}`;
  const fallback = encodeURIComponent(httpsPageUrl);
  return `intent://${url.host}${pathQueryHash}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end`;
}
