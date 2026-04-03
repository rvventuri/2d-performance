"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname === "/login" || pathname === "/register" || pathname === "/" || pathname.startsWith("/share/");

  return (
    <div className="min-h-screen bg-background">
      {!isPublic && <Navbar />}
      <main className={cn(!isPublic && "pt-16")}>{children}</main>
    </div>
  );
}
