"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { buildChromeHttpsIntentUrl } from "@/lib/android-chrome-intent";
import { isAndroidUserAgent, isIOSUserAgent } from "@/lib/device-platform";
import { buildIOSChromeHttpsUrl } from "@/lib/ios-chrome-url";
import type { AuthPagePath } from "@/lib/public-app-url";
import { getPublicAuthPageUrl } from "@/lib/public-app-url";
import { buildSafariHttpsOpenUrl } from "@/lib/safari-external-url";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const noticeStorageKey = (path: AuthPagePath) => `saltoverse-embedded-oauth-notice${path}`;

type Props = {
  /** Quando true, o usuário está provavelmente em WebView (LinkedIn, Instagram, etc.) */
  active: boolean;
  authPath: AuthPagePath;
};

/**
 * Aviso opcional (fechável): login com Google costuma falhar em WebView.
 * Não bloqueia o formulário — só orienta abrir no navegador do sistema.
 */
export function OAuthInAppBrowserNotice({ active, authPath }: Props) {
  const [targetUrl, setTargetUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!active) return;
    const path = authPath;
    const key = noticeStorageKey(path);
    try {
      if (sessionStorage.getItem(key) === "1") {
        queueMicrotask(() => setDismissed(true));
      }
    } catch {
      // modo privado / storage indisponível
    }
    queueMicrotask(() => {
      setTargetUrl(getPublicAuthPageUrl(path));
    });
  }, [active, authPath]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(noticeStorageKey(authPath), "1");
    } catch {
      /* ignore */
    }
    queueMicrotask(() => setDismissed(true));
  };

  if (!active || dismissed) return null;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const android = isAndroidUserAgent(ua);
  const ios = isIOSUserAgent(ua);

  const chromeIntent = targetUrl ? buildChromeHttpsIntentUrl(targetUrl) : "";
  const safariOpen = targetUrl ? buildSafariHttpsOpenUrl(targetUrl) : "";
  const iosChrome = targetUrl ? buildIOSChromeHttpsUrl(targetUrl) : "";

  const copyLink = async () => {
    if (!targetUrl) return;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
    } catch {
      // WebView pode bloquear clipboard
    }
  };

  /** Chrome — botão principal (destaque). */
  const chromePrimaryClass = cn(
    buttonVariants({ variant: "default" }),
    "w-full h-11 font-bold text-base bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground no-underline text-center",
    "shadow-md shadow-brand-primary/25 ring-2 ring-brand-primary-bright/50 ring-offset-2 ring-offset-amber-500/10"
  );

  const safariSecondaryClass = cn(
    buttonVariants({ variant: "secondary" }),
    "w-full h-10 font-medium no-underline text-center border border-border"
  );

  return (
    <div
      className="relative mb-4 p-3 pt-9 rounded-lg border border-amber-500/35 bg-amber-500/10 space-y-3"
      role="status"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors cursor-pointer"
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <p className="text-foreground text-sm font-semibold pr-8">
        Dica: login com Google pode falhar neste navegador
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Apps como Instagram ou LinkedIn abrem páginas por dentro do app. Se o Google bloquear, use
        uma das opções abaixo ou copie o link e abra no{" "}
        <span className="text-foreground font-medium">Safari</span> ou{" "}
        <span className="text-foreground font-medium">Chrome</span>.
      </p>

      {targetUrl ? (
        <p className="text-xs text-muted-foreground break-all font-mono bg-background/50 rounded px-2 py-1.5 border border-border">
          {targetUrl}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {ios && targetUrl ? (
          <>
            <a href={iosChrome} className={chromePrimaryClass}>
              Abrir no Chrome
            </a>
            <a href={safariOpen} className={safariSecondaryClass}>
              Abrir no Safari
            </a>
          </>
        ) : null}

        {android && chromeIntent ? (
          <a href={chromeIntent} className={chromePrimaryClass}>
            Abrir no Chrome
          </a>
        ) : null}

        {!android && !ios && targetUrl ? (
          <>
            <a href={chromeIntent} className={chromePrimaryClass}>
              Abrir no Chrome (Android)
            </a>
            <a href={safariOpen} className={safariSecondaryClass}>
              Abrir no Safari (iOS)
            </a>
          </>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="w-full h-10 font-semibold"
          onClick={copyLink}
          disabled={!targetUrl}
        >
          {copied ? "Link copiado" : "Copiar link"}
        </Button>
      </div>
    </div>
  );
}
