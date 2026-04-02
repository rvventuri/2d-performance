"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className="min-h-screen bg-[#020617]">
      {!isLogin && <Navbar />}
      <main className={cn(!isLogin && "pt-16")}>{children}</main>
    </div>
  );
}
