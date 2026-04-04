"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { gaMeasurementId, gaPageview, sendGtagEvent } from "@/lib/gtag";

const AUTH_PROVIDER_QUERY = "auth_provider";
const AUTH_PROVIDER_GOOGLE = "google";

function GoogleAnalyticsClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!gaMeasurementId()) return;
    const search = searchParams.toString();
    const path = search ? `${pathname}?${search}` : pathname;
    gaPageview(path);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!gaMeasurementId()) return;
    if (searchParams.get(AUTH_PROVIDER_QUERY) !== AUTH_PROVIDER_GOOGLE) return;

    const fullQuery = searchParams.toString();
    const dedupKey = `ga_oauth_login:${pathname}?${fullQuery}`;
    let alreadySent = false;
    try {
      alreadySent = sessionStorage.getItem(dedupKey) === "1";
      if (!alreadySent) sessionStorage.setItem(dedupKey, "1");
    } catch {
      // storage unavailable (private mode)
    }

    if (!alreadySent) {
      sendGtagEvent("login", { method: "google" });
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(AUTH_PROVIDER_QUERY);
    const q = nextParams.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [pathname, router, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  const id = gaMeasurementId();
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsClient />
      </Suspense>
    </>
  );
}
