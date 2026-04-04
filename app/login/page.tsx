"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/branding";
import { sendGtagEvent } from "@/lib/gtag";
import { OAuthInAppBrowserNotice } from "@/components/oauth-in-app-browser-notice";
import { useLikelyEmbeddedBrowser } from "@/lib/use-likely-embedded-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Loader2,
  BarChart3,
  Brain,
  TrendingUp,
  Share2,
} from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 5.5 + 4) % 100}%`,
    top: `${(i * 6.8 + 8) % 90}%`,
    size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
    delay: `${(i * 0.5) % 5}s`,
    duration: `${6 + (i % 4)}s`,
    opacity: 0.12 + (i % 5) * 0.07,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-brand-primary-bright"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `particle-drift ${p.duration} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

const features = [
  {
    icon: BarChart3,
    label: "Avaliações biomecânicas completas",
    desc: "Salto vertical, força, velocidade e mais",
  },
  {
    icon: Brain,
    label: "Análise de performance com IA",
    desc: "Insights gerados automaticamente por GPT-4o",
  },
  {
    icon: TrendingUp,
    label: "Histórico e evolução do atleta",
    desc: "Gráficos de progresso session a session",
  },
  {
    icon: Share2,
    label: "Relatórios compartilháveis",
    desc: "Link público para atleta e staff",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const embedded = useLikelyEmbeddedBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Não foi possível iniciar o login com Google. Tente novamente.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      sendGtagEvent("login", { method: "email" });
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      if (msg.includes("Invalid login credentials")) {
        setError("E-mail ou senha incorretos.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Confirme seu e-mail antes de fazer login.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #050814 0%, #0b1020 35%, #1e1b4b 65%, #070b14 100%)",
        }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 hero-grid opacity-50" />

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 40% 45%, rgba(20,55,201,0.35) 0%, rgba(46,91,255,0.12) 50%, transparent 80%)",
          }}
        />

        {/* Yellow accent glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "15%",
            right: "10%",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(77,225,193,0.1) 0%, transparent 70%)",
          }}
        />

        <Particles />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/saltoverse-mark.svg"
              alt={APP_NAME}
              width={48}
              height={48}
              className="h-12 w-12 object-contain object-left shrink-0"
              priority
              unoptimized
            />
            <span className="font-heading text-2xl font-bold text-white tracking-tight">
              {APP_NAME}
            </span>
          </Link>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-primary/20 border border-brand-primary-bright/30 rounded-full px-4 py-1.5 mb-8 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse inline-block" />
            <span className="text-brand-primary-bright text-xs font-semibold uppercase tracking-widest">
              Avaliação Esportiva com IA
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-heading font-black text-white mb-4 leading-none tracking-tight"
            style={{ fontSize: "clamp(2.4rem, 3.5vw, 3.5rem)", lineHeight: 1.0 }}
          >
            CADA SALTO{" "}
            <span
              className="text-gradient bg-brand-gradient"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              É UM DADO.
            </span>
            <br />
            <span className="text-brand-accent" style={{ textShadow: "0 0 32px rgba(77,225,193,0.45)" }}>
              CADA DADO
            </span>{" "}
            É UMA DECISÃO.
          </h1>

          <p className="text-white/60 text-base max-w-sm mb-10 leading-relaxed">
            Transforme avaliações biomecânicas em inteligência. IA para decifrar
            a performance do seu atleta — salto por salto.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-primary/30 border border-brand-primary-bright/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-brand-primary-bright" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-white/45 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat pills */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {["500+ Avaliações", "IA Incluída", "100% Grátis"].map((pill) => (
            <span
              key={pill}
              className="text-xs font-semibold text-white/50 border border-white/10 rounded-full px-3 py-1 bg-white/5"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ──────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-background relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-primary/8 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <Image
              src="/saltoverse-mark.svg"
              alt={APP_NAME}
              width={44}
              height={44}
              className="h-11 w-11 object-contain mb-2"
              priority
              unoptimized
            />
            <p className="font-heading text-lg font-bold text-foreground">{APP_NAME}</p>
            <p className="text-muted-foreground text-sm text-center max-w-xs mt-1">
              {APP_DESCRIPTION}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-3xl font-black text-foreground mb-1 tracking-tight">
              ENTRAR
            </h2>
            <p className="text-muted-foreground text-sm">
              Acesse sua conta para continuar
            </p>
          </div>

          <OAuthInAppBrowserNotice active={embedded} authPath="/login" />

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full h-11 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-semibold cursor-pointer text-sm mb-5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuar com Google
          </Button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground tracking-wider">
                ou entre com e-mail
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
              >
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="treinador@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-primary-bright h-11"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
              >
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-primary-bright h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-bold cursor-pointer text-base mt-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              Não tem conta?{" "}
              <Link
                href="/register"
                className="text-brand-primary-bright hover:text-brand-accent font-semibold transition-colors"
              >
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
