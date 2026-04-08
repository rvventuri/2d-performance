"use client";

/**
 * Landing — copy principal alinhada ao pitch amplo (performance + IA).
 * Hooks alternativos para A/B manual ou ferramenta externa:
 * - "Pare de olhar planilhas. Entenda seus dados."
 * - "Seus dados dizem muito. Você só precisa de clareza."
 * - "Transforme métricas em decisões de treino."
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Zap,
  Brain,
  TrendingUp,
  Shield,
  ArrowRight,
  Activity,
  Layers,
  SlidersHorizontal,
  ClipboardList,
  LineChart,
  Share2,
  CheckCircle2,
  Server,
  BadgeCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/branding";
import { getMarketingCtaHref, type AuthPagePath } from "@/lib/public-app-url";

/** Abre em nova aba com URL canônica (NEXT_PUBLIC_APP_URL) para maximizar chance de sair do WebView de apps sociais. */
function MarketingAuthLink({
  path,
  className,
  children,
}: {
  path: AuthPagePath;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={getMarketingCtaHref(path)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function Particles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${(i * 4.5 + 3) % 100}%`,
    top: `${(i * 7.3 + 10) % 90}%`,
    size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
    delay: `${(i * 0.4) % 5}s`,
    duration: `${6 + (i % 4)}s`,
    opacity: 0.15 + (i % 5) * 0.08,
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

export default function LandingPage() {
  const { ref: problemSectionRef, inView: problemInView } = useInView(0.2);
  const { ref: howItWorksRef, inView: howItWorksInView } = useInView(0.12);
  const { ref: metricsSectionRef, inView: metricsInView } = useInView(0.2);
  const { ref: aiSectionRef, inView: aiInView } = useInView(0.2);
  const { ref: personasSectionRef, inView: personasInView } = useInView(0.2);
  const { ref: benefitsSectionRef, inView: benefitsInView } = useInView(0.15);
  const { ref: shareSectionRef, inView: shareInView } = useInView(0.2);
  const { ref: trustSectionRef, inView: trustInView } = useInView(0.2);
  const { ref: ctaSectionRef, inView: ctaInView } = useInView(0.3);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-md bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/saltoverse-mark.svg"
                alt={APP_NAME}
                width={36}
                height={36}
                className="h-9 w-9 object-contain object-left shrink-0"
                priority
                unoptimized
              />
              <span className="font-heading text-lg font-bold text-foreground hidden sm:inline">
                {APP_NAME}
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <MarketingAuthLink
                path="/login"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors hidden sm:block"
              >
                Entrar
              </MarketingAuthLink>
              <MarketingAuthLink
                path="/register"
                className="bg-brand-accent text-brand-accent-foreground text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-accent-glow transition-colors"
              >
                Começar grátis
              </MarketingAuthLink>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-60" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(79,70,229,0.2) 0%, rgba(129,140,248,0.1) 45%, transparent 75%)",
            animation: "radial-pulse 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "10%",
            right: "15%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(77,225,193,0.1) 0%, transparent 70%)",
          }}
        />

        <Particles />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-primary/15 border border-brand-primary-bright/25 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse inline-block" />
            <span className="text-brand-primary-bright text-xs font-semibold uppercase tracking-widest">
              {APP_NAME} — performance tracking com IA
            </span>
          </div>

          <h1
            className="font-heading font-black text-foreground mb-6 leading-tight tracking-tight"
            style={{ fontSize: "clamp(2rem, 6vw, 3.75rem)", lineHeight: 1.08 }}
          >
            Acompanhe a evolução dos seus alunos com clareza — e saiba exatamente o que fazer a seguir.
          </h1>

          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Uma plataforma para profissionais de performance acompanharem métricas, visualizar progresso e receber
            análises com IA que transformam dados em decisões de treino.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MarketingAuthLink
              path="/register"
              className="group relative bg-brand-accent text-brand-accent-foreground font-black text-base px-8 py-4 rounded-xl hover:bg-brand-accent-glow transition-all duration-200 animate-pulse-glow flex items-center gap-2"
            >
              Começar gratuitamente
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </MarketingAuthLink>
            <a
              href="#demo"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Ver demo
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div
            id="demo"
            className="relative mt-16 mx-auto max-w-3xl scroll-mt-24 animate-float"
            style={{ animationDelay: "0.5s" }}
          >
            <div
              className="rounded-2xl overflow-hidden border border-brand-primary-bright/20"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(129,140,248,0.15), 0 32px 80px rgba(11,16,32,0.6), 0 0 120px rgba(79,70,229,0.12)",
              }}
            >
              <div className="bg-card px-4 py-3 flex items-center gap-2 border-b border-border">
                <span className="w-3 h-3 rounded-full bg-destructive/70" />
                <span className="w-3 h-3 rounded-full bg-brand-accent/70" />
                <span className="w-3 h-3 rounded-full bg-[#22C55E]/70" />
                <div className="flex-1 mx-4 bg-secondary rounded-md h-6 flex items-center px-3">
                  <span className="text-muted-foreground text-xs">app.saltoverse.com/dashboard</span>
                </div>
              </div>

              <div className="bg-background p-6">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Alunos", value: "12", color: "#4f46e5" },
                    { label: "Avaliações", value: "47", color: "#818cf8" },
                    { label: "Com histórico", value: "9", color: "#4de1c1" },
                  ].map((s) => (
                    <div key={s.label} className="bg-card border border-border rounded-xl p-3">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{s.label}</p>
                      <p className="font-heading text-2xl font-bold" style={{ color: s.color }}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {[
                    { name: "Mateus Assis", sport: "Futebol · Atacante", status: "IA analisada", statusColor: "#4de1c1" },
                    { name: "Thiago Duarte", sport: "Futvolei · Profissional", status: "Em evolução", statusColor: "#22C55E" },
                    { name: "Gabriel Monteiro", sport: "Futebol · Meia", status: "Alerta ativo", statusColor: "#EF4444" },
                  ].map((a) => (
                    <div
                      key={a.name}
                      className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: "#4f46e51a", color: "#818cf8" }}
                      >
                        {a.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-semibold truncate">{a.name}</p>
                        <p className="text-muted-foreground text-xs">{a.sport}</p>
                      </div>
                      <span className="text-xs font-semibold shrink-0" style={{ color: a.statusColor }}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-12 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse, rgba(79,70,229,0.35) 0%, transparent 70%)",
                filter: "blur(12px)",
              }}
            />
          </div>
        </div>
      </section>

      <section
        ref={problemSectionRef}
        className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div
          className="grid lg:grid-cols-2 gap-12 items-center"
          style={{
            opacity: problemInView ? 1 : 0,
            transform: problemInView ? "none" : "translateY(32px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <div className="bg-card border border-destructive/20 rounded-2xl p-8 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)",
              }}
            />
            <p className="text-destructive text-xs font-bold uppercase tracking-widest mb-4">O problema</p>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4 leading-tight">
              Você coleta dados… mas não consegue usar bem
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Se você trabalha com alunos, provavelmente já passou por isso:
            </p>
            <ul className="space-y-4">
              {[
                "Métricas espalhadas em planilhas, apps e anotações",
                "Dificuldade para visualizar evolução real",
                "Análises manuais que tomam tempo",
                "Incerteza na hora de ajustar o treino",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground text-sm">
                  <span className="w-5 h-5 rounded-full bg-destructive/10 border border-destructive/25 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-foreground text-sm font-medium mt-6">No fim, você tem dados — mas falta clareza.</p>
          </div>

          <div className="bg-card border border-brand-primary-bright/20 rounded-2xl p-8 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)",
              }}
            />
            <p className="text-brand-accent text-xs font-bold uppercase tracking-widest mb-4">A solução</p>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-6 leading-tight">
              Tudo em um só lugar — com inteligência por trás
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Nossa plataforma centraliza o acompanhamento dos seus alunos e adiciona uma camada de IA que ajuda você a
              entender o que está acontecendo.
            </p>
            <ul className="space-y-4">
              {[
                "Registre qualquer tipo de métrica",
                "Visualize evolução ao longo do tempo",
                "Receba análises automáticas e acionáveis",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground text-sm">
                  <span className="w-5 h-5 rounded-full bg-brand-primary/15 border border-brand-primary-bright/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        ref={howItWorksRef}
        className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24"
      >
        <div className="text-center mb-16">
          <p className="text-brand-primary-bright text-xs font-bold uppercase tracking-widest mb-3">Como funciona</p>
          <h2 className="font-heading text-4xl sm:text-5xl font-black text-foreground mb-4">Quatro passos</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Do setup à decisão — sem depender de planilhas soltas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              icon: SlidersHorizontal,
              title: "Configure suas métricas",
              description:
                "Use templates prontos (força, corrida, salto…) ou crie suas próprias métricas e benchmarks.",
              color: "#818cf8",
            },
            {
              step: "02",
              icon: ClipboardList,
              title: "Registre avaliações",
              description: "Salve sessões e acompanhe cada aluno com histórico completo.",
              color: "#4de1c1",
            },
            {
              step: "03",
              icon: LineChart,
              title: "Visualize a evolução",
              description: "Gráficos claros mostram progresso, regressão e padrões ao longo do tempo.",
              color: "#818cf8",
            },
            {
              step: "04",
              icon: Brain,
              title: "Receba insights com IA",
              description: "A plataforma analisa os dados e sugere ajustes de treino em linguagem direta.",
              color: "#4de1c1",
            },
          ].map(({ step, icon: Icon, title, description, color }) => (
            <div
              key={step}
              className="relative"
              style={{
                opacity: howItWorksInView ? 1 : 0,
                transform: howItWorksInView ? "none" : "translateY(24px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              <div className="bg-card border border-border rounded-2xl p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="font-heading text-4xl font-black"
                    style={{
                      background: `linear-gradient(135deg, ${color}60, ${color}20)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {step}
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}15`, boxShadow: `0 0 0 1px ${color}25` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        ref={metricsSectionRef}
        className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div
          className="text-center mb-14"
          style={{
            opacity: metricsInView ? 1 : 0,
            transform: metricsInView ? "none" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <p className="text-brand-primary-bright text-xs font-bold uppercase tracking-widest mb-3">
            Métricas e templates
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-black text-foreground mb-4">Exemplos do que você pode acompanhar</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Do salto e biomecânica a métricas sob medida: escolha o que faz sentido para cada aluno. Inclui CMJ, SJ,
            Abalakov, RSI e campos personalizados.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: "CMJ", desc: "Counter Movement Jump", hot: true },
            { label: "SJ", desc: "Squat Jump" },
            { label: "Abalakov", desc: "Salto com auxílio de braços", hot: true },
            { label: "RSI", desc: "Reactive Strength Index", hot: true },
            { label: "Tempo de contato", desc: "Drop jump" },
            { label: "Altura DJ", desc: "Drop jump" },
            { label: "CMJ esq./dir.", desc: "Assimetria unilateral" },
            { label: "Assimetria %", desc: "Índice bilateral", hot: true },
            { label: "Salto horizontal", desc: "Distância" },
            { label: "Métricas custom", desc: "Crie as suas próprias", hot: true },
          ].map(({ label, desc, hot }, i) => (
            <div
              key={label}
              className="group cursor-default"
              style={{
                opacity: metricsInView ? 1 : 0,
                transform: metricsInView ? "none" : "scale(0.92)",
                transition: `opacity 0.5s ease ${i * 40}ms, transform 0.5s ease ${i * 40}ms`,
              }}
            >
              <div
                className={`
                  relative px-5 py-3 rounded-xl border transition-all duration-200
                  ${
                    hot
                      ? "bg-brand-accent/8 border-brand-accent/30 hover:border-brand-accent/60 hover:bg-brand-accent/12"
                      : "bg-card border-border hover:border-brand-primary-bright/35 hover:bg-brand-primary/10"
                  }
                `}
              >
                <p className={`font-heading text-lg font-bold ${hot ? "text-brand-accent" : "text-foreground"}`}>
                  {label}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
                {hot && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-accent text-brand-accent-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    ★
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        ref={aiSectionRef}
        className="py-24 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(11,16,32,0.5) 0%, rgba(79,70,229,0.2) 50%, rgba(11,16,32,0.5) 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(129,140,248,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="hero-grid absolute inset-0 opacity-30" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div
            style={{
              opacity: aiInView ? 1 : 0,
              transform: aiInView ? "none" : "translateX(-32px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/25 rounded-full px-3 py-1 mb-6">
              <Brain className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-brand-accent text-xs font-bold uppercase tracking-widest">Diferencial</span>
            </div>

            <h2 className="font-heading text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
              Não é só um dashboard.
              <br />
              <span className="text-brand-accent">É um assistente de análise.</span>
            </h2>

            <p className="text-white/70 text-lg leading-relaxed mb-6">
              A IA interpreta os dados considerando tipo de treino, métricas escolhidas e histórico do aluno — e entrega
              leitura da evolução, padrões e sugestões práticas.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-brand-accent text-xs font-bold uppercase tracking-wider mb-3">Considera</p>
                <ul className="space-y-2 text-sm text-white/70">
                  {["Tipo de treino", "Métricas que você configurou", "Histórico do aluno"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-brand-accent text-xs font-bold uppercase tracking-wider mb-3">Entrega</p>
                <ul className="space-y-2 text-sm text-white/70">
                  {["Leitura da evolução", "Identificação de padrões", "Sugestões acionáveis"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <MarketingAuthLink
              path="/register"
              className="inline-flex items-center gap-2 bg-brand-accent text-brand-accent-foreground font-black px-6 py-3 rounded-xl hover:bg-brand-accent-glow transition-colors"
            >
              Experimentar agora
              <ArrowRight className="w-4 h-4" />
            </MarketingAuthLink>
          </div>

          <div
            className="animate-float-slow"
            style={{
              opacity: aiInView ? 1 : 0,
              transform: aiInView ? "none" : "translateX(32px)",
              transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
            }}
          >
            <div
              className="bg-card border border-brand-primary-bright/20 rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 0 0 1px rgba(129,140,248,0.12), 0 24px 60px rgba(11,16,32,0.5)",
              }}
            >
              <div className="bg-brand-depth/40 border-b border-brand-primary-bright/15 px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-accent/15 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-brand-accent" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">Análise IA · Mateus Assis</p>
                  <p className="text-muted-foreground text-xs">Atualizado agora · Futebol · Atacante</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                  <span className="text-brand-accent text-xs font-bold">IA</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Score geral de performance</span>
                    <span className="text-brand-accent font-bold">78 / 100</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: "78%",
                        background: "linear-gradient(90deg, #0b1020, #4f46e5, #818cf8)",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "CMJ", value: "47 cm", status: "Elite", color: "#4de1c1" },
                    { label: "RSI", value: "1.82", status: "Treinado", color: "#818cf8" },
                    { label: "Assimetria", value: "8%", status: "Alerta", color: "#EF4444" },
                    { label: "Abalakov", value: "52 cm", status: "Elite", color: "#4de1c1" },
                  ].map((m) => (
                    <div key={m.label} className="bg-secondary/50 rounded-lg px-3 py-2">
                      <p className="text-muted-foreground text-xs">{m.label}</p>
                      <p className="text-foreground text-sm font-bold">{m.value}</p>
                      <span className="text-xs font-semibold" style={{ color: m.color }}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-brand-primary/10 border border-brand-primary-bright/20 rounded-xl p-4">
                  <p className="text-brand-accent text-xs font-bold mb-2 uppercase tracking-wider">Insight principal</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Evolução consistente no CMJ nas últimas 3 avaliações (+7 cm). Assimetria acima do limite seguro —
                    priorizar trabalho unilateral antes da próxima periodização.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={personasSectionRef}
        className="py-24 max-w-5xl mx-auto px-4 sm:px-6"
      >
        <div
          className="text-center mb-14"
          style={{
            opacity: personasInView ? 1 : 0,
            transform: personasInView ? "none" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <p className="text-brand-primary-bright text-xs font-bold uppercase tracking-widest mb-3">Para quem é</p>
          <h2 className="font-heading text-4xl font-black text-foreground mb-4">Feito para quem acompanha evolução</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Se você acompanha evolução de pessoas, isso é para você.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
          {[
            "Treinadores pessoais",
            "Treinadores de corrida",
            "Preparadores físicos",
            "Fisioterapeutas",
            "Profissionais de performance",
          ].map((label, i) => (
            <div
              key={label}
              className="px-5 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-semibold"
              style={{
                opacity: personasInView ? 1 : 0,
                transform: personasInView ? "none" : "translateY(16px)",
                transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms`,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </section>

      <section
        ref={benefitsSectionRef}
        className="py-24 border-y border-white/5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{
          background: "linear-gradient(180deg, rgba(11,16,32,0.12) 0%, transparent 100%)",
        }}
      >
        <div
          className="text-center mb-14"
          style={{
            opacity: benefitsInView ? 1 : 0,
            transform: benefitsInView ? "none" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <p className="text-brand-primary-bright text-xs font-bold uppercase tracking-widest mb-3">Benefícios</p>
          <h2 className="font-heading text-4xl font-black text-foreground">O que muda no seu dia a dia</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              title: "Economize horas de análise manual",
              body: "Menos tempo colando planilhas e mais tempo com o aluno.",
              icon: Clock,
            },
            {
              title: "Decisões com mais confiança",
              body: "Histórico e IA ajudam a enxergar o que importa antes de mudar o treino.",
              icon: BadgeCheck,
            },
            {
              title: "Valor percebido do seu trabalho",
              body: "Mostre evolução e raciocínio claro — não só números soltos.",
              icon: TrendingUp,
            },
            {
              title: "Retenção com evolução visível",
              body: "Alunos enxergam progresso; você reforça o acompanhamento profissional.",
              icon: Activity,
            },
          ].map(({ title, body, icon: Icon }, i) => (
            <div
              key={title}
              className="flex gap-4 bg-card border border-border rounded-2xl p-6"
              style={{
                opacity: benefitsInView ? 1 : 0,
                transform: benefitsInView ? "none" : "translateY(20px)",
                transition: `opacity 0.55s ease ${i * 80}ms, transform 0.55s ease ${i * 80}ms`,
              }}
            >
              <div className="w-11 h-11 rounded-xl bg-brand-primary/15 border border-brand-primary-bright/25 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                  <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section ref={shareSectionRef} className="py-24 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div
          style={{
            opacity: shareInView ? 1 : 0,
            transform: shareInView ? "none" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-primary/15 border border-brand-primary-bright/25 mb-6 mx-auto">
            <Share2 className="w-7 h-7 text-brand-accent" />
          </div>
          <p className="text-brand-primary-bright text-xs font-bold uppercase tracking-widest mb-3">Compartilhamento</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-foreground mb-4">
            Mostre evolução de forma profissional
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Envie links de acompanhamento para seus alunos, alinhe com a equipe e mantenha tudo organizado — sem
            screenshots perdidos no WhatsApp.
          </p>
          <ul className="text-left max-w-md mx-auto space-y-3 text-muted-foreground text-sm">
            {[
              "Relatórios e visão de progresso para o aluno",
              "Compartilhe com equipe quando fizer sentido",
              "Um lugar só para histórico e contexto",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Share2 className="w-4 h-4 text-brand-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section ref={trustSectionRef} className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div
          className="grid sm:grid-cols-3 gap-8"
          style={{
            opacity: trustInView ? 1 : 0,
            transform: trustInView ? "none" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {[
            {
              icon: Shield,
              title: "Dados isolados por conta",
              body: "Cada profissional vê apenas o que é seu — privacidade em primeiro lugar.",
            },
            {
              icon: Server,
              title: "Arquitetura moderna",
              body: "Stack atual e preparada para crescer com o seu negócio.",
            },
            {
              icon: Layers,
              title: "Uso profissional",
              body: "Pensado para rotina real de quem cobra por acompanhamento.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center mx-auto sm:mx-0 mb-4">
                <Icon className="w-6 h-6 text-brand-primary-bright" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={ctaSectionRef} className="py-28 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #0b1020 0%, #4f46e5 50%, #0b1020 100%)",
          }}
        />
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(129,140,248,0.15) 0%, transparent 70%)",
          }}
        />
        <Particles />

        <div
          className="relative z-10 max-w-3xl mx-auto px-4 text-center"
          style={{
            opacity: ctaInView ? 1 : 0,
            transform: ctaInView ? "none" : "translateY(32px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <h2 className="font-heading font-black text-white mb-4 leading-tight" style={{ fontSize: "clamp(2rem,5vw,3.25rem)" }}>
            Comece a acompanhar melhor seus alunos hoje
          </h2>

          <p className="text-white/65 text-lg mb-10 max-w-xl mx-auto">
            Pare de depender só de planilhas e comece a tomar decisões com base em dados claros e contexto de IA.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MarketingAuthLink
              path="/register"
              className="inline-flex items-center gap-3 bg-brand-accent text-brand-accent-foreground font-black text-base sm:text-lg px-8 py-4 sm:px-10 sm:py-5 rounded-2xl hover:bg-brand-accent-glow transition-all duration-200 animate-pulse-glow"
            >
              Criar conta gratuita
              <ArrowRight className="w-5 h-5" />
            </MarketingAuthLink>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white font-semibold text-sm sm:text-base border border-white/25 rounded-2xl px-6 py-3 sm:px-8 sm:py-4 transition-colors"
            >
              Ver como funciona
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <p className="text-white/35 text-xs mt-8">Sem cartão de crédito para começar.</p>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image
            src="/saltoverse-mark.svg"
            alt={APP_NAME}
            width={32}
            height={32}
            className="h-8 w-8 object-contain opacity-80"
            unoptimized
          />
          <p className="text-muted-foreground text-xs text-center sm:text-left">
            © {new Date().getFullYear()} {APP_NAME} · {APP_DESCRIPTION}
          </p>
          <div className="flex items-center gap-5">
            <MarketingAuthLink
              path="/login"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Entrar
            </MarketingAuthLink>
            <MarketingAuthLink
              path="/register"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Criar conta
            </MarketingAuthLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
