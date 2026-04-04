"use client";

import { useEffect, useState } from "react";
import { detectLikelyEmbeddedBrowser } from "@/lib/in-app-browser";

/**
 * Aviso quando o usuário provavelmente está em WebView (ex.: link aberto pelo app LinkedIn).
 * O Google bloqueia OAuth nesses ambientes; orienta abrir no Safari/Chrome.
 */
export function OAuthInAppBrowserNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    queueMicrotask(() => {
      setShow(detectLikelyEmbeddedBrowser(ua));
    });
  }, []);

  if (!show) return null;

  return (
    <div
      className="mb-4 p-3 rounded-lg border border-amber-500/35 bg-amber-500/10"
      role="status"
    >
      <p className="text-foreground text-sm font-semibold">
        Você pode estar dentro do navegador de um app (LinkedIn, Instagram, etc.)
      </p>
      <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
        O login com Google costuma ser bloqueado aqui. Use o menu do app para{" "}
        <span className="text-foreground font-medium">Abrir no Safari</span> ou{" "}
        <span className="text-foreground font-medium">Abrir no Chrome</span>, ou copie o
        endereço e abra no navegador do celular. No mesmo aparelho, isso costuma resolver
        o erro de acesso.
      </p>
    </div>
  );
}
