import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield } from "lucide-react";
import { APP_NAME } from "@/lib/branding";

export const metadata = {
  title: `Admin — ${APP_NAME}`,
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = user.app_metadata?.is_admin === true;
  if (!isAdmin) redirect("/dashboard");

  return (
    <>
      <div className="bg-brand-depth/40 border-b border-brand-primary-bright/20 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-primary-bright text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Painel Admin</span>
          </div>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}
