"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Users, Plus, LogOut, ChevronDown, Settings, Sun, Moon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import type { User } from "@supabase/supabase-js";
import { APP_NAME } from "@/lib/branding";

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

  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const emailInitial = user?.email?.[0]?.toUpperCase() ?? "?";
  const emailShort = user?.email ?? "";
  const isAdmin = user?.app_metadata?.is_admin === true;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/saltoverse-mark.svg"
              alt={APP_NAME}
              width={36}
              height={36}
              className="h-9 w-9 object-contain object-left shrink-0"
              priority
              unoptimized
            />
            <span className="font-heading text-lg font-bold tracking-tight text-foreground hidden sm:inline">
              {APP_NAME}
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors duration-150 hidden sm:flex",
                  pathname === "/dashboard" && "text-foreground bg-accent"
                )}
              >
                <Users className="w-4 h-4 mr-2" />
                Alunos
              </Button>
            </Link>

            <Link href="/settings">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors duration-150 hidden sm:flex",
                  pathname === "/settings" && "text-foreground bg-accent"
                )}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </Link>

            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors duration-150 hidden sm:flex",
                    pathname.startsWith("/admin") && "text-foreground bg-accent"
                  )}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}

            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors duration-150"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            )}

            <Link href="/students/new">
              <Button
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-semibold cursor-pointer transition-colors duration-150"
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
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 bg-brand-primary/20 border border-brand-primary-bright/35 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary-bright text-xs font-bold">{emailInitial}</span>
                  </div>
                  <span className="text-muted-foreground text-xs hidden md:block max-w-[120px] truncate">
                    {emailShort}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-muted-foreground/60 text-xs">Conectado como</p>
                        <p className="text-foreground text-sm truncate font-medium">{emailShort}</p>
                      </div>
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm sm:hidden"
                      >
                        <Settings className="w-4 h-4" />
                        Configurações
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 cursor-pointer transition-colors text-sm"
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
