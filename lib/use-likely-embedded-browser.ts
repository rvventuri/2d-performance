"use client";

import { useEffect, useState } from "react";
import { detectLikelyEmbeddedBrowser } from "@/lib/in-app-browser";

export function useLikelyEmbeddedBrowser(): boolean {
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    queueMicrotask(() => {
      setEmbedded(detectLikelyEmbeddedBrowser(ua));
    });
  }, []);

  return embedded;
}
