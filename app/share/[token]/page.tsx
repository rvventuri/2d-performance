"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import MetricChart from "@/components/metric-chart";
import { Assessment, AiAnalysisData, ShareAthleteData, METRIC_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { use } from "react";
import { APP_NAME } from "@/lib/branding";
import {
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,

  Zap,
} from "lucide-react";

const SHARE_BRAND = {
  name: "2D Performance",
  logoSrc: "/logo2d.jpg",
} as const;

// ─── Metric colour map ────────────────────────────────────────────────────────

const CHART_COLORS: Record<string, string> = {
  cmj: "#4f46e5",
  sj: "#6366f1",
  abalakov: "#818cf8",
  rsi: "#8B5CF6",
  tempoContato: "#EC4899",
  alturaSaltoDJ: "#F59E0B",
  cmjEsquerdo: "#10B981",
  cmjDireito: "#4de1c1",
  assimetriaPercentual: "#EF4444",
  saltoHorizontal: "#F97316",
};

const STANDARD_METRICS = Object.keys(METRIC_LABELS) as (keyof typeof METRIC_LABELS)[];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AssessmentCard({ assessment, index, total, metricLabels }: { assessment: Assessment; index: number; total: number; metricLabels: Record<string, string> }) {
  const [open, setOpen] = useState(index === total - 1);
  const filledMetrics = STANDARD_METRICS.filter((k) => assessment.metrics[k] !== null && assessment.metrics[k] !== undefined);
  const customEntries = Object.entries(assessment.customMetrics ?? {}).filter(([, v]) => v !== null);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
          <span className="font-heading font-bold text-foreground">
            Avaliação {index + 1}
          </span>
          <span className="text-muted-foreground text-sm">{formatDate(assessment.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filledMetrics.length + customEntries.length} métricas</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2">
          {filledMetrics.map((key) => (
            <div key={key} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground text-sm">{METRIC_LABELS[key]}</span>
              <span className="font-mono font-bold text-foreground text-sm">{assessment.metrics[key]}</span>
            </div>
          ))}
          {customEntries.map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground text-sm">{metricLabels[k] ?? k}</span>
              <span className="font-mono font-bold text-foreground text-sm">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShareBrand({
  size = 28,
  showAppNameFallback = false,
  textClassName,
}: {
  size?: number;
  showAppNameFallback?: boolean;
  textClassName?: string;
}) {
  const name = SHARE_BRAND.name || (showAppNameFallback ? APP_NAME : "");
  return (
    <div className="flex items-center gap-2">
      <Image
        src={SHARE_BRAND.logoSrc}
        alt={name || APP_NAME}
        width={size}
        height={size}
        className="rounded-md"
        priority
      />
      {name ? (
        <span className={textClassName ?? "font-heading font-bold text-sm text-foreground"}>
          {name}
        </span>
      ) : null}
    </div>
  );
}

// ─── Password Gate ────────────────────────────────────────────────────────────

function PasswordGate({ onSubmit, error }: { onSubmit: (pw: string) => void; error?: string }) {
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-3">
            <ShareBrand size={36} showAppNameFallback />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Link protegido</h1>
          <p className="text-muted-foreground text-sm">Seu treinador definiu uma senha para este link.</p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Digite a senha"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pw.trim() && onSubmit(pw.trim())}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-accent/50 text-sm"
          />
          {error && (
            <p className="text-destructive text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
          <button
            type="button"
            disabled={!pw.trim()}
            onClick={() => onSubmit(pw.trim())}
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-bold py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Acessar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Phase = "loading" | "password" | "view" | "not_found" | "error";

const SESSION_KEY = (token: string) => `share_pw_${token}`;

export default function ShareAthletePublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [phase, setPhase] = useState<Phase>("loading");
  const [pwError, setPwError] = useState<string | undefined>();
  const [student, setStudent] = useState<ShareAthleteData["student"] | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisData | null>(null);
  const [customMetricLabels, setCustomMetricLabels] = useState<Record<string, string>>({});

  const fetchData = useCallback(
    async (password?: string) => {
      try {
        const body: Record<string, string> = {};
        if (password) body.password = password;

        const res = await fetch(`/api/share/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.status === 404) { setPhase("not_found"); return; }

        const data = await res.json();

        if (res.status === 403 && data.requiresPassword) { setPhase("password"); return; }
        if (res.status === 401) { setPwError("Senha incorreta"); setPhase("password"); return; }
        if (!res.ok) { setPhase("error"); return; }

        setStudent(data.student);
        setAssessments(data.assessments ?? []);
        setAiAnalysis(data.aiAnalysis ?? null);
        setCustomMetricLabels(data.customMetricLabels ?? {});
        setPwError(undefined);

        if (password) sessionStorage.setItem(SESSION_KEY(token), password);
        setPhase("view");
      } catch {
        setPhase("error");
      }
    },
    [token]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY(token));
    void (async () => { await fetchData(saved ?? undefined); })();
  }, [fetchData, token]);

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary-bright" />
      </div>
    );
  }

  if (phase === "password") {
    return <PasswordGate onSubmit={(pw) => { setPhase("loading"); fetchData(pw); }} error={pwError} />;
  }

  if (phase === "not_found") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-[#F59E0B] mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Link não encontrado</h1>
          <p className="text-muted-foreground text-sm">Este link foi revogado ou nunca existiu.</p>
        </div>
      </div>
    );
  }

  if (phase === "error" || !student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Algo deu errado</h1>
          <p className="text-muted-foreground text-sm">Tente recarregar a página.</p>
        </div>
      </div>
    );
  }

  // ── View phase ────────────────────────────────────────────────────────────

  const activeMetrics = STANDARD_METRICS.filter((key) =>
    assessments.some((a) => a.metrics[key] !== null && a.metrics[key] !== undefined)
  );

  const customMetricKeys = Array.from(
    new Set(assessments.flatMap((a) => Object.keys(a.customMetrics ?? {})))
  ).filter((k) => assessments.some((a) => (a.customMetrics?.[k] ?? null) !== null));

  const bmi = student.weight && student.height
    ? (student.weight / Math.pow(student.height / 100, 2)).toFixed(1)
    : null;

  const evolutionTrendIcon = aiAnalysis?.evolution?.trend === "improving"
    ? <TrendingUp className="w-4 h-4 text-[#22C55E]" />
    : aiAnalysis?.evolution?.trend === "declining"
    ? <TrendingDown className="w-4 h-4 text-[#EF4444]" />
    : <Minus className="w-4 h-4 text-[#F59E0B]" />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Minimal Navbar ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ShareBrand
              showAppNameFallback
              textClassName="font-heading font-bold text-sm text-foreground group-hover:text-brand-primary-bright transition-colors"
            />
          </Link>
          <span className="text-muted-foreground text-xs hidden sm:block">Relatório do Atleta</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* ─── Hero do atleta ───────────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            {student.photoUrl ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-brand-primary ring-4 ring-brand-primary/10">
                <Image src={student.photoUrl} alt={student.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-bright flex items-center justify-center border-2 border-brand-primary ring-4 ring-brand-primary/10">
                <span className="text-3xl font-bold text-primary-foreground font-heading">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left space-y-3 flex-1">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">{student.name}</h1>
              <p className="text-brand-primary-bright text-sm mt-1">{student.objective}</p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs">
              {student.age > 0 && (
                <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                  {student.age} anos
                </span>
              )}
              {student.weight > 0 && (
                <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                  {student.weight} kg
                </span>
              )}
              {student.height > 0 && (
                <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                  {student.height} cm
                </span>
              )}
              {bmi && (
                <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                  IMC {bmi}
                </span>
              )}
              <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                {assessments.length} avaliação{assessments.length !== 1 ? "ões" : ""}
              </span>
            </div>
          </div>
        </section>

        {/* ─── Mensagem de evolução ─────────────────────────────────────────── */}
        {aiAnalysis?.evolution && (
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              {evolutionTrendIcon}
              Sua evolução
            </h2>
            <p className="text-foreground font-medium">{aiAnalysis.evolution.highlight}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{aiAnalysis.evolution.details}</p>
            {aiAnalysis.evolution.keyMetrics?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {aiAnalysis.evolution.keyMetrics.map((km) => (
                  <div
                    key={km.label}
                    className="flex items-center gap-1.5 bg-secondary rounded-lg px-3 py-1.5 text-xs"
                  >
                    {km.direction === "up" && <TrendingUp className="w-3 h-3 text-[#22C55E]" />}
                    {km.direction === "down" && <TrendingDown className="w-3 h-3 text-destructive" />}
                    {km.direction === "flat" && <Minus className="w-3 h-3 text-[#F59E0B]" />}
                    <span className="text-muted-foreground">{km.label}</span>
                    <span
                      className={`font-bold ${
                        km.direction === "up" ? "text-[#22C55E]" : km.direction === "down" ? "text-destructive" : "text-[#F59E0B]"
                      }`}
                    >
                      {km.change > 0 ? "+" : ""}
                      {km.change.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── Gráficos de evolução ────────────────────────────────────────── */}
        {assessments.length >= 1 && (activeMetrics.length > 0 || customMetricKeys.length > 0) && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-accent" />
              Evolução das métricas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeMetrics.map((key) => (
                <div
                  key={key}
                  className="bg-card border border-border rounded-xl p-5"
                  style={{ borderTopWidth: "2px", borderTopColor: CHART_COLORS[key] ?? "#4f46e5" }}
                >
                  <MetricChart
                    assessments={assessments}
                    metricKey={key}
                    label={METRIC_LABELS[key].replace(/ \(.*\)$/, "")}
                    unit={METRIC_LABELS[key].match(/\((.*?)\)/)?.[1] ?? ""}
                    color={CHART_COLORS[key] ?? "#4f46e5"}
                  />
                </div>
              ))}
              {customMetricKeys.map((key) => (
                <div
                  key={key}
                  className="bg-card border border-border rounded-xl p-5"
                  style={{ borderTopWidth: "2px", borderTopColor: "#8B5CF6" }}
                >
                  <MetricChart
                    assessments={assessments}
                    metricKey={key}
                    label={customMetricLabels[key] ?? key}
                    unit=""
                    color="#8B5CF6"
                    isCustom
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Histórico de avaliações ─────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-foreground">
            Histórico de avaliações
          </h2>
          {assessments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma avaliação registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {[...assessments].reverse().map((a, i) => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  index={assessments.length - 1 - i}
                  total={assessments.length}
                  metricLabels={customMetricLabels}
                />
              ))}
            </div>
          )}
        </section>

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-border pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShareBrand
              size={20}
              showAppNameFallback
              textClassName="text-muted-foreground text-xs font-medium"
            />
          </div>
          <span className="text-muted-foreground/50 text-xs">
            Gerado em {new Date().toLocaleDateString("pt-BR")}
          </span>
        </footer>
      </div>
    </div>
  );
}
