import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "2D Performance",
  description: "Plataforma de avaliação de performance esportiva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
