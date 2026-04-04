"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Zap,
  BarChart3,
  Brain,
  TrendingUp,
  Shield,
  ArrowRight,
  Activity,
  Target,
  Layers,
} from "lucide-react";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/branding";

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function useCountUp(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration, active]);
  return count;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function StatCounter({
  value,
  suffix,
  label,
  active,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, 1600, active);
  return (
    <div className="text-center">
      <p className="font-heading text-5xl sm:text-6xl font-black text-foreground">
        {count}
        <span className="text-brand-accent">{suffix}</span>
      </p>
      <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest font-medium">{label}</p>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { ref: statsSectionRef, inView: statsInView } = useInView(0.3);
  const { ref: problemSectionRef, inView: problemInView } = useInView(0.2);
  const { ref: featuresSectionRef, inView: featuresInView } = useInView(0.1);
  const { ref: aiSectionRef, inView: aiInView } = useInView(0.2);
  const { ref: metricsSectionRef, inView: metricsInView } = useInView(0.2);
  const { ref: sportsSectionRef, inView: sportsInView } = useInView(0.2);
  const { ref: ctaSectionRef, inView: ctaInView } = useInView(0.3);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── NAV PÚBLICA ─────────────────────────────────────────────────── */}
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
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors hidden sm:block"
              >
                Entrar
              </Link>
              <Link
                href="/login"
                className="bg-brand-accent text-brand-accent-foreground text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-accent-glow transition-colors"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 hero-grid opacity-60" />

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(79,70,229,0.2) 0%, rgba(129,140,248,0.1) 45%, transparent 75%)",
            animation: "radial-pulse 8s ease-in-out infinite",
          }}
        />
        {/* Second glow — accent ciano */}
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
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-primary/15 border border-brand-primary-bright/25 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse inline-block" />
            <span className="text-brand-primary-bright text-xs font-semibold uppercase tracking-widest">
              Avaliação de Performance Esportiva com IA
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-heading font-black text-foreground mb-6 leading-none tracking-tight"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)", lineHeight: 1.0 }}
          >
            CADA SALTO{" "}
            <span
              className="text-gradient bg-brand-gradient"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              É UM DADO.
            </span>
            <br />
            CADA DADO{" "}
            <span className="text-brand-accent text-glow">É UMA DECISÃO.</span>
          </h1>

          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Transforme avaliações biomecânicas em inteligência. O{" "}
            <span className="text-foreground font-semibold">{APP_NAME}</span> usa IA para decifrar
            a performance do seu atleta — salto por salto, avaliação por avaliação — e entregar
            os insights que mudam o planejamento.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group relative bg-brand-accent text-brand-accent-foreground font-black text-base px-8 py-4 rounded-xl hover:bg-brand-accent-glow transition-all duration-200 animate-pulse-glow flex items-center gap-2"
            >
              Começar Agora — É Grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Ver como funciona
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Floating mock UI */}
          <div
            className="relative mt-16 mx-auto max-w-3xl animate-float"
            style={{ animationDelay: "0.5s" }}
          >
            <div
              className="rounded-2xl overflow-hidden border border-brand-primary-bright/20"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(129,140,248,0.15), 0 32px 80px rgba(11,16,32,0.6), 0 0 120px rgba(79,70,229,0.12)",
              }}
            >
              {/* Mock toolbar */}
              <div className="bg-card px-4 py-3 flex items-center gap-2 border-b border-border">
                <span className="w-3 h-3 rounded-full bg-destructive/70" />
                <span className="w-3 h-3 rounded-full bg-brand-accent/70" />
                <span className="w-3 h-3 rounded-full bg-[#22C55E]/70" />
                <div className="flex-1 mx-4 bg-secondary rounded-md h-6 flex items-center px-3">
                  <span className="text-muted-foreground text-xs">app.saltoverse.com/dashboard</span>
                </div>
              </div>

              {/* Mock dashboard content */}
              <div className="bg-background p-6">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Atletas", value: "12", color: "#4f46e5" },
                    { label: "Avaliações", value: "47", color: "#818cf8" },
                    { label: "Com histórico", value: "9", color: "#4de1c1" },
                  ].map((s) => (
                    <div key={s.label} className="bg-card border border-border rounded-xl p-3">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{s.label}</p>
                      <p
                        className="font-heading text-2xl font-bold"
                        style={{ color: s.color }}
                      >
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Mock athlete list */}
                <div className="space-y-2">
                  {[
                    { name: "Mateus Assis", sport: "Futebol · Atacante", status: "IA Analisada", statusColor: "#4de1c1" },
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
                      <span
                        className="text-xs font-semibold shrink-0"
                        style={{ color: a.statusColor }}
                      >
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Glow under the card */}
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

      {/* ── STATS BAR ───────────────────────────────────────────────────── */}
      <div
        ref={statsSectionRef}
        className="relative py-20 border-y border-white/5"
        style={{
          background:
            "linear-gradient(90deg, rgba(11,16,32,0.25), rgba(79,70,229,0.15), rgba(11,16,32,0.25))",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-10">
          <StatCounter value={500} suffix="+" label="Avaliações realizadas" active={statsInView} />
          <StatCounter value={12} suffix="+" label="Métricas biomecânicas" active={statsInView} />
          <StatCounter value={3} suffix="x" label="Mais rápido que planilha" active={statsInView} />
          <StatCounter value={100} suffix="%" label="Análise por IA" active={statsInView} />
        </div>
      </div>

      {/* ── PROBLEMA → SOLUÇÃO ──────────────────────────────────────────── */}
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
          {/* Problema */}
          <div className="bg-card border border-destructive/20 rounded-2xl p-8 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)",
              }}
            />
            <p className="text-destructive text-xs font-bold uppercase tracking-widest mb-4">Sem o {APP_NAME}</p>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-6 leading-tight">
              Seu atleta está evoluindo.
              <br />
              <span className="text-destructive">Mas você tem certeza disso?</span>
            </h2>
            <ul className="space-y-4">
              {[
                "Dados de avaliação espalhados em papel, WhatsApp e planilhas",
                "Análise manual que demora horas — ou simplesmente não acontece",
                "Sem visualização de evolução ao longo do tempo",
                "Relatórios genéricos que não falam sobre o atleta específico",
                "Assimetrias e alertas que passam despercebidos entre avaliações",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground text-sm">
                  <span className="w-5 h-5 rounded-full bg-destructive/10 border border-destructive/25 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Solução */}
          <div className="bg-card border border-brand-primary-bright/20 rounded-2xl p-8 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)",
              }}
            />
            <p className="text-brand-accent text-xs font-bold uppercase tracking-widest mb-4">Com o {APP_NAME}</p>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-6 leading-tight">
              Dados organizados.
              <br />
              <span className="text-brand-primary-bright">Decisões certeiras.</span>
            </h2>
            <ul className="space-y-4">
              {[
                "Avaliações estruturadas por atleta, com histórico completo e acessível",
                "IA analisa todo o histórico e entrega insights em segundos",
                "Gráficos de evolução que mostram exatamente o quanto o atleta cresceu",
                "Relatório personalizado com pontos fortes, alertas e próximos passos",
                "Assimetrias e padrões detectados automaticamente a cada avaliação",
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

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section
        id="features"
        ref={featuresSectionRef}
        className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-16">
          <p className="text-brand-primary-bright text-xs font-bold uppercase tracking-widest mb-3">Funcionalidades</p>
          <h2 className="font-heading text-5xl sm:text-6xl font-black text-foreground mb-4">
            TUDO QUE UM TREINADOR
            <br />
            <span className="text-brand-accent">DE ELITE PRECISA</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Do cadastro do atleta à análise de IA — uma plataforma que faz o trabalho pesado enquanto você foca no que importa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: Activity,
              title: "Avaliações Estruturadas",
              description:
                "CMJ, SJ, Abalakov, RSI, assimetria e muito mais. Dados organizados, histórico sempre acessível.",
              color: "#818cf8",
              delay: 0,
            },
            {
              icon: Brain,
              title: "Análise por IA",
              description:
                "Claude analisa todo o histórico do atleta e entrega um relatório em linguagem humana: pontos fortes, alertas e próximos passos.",
              color: "#4de1c1",
              delay: 100,
            },
            {
              icon: TrendingUp,
              title: "Evolução Visual",
              description:
                "Gráficos de linha que mostram exatamente quanto o atleta cresceu entre cada avaliação ao longo do tempo.",
              color: "#818cf8",
              delay: 200,
            },
            {
              icon: Target,
              title: "Relatório de Performance",
              description:
                "Insights automáticos, benchmarks por nível e recomendações personalizadas baseadas no objetivo do atleta.",
              color: "#4de1c1",
              delay: 300,
            },
          ].map(({ icon: Icon, title, description, color, delay }) => (
            <div
              key={title}
              className="group bg-card border border-border hover:border-brand-primary-bright/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              style={{
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? "none" : "translateY(28px)",
                transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.3s`,
                boxShadow: "0 4px 24px rgba(10,10,10,0.4)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
                }}
              />
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${color}1a`, boxShadow: `0 0 0 1px ${color}25` }}
              >
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-3">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI SPOTLIGHT ────────────────────────────────────────────────── */}
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
          {/* Text */}
          <div
            style={{
              opacity: aiInView ? 1 : 0,
              transform: aiInView ? "none" : "translateX(-32px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/25 rounded-full px-3 py-1 mb-6">
              <Brain className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-brand-accent text-xs font-bold uppercase tracking-widest">Inteligência Artificial</span>
            </div>

            <h2 className="font-heading text-5xl sm:text-6xl font-black text-white mb-6 leading-none">
              O TREINADOR DEFINE
              <br />O OLHO CLÍNICO.
              <br />
              <span className="text-brand-accent">A IA FAZ O</span>
              <br />
              <span className="text-brand-accent">TRABALHO PESADO.</span>
            </h2>

            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Você avalia. O {APP_NAME} lê todo o histórico do atleta, identifica padrões que o olho humano perde e entrega um laudo completo — em linguagem humana, sem você precisar escrever uma linha.
            </p>

            <ul className="space-y-3 mb-10">
              {[
                "Análise de tendências entre múltiplas avaliações",
                "Identificação automática de assimetrias e alertas",
                "Recomendações personalizadas por esporte e objetivo",
                "Comparação com benchmarks recreacional, treinado e elite",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="w-5 h-5 rounded-full bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center shrink-0">
                    <Zap className="w-2.5 h-2.5 text-brand-accent" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-brand-accent text-brand-accent-foreground font-black px-6 py-3 rounded-xl hover:bg-brand-accent-glow transition-colors"
            >
              Experimentar agora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mock AI analysis card */}
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
              {/* Card header */}
              <div className="bg-brand-depth/40 border-b border-brand-primary-bright/15 px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-accent/15 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-brand-accent" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">Análise IA · Mateus Assis</p>
                  <p className="text-muted-foreground text-xs">Gerado agora · Futebol · Atacante</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                  <span className="text-brand-accent text-xs font-bold">IA</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Score bar */}
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

                {/* Metrics summary */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "CMJ", value: "47 cm", status: "elite", color: "#4de1c1" },
                    { label: "RSI", value: "1.82", status: "treinado", color: "#818cf8" },
                    { label: "Assimetria", value: "8%", status: "alerta", color: "#EF4444" },
                    { label: "Abalakov", value: "52 cm", status: "elite", color: "#4de1c1" },
                  ].map((m) => (
                    <div key={m.label} className="bg-secondary/50 rounded-lg px-3 py-2">
                      <p className="text-muted-foreground text-xs">{m.label}</p>
                      <p className="text-foreground text-sm font-bold">{m.value}</p>
                      <span className="text-xs font-semibold" style={{ color: m.color }}>
                        ↑ {m.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Insight text */}
                <div className="bg-brand-primary/10 border border-brand-primary-bright/20 rounded-xl p-4">
                  <p className="text-brand-accent text-xs font-bold mb-2 uppercase tracking-wider">Insight Principal</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Mateus apresentou evolução consistente no CMJ nas últimas 3 avaliações (+7cm). A assimetria de tornozelo (8%) está acima do limite seguro — recomenda-se trabalho de fortalecimento unilateral antes da próxima periodização.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS SHOWCASE ───────────────────────────────────────────── */}
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
          <p className="text-brand-primary-bright text-xs font-bold uppercase tracking-widest mb-3">Métricas</p>
          <h2 className="font-heading text-5xl font-black text-foreground mb-4">
            O QUE VOCÊ AVALIA
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Métricas biomecânicas validadas cientificamente para avaliação de performance neuromuscular e salto.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: "CMJ", desc: "Counter Movement Jump", hot: true },
            { label: "SJ", desc: "Squat Jump" },
            { label: "Abalakov", desc: "Salto com auxílio de braços", hot: true },
            { label: "RSI", desc: "Reactive Strength Index", hot: true },
            { label: "Tempo de Contato", desc: "Drop Jump" },
            { label: "Altura do Salto DJ", desc: "Drop Jump" },
            { label: "CMJ Esquerdo", desc: "Assimetria unilateral" },
            { label: "CMJ Direito", desc: "Assimetria unilateral" },
            { label: "Assimetria %", desc: "Índice bilateral", hot: true },
            { label: "Salto Horizontal", desc: "Distância" },
            { label: "Métricas Custom", desc: "Crie as suas próprias" },
          ].map(({ label, desc, hot }, i) => (
            <div
              key={label}
              className="group cursor-default"
              style={{
                opacity: metricsInView ? 1 : 0,
                transform: metricsInView ? "none" : "scale(0.92)",
                transition: `opacity 0.5s ease ${i * 50}ms, transform 0.5s ease ${i * 50}ms`,
              }}
            >
              <div
                className={`
                  relative px-5 py-3 rounded-xl border transition-all duration-200
                  ${hot
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

      {/* ── ESPORTES ────────────────────────────────────────────────────── */}
      <section
        ref={sportsSectionRef}
        className="py-20 border-y border-white/5"
        style={{
          background: "linear-gradient(180deg, rgba(11,16,32,0.15) 0%, transparent 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-10 font-medium">
            Otimizado para
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { label: "Futebol", icon: "⚽", ready: true },
              { label: "Futvolei", icon: "🏐", ready: true },
              { label: "Basquete", icon: "🏀", ready: false },
              { label: "Atletismo", icon: "🏃", ready: false },
              { label: "CrossFit", icon: "🏋️", ready: false },
            ].map(({ label, icon, ready }, i) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2"
                style={{
                  opacity: sportsInView ? (ready ? 1 : 0.4) : 0,
                  transform: sportsInView ? "none" : "translateY(20px)",
                  transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`,
                }}
              >
                <div
                  className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border
                    ${ready
                      ? "bg-brand-primary/15 border-brand-primary-bright/30"
                      : "bg-card border-border"
                    }
                  `}
                >
                  {icon}
                </div>
                <p className={`text-sm font-semibold ${ready ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </p>
                {!ready && (
                  <span className="text-muted-foreground text-xs">Em breve</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────────────── */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-brand-primary-bright text-xs font-bold uppercase tracking-widest mb-3">Processo</p>
          <h2 className="font-heading text-5xl font-black text-foreground">
            SIMPLES ASSIM
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              icon: Layers,
              title: "Cadastre o Atleta",
              description: "Nome, esporte, objetivo e foto. Em menos de 1 minuto seu atleta já está na plataforma.",
              color: "#818cf8",
            },
            {
              step: "02",
              icon: BarChart3,
              title: "Registre a Avaliação",
              description: "Insira os dados biomecânicos coletados. A plataforma organiza, calcula e salva tudo automaticamente.",
              color: "#4de1c1",
            },
            {
              step: "03",
              icon: Shield,
              title: "Receba a Análise",
              description: "Com um clique, a IA analisa o histórico completo e entrega um laudo detalhado e acionável.",
              color: "#818cf8",
            },
          ].map(({ step, icon: Icon, title, description, color }) => (
            <div key={step} className="relative">
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

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section
        ref={ctaSectionRef}
        className="py-28 relative overflow-hidden"
      >
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
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-3.5 h-3.5 text-brand-accent" />
            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
              Setup em menos de 5 minutos
            </span>
          </div>

          <h2 className="font-heading font-black text-white mb-6 leading-none" style={{ fontSize: "clamp(2.5rem,6vw,4.5rem)" }}>
            SEU PRÓXIMO ATLETA
            <br />DE ALTO RENDIMENTO
            <br />
            <span className="text-brand-accent">COMEÇA COM UM DADO.</span>
          </h2>

          <p className="text-white/60 text-lg mb-10">
            Plataforma completa. Sem planilhas, sem papel, sem achismo.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-brand-accent text-brand-accent-foreground font-black text-lg px-10 py-5 rounded-2xl hover:bg-brand-accent-glow transition-all duration-200 animate-pulse-glow"
          >
            CRIAR CONTA GRÁTIS
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="text-white/30 text-xs mt-6">
            Sem cartão de crédito · Sem limite de atletas no teste
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
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
            <Link href="/login" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
              Entrar
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
