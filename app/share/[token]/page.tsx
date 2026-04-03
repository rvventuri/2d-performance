"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import MetricChart from "@/components/metric-chart";
import { Assessment, AiAnalysisData, ShareAthleteData, METRIC_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { use } from "react";
import {
  Lock,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Zap,
  Target,
  Activity,
} from "lucide-react";

// ─── Metric colour map ────────────────────────────────────────────────────────

const CHART_COLORS: Record<string, string> = {
  cmj: "#1437C9",
  sj: "#2E5BFF",
  abalakov: "#3B82F6",
  rsi: "#8B5CF6",
  tempoContato: "#EC4899",
  alturaSaltoDJ: "#F59E0B",
  cmjEsquerdo: "#10B981",
  cmjDireito: "#06B6D4",
  assimetriaPercentual: "#EF4444",
  saltoHorizontal: "#F97316",
};

const STANDARD_METRICS = Object.keys(METRIC_LABELS) as (keyof typeof METRIC_LABELS)[];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22C55E" : score >= 45 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="48" fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="55"
            cy="55"
            r="48"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground font-heading">{score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center max-w-[120px] leading-tight">{label}</span>
    </div>
  );
}

function AssessmentCard({ assessment, index, total }: { assessment: Assessment; index: number; total: number }) {
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
          <div className="w-2 h-2 rounded-full bg-brand-blue-mid shrink-0" />
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
              <span className="text-muted-foreground text-sm capitalize">{k}</span>
              <span className="font-mono font-bold text-foreground text-sm">{v}</span>
            </div>
          ))}
        </div>
      )}
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/20 mb-2">
            <Lock className="w-6 h-6 text-brand-yellow" />
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
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-yellow/50 text-sm"
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
            className="w-full bg-brand-blue-mid hover:bg-brand-blue-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
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
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-light" />
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

  const latestAssessment = assessments[assessments.length - 1] ?? null;
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
            <Image
              src="/logosemfundo.png"
              alt="2D Performance"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="font-heading font-bold text-sm text-foreground group-hover:text-brand-blue-light transition-colors">
              2D Performance
            </span>
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
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-brand-blue-mid ring-4 ring-brand-blue-mid/10">
                <Image src={student.photoUrl} alt={student.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-blue-mid to-brand-blue-light flex items-center justify-center border-2 border-brand-blue-mid ring-4 ring-brand-blue-mid/10">
                <span className="text-3xl font-bold text-white font-heading">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left space-y-3 flex-1">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">{student.name}</h1>
              <p className="text-brand-blue-light text-sm mt-1">{student.objective}</p>
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

        {/* ─── Score + Performance ─────────────────────────────────────────── */}
        {aiAnalysis && (
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-blue-light" />
              Score de Performance
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreCircle score={aiAnalysis.performanceScore} label={aiAnalysis.profileType} />
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <p className="text-muted-foreground text-sm leading-relaxed">{aiAnalysis.profileDescription}</p>
                {aiAnalysis.objectiveAlignment && (
                  <div className="inline-flex items-center gap-2 bg-brand-blue-mid/10 border border-brand-blue-mid/20 rounded-lg px-3 py-2">
                    <Target className="w-3.5 h-3.5 text-brand-blue-light shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Alinhamento ao objetivo:{" "}
                      <span className="text-foreground font-medium">{aiAnalysis.objectiveAlignment.score}/100</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

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
        {assessments.length >= 2 && (activeMetrics.length > 0 || customMetricKeys.length > 0) && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-yellow" />
              Evolução das métricas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeMetrics.map((key) => (
                <div
                  key={key}
                  className="bg-card border border-border rounded-xl p-5"
                  style={{ borderTopWidth: "2px", borderTopColor: CHART_COLORS[key] ?? "#1437C9" }}
                >
                  <MetricChart
                    assessments={assessments}
                    metricKey={key}
                    label={METRIC_LABELS[key].replace(/ \(.*\)$/, "")}
                    unit={METRIC_LABELS[key].match(/\((.*?)\)/)?.[1] ?? ""}
                    color={CHART_COLORS[key] ?? "#1437C9"}
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
                    label={key}
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
                />
              ))}
            </div>
          )}
        </section>

        {/* ─── Pontos fortes ───────────────────────────────────────────────── */}
        {aiAnalysis?.strengths && aiAnalysis.strengths.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-brand-yellow" />
              Seus pontos fortes
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {aiAnalysis.strengths.map((s, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-5 space-y-2"
                  style={{ borderLeftWidth: "3px", borderLeftColor: "#22C55E" }}
                >
                  <h3 className="font-heading font-bold text-foreground text-sm">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Recomendações ───────────────────────────────────────────────── */}
        {aiAnalysis?.prescriptions && aiAnalysis.prescriptions.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-blue-light" />
              Recomendações para você
            </h2>
            <div className="space-y-4">
              {aiAnalysis.prescriptions.map((p, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-blue-light bg-brand-blue-mid/10 border border-brand-blue-mid/20 rounded px-2 py-0.5">
                          {p.quality}
                        </span>
                        {p.priority === 1 && (
                          <span className="text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-0.5">
                            Prioridade alta
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading font-bold text-foreground">{p.title}</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.rationale}</p>
                  {p.examples?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Exemplos</p>
                      <ul className="space-y-1">
                        {p.examples.map((ex, j) => (
                          <li key={j} className="text-muted-foreground text-sm flex items-start gap-2">
                            <span className="text-brand-blue-light shrink-0 mt-0.5">•</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.frequency && (
                    <p className="text-xs text-muted-foreground">
                      Frequência sugerida:{" "}
                      <span className="text-foreground font-medium">{p.frequency}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Alertas ─────────────────────────────────────────────────────── */}
        {aiAnalysis?.alerts && aiAnalysis.alerts.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
              Pontos de atenção
            </h2>
            <div className="space-y-3">
              {aiAnalysis.alerts.map((alert, i) => {
                const borderColor =
                  alert.priority === "high" ? "#EF4444" : alert.priority === "medium" ? "#F59E0B" : "#64748B";
                return (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-5 space-y-1"
                    style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
                  >
                    <h3 className="font-heading font-bold text-foreground text-sm">{alert.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{alert.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-border pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image src="/logosemfundo.png" alt="2D Performance" width={20} height={20} className="rounded" />
            <span className="text-muted-foreground text-xs font-medium">2D Performance</span>
          </div>
          <span className="text-muted-foreground/50 text-xs">
            Gerado em {new Date().toLocaleDateString("pt-BR")}
          </span>
        </footer>
      </div>
    </div>
  );
}
