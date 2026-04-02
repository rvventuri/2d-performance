"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Users, Plus, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const emailInitial = user?.email?.[0]?.toUpperCase() ?? "?";
  const emailShort = user?.email ?? "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#22C55E] rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#020617]" strokeWidth={2.5} />
            </div>
            <span className="font-heading text-xl font-bold text-white tracking-wide">
              2D <span className="text-[#22C55E]">PERFORMANCE</span>
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer transition-colors duration-150 hidden sm:flex",
                  pathname === "/" && "text-white bg-[#1E293B]"
                )}
              >
                <Users className="w-4 h-4 mr-2" />
                Alunos
              </Button>
            </Link>

            <Link href="/students/new">
              <Button
                size="sm"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-[#020617] font-semibold cursor-pointer transition-colors duration-150"
              >
                <Plus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Novo Aluno</span>
              </Button>
            </Link>

            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-[#1E293B] cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 bg-[#22C55E]/20 border border-[#22C55E]/30 rounded-full flex items-center justify-center">
                    <span className="text-[#22C55E] text-xs font-bold">{emailInitial}</span>
                  </div>
                  <span className="text-[#94A3B8] text-xs hidden md:block max-w-[120px] truncate">
                    {emailShort}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#475569]" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-xl z-20 overflow-hidden">
                      <div className="px-3 py-2 border-b border-[#1E293B]">
                        <p className="text-[#475569] text-xs">Conectado como</p>
                        <p className="text-white text-sm truncate font-medium">{emailShort}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/5 cursor-pointer transition-colors text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
