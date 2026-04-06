import type { Metadata } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/branding";
import { LandingJsonLd } from "@/components/landing-json-ld";
import { getSiteUrl } from "@/lib/site-url";

const homeTitle = "Avaliação de salto vertical, CMJ e IA para treinadores";

const homeDescription = `${APP_DESCRIPTION} Registre CMJ, SJ, Abalakov, RSI e acompanhe a evolução dos atletas com análises geradas por IA.`;

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: getSiteUrl() + "/" },
  openGraph: {
    title: `${homeTitle} | ${APP_NAME}`,
    description: homeDescription,
    url: getSiteUrl(),
  },
  twitter: {
    title: `${homeTitle} | ${APP_NAME}`,
    description: homeDescription,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingJsonLd />
      {children}
    </>
  );
}
