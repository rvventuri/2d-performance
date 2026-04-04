"use client";

import { useEffect, useState } from "react";
import { buildChromeHttpsIntentUrl } from "@/lib/android-chrome-intent";
import { isAndroidUserAgent, isIOSUserAgent } from "@/lib/device-platform";
import type { AuthPagePath } from "@/lib/public-app-url";
import { getPublicAuthPageUrl } from "@/lib/public-app-url";
import { buildSafariHttpsOpenUrl } from "@/lib/safari-external-url";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Quando true, o usuário está provavelmente em WebView (LinkedIn, etc.) */
  active: boolean;
  authPath: AuthPagePath;
};

/**
 * Bloqueio UX: login com Google não funciona em WebView. Oferece abrir no Chrome/Safari
 * na URL canônica (`NEXT_PUBLIC_APP_URL` + /login ou /register).
 */
export function OAuthInAppBrowserNotice({ active, authPath }: Props) {
  const [targetUrl, setTargetUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!active) return;
    const path = authPath;
    queueMicrotask(() => {
      setTargetUrl(getPublicAuthPageUrl(path));
    });
  }, [active, authPath]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (!active) return null;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const android = isAndroidUserAgent(ua);
  const ios = isIOSUserAgent(ua);

  const chromeIntent = targetUrl ? buildChromeHttpsIntentUrl(targetUrl) : "";
  const safariOpen = targetUrl ? buildSafariHttpsOpenUrl(targetUrl) : "";

  const copyLink = async () => {
    if (!targetUrl) return;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
    } catch {
      // WebView pode bloquear clipboard
    }
  };

  return (
    <div
      className="mb-4 p-3 rounded-lg border border-amber-500/35 bg-amber-500/10 space-y-3"
      role="alert"
    >
      <p className="text-foreground text-sm font-semibold">
        Abra no Safari ou no Chrome para entrar
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Este navegador (app LinkedIn, Instagram, etc.) não permite login com Google de forma
        segura. Use um dos botões abaixo ou copie o link e abra no navegador do celular.
      </p>

      {targetUrl ? (
        <p className="text-xs text-muted-foreground break-all font-mono bg-background/50 rounded px-2 py-1.5 border border-border">
          {targetUrl}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {android && chromeIntent ? (
          <a
            href={chromeIntent}
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full h-10 font-semibold bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground no-underline"
            )}
          >
            Abrir no Chrome
          </a>
        ) : null}

        {ios && safariOpen ? (
          <a
            href={safariOpen}
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full h-10 font-semibold bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground no-underline"
            )}
          >
            Abrir no Safari
          </a>
        ) : null}

        {!android && !ios && targetUrl ? (
          <>
            <a
              href={chromeIntent}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full h-10 font-semibold bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground no-underline"
              )}
            >
              Abrir no Chrome (Android)
            </a>
            <a
              href={safariOpen}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "w-full h-10 font-semibold no-underline"
              )}
            >
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
