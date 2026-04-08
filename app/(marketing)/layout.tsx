import type { Metadata } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/branding";
import { LandingJsonLd } from "@/components/landing-json-ld";
import { getSiteUrl } from "@/lib/site-url";

const homeTitle =
  "Acompanhe alunos com clareza — métricas, evolução e IA | SaltoVerse";

const homeDescription = `${APP_DESCRIPTION} Templates (força, corrida, salto) ou métricas próprias, gráficos e insights acionáveis.`;

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
