import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/app-shell";
import { ThemeProvider } from "next-themes";

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
